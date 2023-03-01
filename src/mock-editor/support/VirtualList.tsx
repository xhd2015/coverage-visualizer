import React, { Component, CSSProperties, MutableRefObject, useEffect, useRef, useState, useLayoutEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import lodash from "lodash"
import { FixedSizeList } from "react-window";
import { useCurrent } from '../react-hooks';
import VirtualScroll from "react-dynamic-virtual-scroll";
import "./VirtualList.css"
import { createRoot } from 'react-dom/client';

type Key = {
    key?: string | number
}

export interface VirtualListController {
    scrollTo: (index: number) => void
}
export interface VirtualListProps<T extends Key> {
    style?: CSSProperties
    items?: T[]
    renderItem?: (item: T, i: number) => any
    controllerRef?: MutableRefObject<VirtualListController>

    maxLeading?: number // default unlimited
    maxTrailing?: number // default unlimited
    maxRendering?: number // default unlimited

    getScrollParent?: (el: HTMLElement) => HTMLElement // default el.parentElement
}


export default function <T extends Key>(props: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>()
    const virtualComponentRef = useRef<IVirtualCompoment<T>>()
    if (props.controllerRef) {
        props.controllerRef.current = {
            scrollTo(index) {
                // console.log("[DEBUG] scroll begin", new Date(), index)
                virtualComponentRef.current.scrollTo(index)
                // console.log("[DEBUG] scroll end", new Date())
            },
        }
    }

    const itemsRef = useCurrent(props.items)
    useEffect(() => {
        virtualComponentRef.current = new VirtualCompoment<T>({
            container: containerRef.current,
            maxRendering: 10,
            renderItem: (item, i, container) => {
                const div = document.createElement("div")
                div.classList.add("fade-in", "fade-out")
                const root = createRoot(div)
                root.render(props.renderItem(item, i))
                return div
            },
            async loadItems(index, count) {
                return itemsRef.current?.slice?.(index, Math.min(index + count, itemsRef.current?.length ?? 0))
            },
        })
        return () => virtualComponentRef.current.dispose()
    }, [])

    useEffect(() => {
        virtualComponentRef.current.reset()
    }, [props.items])

    return <div style={props.style} ref={containerRef}>
    </div>
}

export interface VirtualComponentOptions<T extends Key> {
    // immutable
    getScrollParent?: (container: HTMLElement) => HTMLElement // default container.parentElement
    container: HTMLElement

    renderItem?: (item: T, i: number, container: HTMLElement) => HTMLElement

    // loadMore
    loadItems: (index: number, count: number) => Promise<T[]>

    // mutable
    maxRendering: number // must be set explicitly, maybe only for initial rendering
}

export interface IVirtualCompoment<T> {
    updateOptions(opts: Partial<VirtualComponentOptions<T>>)
    reset: () => void
    scrollTo: (index: number) => void


    dispose: () => void
}

class VirtualCompoment<T> implements IVirtualCompoment<T> {
    opts: VirtualComponentOptions<T>

    items?: T[]
    baseIndex: number
    loadedNum: number

    container: HTMLElement
    scrollParent: HTMLElement

    // state
    loading: boolean
    cachedItems: { [index: number]: HTMLElement } // trigger load exactly once
    mounted: { [index: number]: HTMLElement }
    _handlersRemove: (() => void)[]

    constructor(opts: VirtualComponentOptions<T>) {
        if (!opts?.container) {
            throw new Error("requires container")
        }
        if (!opts?.renderItem) {
            throw new Error("requires renderItem")
        }
        this.opts = opts
        this.container = opts.container

        this.scrollParent = opts?.getScrollParent ? opts.getScrollParent(opts.container) : opts.container.parentElement
        if (!this.scrollParent) {
            throw new Error("scrollParent not found")
        }

        // reset state
        this.reset()
    }
    updateOptions(opts: Partial<VirtualComponentOptions<T>>) {
        this.opts = { ...this.opts, ...opts }
    }

    _setupScrollHandler() {
        const scrollParent = this.scrollParent
        const container = this.container
        const getOpts = () => this.opts

        let _this = this

        // when scroll up, ignore the event
        let savedScrollTop: number

        // init state: first item at position 0
        // fact: there will only be at most one first child, and one last child
        // because children does not overlap
        // NOTE: first and last child can be the same
        const handler = e => {
            // special callback, do not rely on this
            const { baseIndex, loadedNum, loading } = this
            const { maxRendering, loadItems } = this.opts
            const setLoading = (b: boolean) => this.loading = b

            const scrollParent: HTMLElement = e.target
            const lastScrollTop = savedScrollTop
            savedScrollTop = scrollParent.scrollTop // change when scroll

            if (loading) {
                return
            }

            // calculate the slice
            if (!(maxRendering > 0)) {
                throw new Error("option maxRendering should be positive")
            }

            const { firstChildIndex, firstChild, lastChildIndex, lastChild } = findFirstLastChildren(scrollParent, container)
            // console.log("find child:", firstChildIndex, lastChildIndex)

            // calcaulte previous items
            if (typeof lastScrollTop === 'number' && savedScrollTop <= lastScrollTop) {
                // scroll up
                // console.log("DEBUG scroll up:", firstChildIndex, lastChildIndex)
                // if (savedScrollTop === lastScrollTop) {
                //     return
                // }
                const firstIndex = this.baseIndex + firstChildIndex
                // scroll up, ignore the event
                // if scroll up, we prepend previous element
                if (firstIndex > 0) {
                    // load previous 1 item
                    const loadBefore = 4
                    // firstIndex=6, base=2  [0,1,2,3,4,5,6]
                    // load: 2,3,4,5
                    let base = firstIndex - loadBefore
                    let actualLoadBefore = loadBefore
                    if (base < 0) {
                        actualLoadBefore += base
                        base = 0
                    }
                    const savedOffset = getOffsetHeightParent(container, firstChild)

                    setLoading(true)
                    Promise.resolve(loadItems?.(base, actualLoadBefore)).then(items => {
                        // insert reversely
                        let last = firstChild
                        for (let i = items?.length - 1; i >= 0; i--) {
                            const item = items[i]
                            const anchor = last
                            const el = this._renderItemCached(item, base + i)
                            last = el
                            if (this.mounted[base + i]) {
                                return
                            }

                            this.container.insertBefore(el, anchor)
                            this.mounted[base + i] = el
                            this.baseIndex--
                        }
                    }).finally(() => setLoading(false))
                }
                return
            }

            // scroll down
            // console.log("DEBUG scroll down:", firstChildIndex, lastChildIndex)

            // load N from firstChildIndex
            // there are 'firstChildIndex' element ahead, 
            // so the trailing need to load these more items as
            // complement
            console.log("render:", loadedNum, firstChildIndex, maxRendering)
            const newNum = firstChildIndex
            if (loadedNum - newNum >= maxRendering) { // already satisfied
                // console.log("loaded num satisfied:", loadedNum, newNum, maxRendering)
                return
            }
            // protect rendering
            this._loadRange(baseIndex + loadedNum, newNum)
        }
        const handlerDebounced = lodash.debounce(handler, 200)
        // const handlerDebounced = handler
        scrollParent.addEventListener('scroll', handlerDebounced)
        // scrollParent.addEventListener('wheel', handlerDebounced)

        // initial load
        this._loadRange(this.baseIndex, this.opts.maxRendering)
        this._handlersRemove.push(() => {
            scrollParent.removeEventListener('scroll', handlerDebounced)
            // scrollParent.removeEventListener('wheel', handlerDebounced)
        })
    }

    _bindListeners() {
    }

    // must ensure not loading
    // index is absolute
    async _loadRange(index: number, num: number) {
        if (num <= 0) {
            return
        }
        // console.log("DEBUG load range :", index, index + num, ", current range:", this.baseIndex, this.baseIndex + this.loadedNum)

        const endIndex = index + num
        // already loaded
        if (endIndex <= this.loadedNum) {
            // console.log("DEBUG already loaded range :", index, index + num)
            return
        }

        let _this = this
        const { container } = this
        const { loadItems } = this.opts

        const setLoading = (b: boolean) => _this.loading = b

        setLoading(true)
        await Promise.resolve(loadItems?.(index, num))?.then(newItems => {
            newItems.forEach((item, i) => {
                let el = this._renderItemCached(item, index + i)
                this.container.appendChild(el)
                this.mounted[index + i] = el
                this.loadedNum++
            })
        }).finally(() => {
            setLoading(false)
            // console.log("DEBUG load range done:", index, index + num, ", current range:", this.baseIndex, this.baseIndex + this.loadedNum)
        })
    }

    _renderItemCached(item: T, index: number) {
        let { renderItem } = this.opts
        let el = this.cachedItems[index]
        if (!el) {
            el = renderItem(item, index, this.container)
            this.cachedItems[index] = el
        }
        return el
    }

    // mount to container
    mount(el: HTMLElement) {

    }

    reset() {
        // console.log("DEBUG items reset")
        this.baseIndex = 0
        this.loadedNum = 0
        this.cachedItems = {}
        this.mounted = {}
        this.loading = false
        // remove all children
        for (let p = this.container.firstElementChild; p;) {
            let next = p.nextElementSibling
            p.remove()
            p = next
        }
        const handlersRemove = this._handlersRemove
        this._handlersRemove = []
        handlersRemove?.forEach?.(h => h())

        this.scrollParent.scrollTo({ behavior: "smooth", top: 0 })
        this._setupScrollHandler()
    }

    async scrollTo(index: number) {
        // console.log("DEBUG scrollTo:", index)
        if (this.loading) {
            return
        }
        // remove all child
        for (let p = this.container.firstElementChild; p;) {
            let next = p.nextElementSibling
            p.remove()
            p = next
        }
        this.loadedNum = 0
        this.mounted = {}

        if (index > 0) {
            this.baseIndex = index - 1
            await this._loadRange(index - 1, this.opts.maxRendering + 1)
            this.scrollParent.scrollTo({ behavior: "smooth", top: getOffsetHeightParent(this.container, this.mounted[index]) })
        } else {
            this.baseIndex = index
            await this._loadRange(index, this.opts.maxRendering)
            this.scrollParent.scrollTo({ behavior: "smooth", top: 0 })
        }
    }

    dispose() {

    }
}

function getOffsetHeightParent(container: Element, el: Element): number {
    return el.getBoundingClientRect().y - container.getBoundingClientRect().y
}

function findFirstLastChildren(scrollParent: HTMLElement, container: HTMLElement) {
    const rect = scrollParent.getBoundingClientRect()
    const y = rect.y
    const endY = y + rect.height

    let firstChildIndex = -1
    let lastChildIndex = -1
    let firstChild: Element
    let lastChild: Element
    let i = 0
    for (let p = container.firstElementChild; p; p = p.nextElementSibling, i++) {
        const childRect = p.getBoundingClientRect()
        const childY = childRect.y
        const childEndY = childY + childRect.height
        // the first one to cross top Y
        if (firstChildIndex === -1 && childEndY >= y) {
            firstChildIndex = i
            firstChild = p
        }
        // the first one to cross bottom Y
        if (lastChildIndex === -1 && childEndY >= endY) {
            if (i > 0 && childY > endY) {
                lastChildIndex = i - 1 // previous one is last
            } else {
                lastChildIndex = i
            }
            lastChild = p
        }
        if (firstChildIndex >= 0 && lastChildIndex >= 0) {
            break
        }
    }
    firstChildIndex = firstChildIndex >= 0 ? firstChildIndex : lastChildIndex
    firstChild = firstChild || lastChild
    lastChild = lastChild || firstChild

    lastChildIndex = lastChildIndex >= 0 ? lastChildIndex : firstChildIndex
    return { firstChildIndex, lastChildIndex, firstChild, lastChild }
}

export function RenderItem<T extends Key>(props: { item?: T, index: number, renderItem?: (item: T, i: number) => any, onMount: (el: HTMLElement) => void, onUnmount: (el: HTMLElement) => void }) {

    const ref = useRef<HTMLDivElement>()
    const mountRef = useCurrent(props.onMount)
    const onUnmountRef = useCurrent(props.onUnmount)
    useEffect(() => {
        mountRef.current?.(ref.current)
        return () => onUnmountRef.current?.(ref.current)
    }, [])
    return <div ref={ref} key={props.item?.key}>{props.renderItem?.(props.item, props.index)}</div>
}


////// ======= unused ===========

// state: startIndex, endIndex,  current top index's 
//
// each item has a key that is used to reveal its position
export function old<T extends Key>(props: VirtualListProps<T>) {
    const rootEl = useRef<HTMLDivElement>()
    // const [itemStates, setItemStates] = useState<ItemState<T>[]>([])
    // const itemStatesRef = useCurrent(itemStates)
    const [elMap] = useState<Record<string | number, HTMLElement>>({})

    const baseIndex = useRef(0)

    // with rendering more items, scroll would be very slow
    const initialList = useMemo(() => (props.maxRendering <= (props.items?.length ?? 0)) ? props.items.slice(0, props.maxRendering) : props.items, [props.maxRendering, props.items])

    const [renderList, setRenderList] = useState<T[]>(initialList)
    useEffect(() => {
        setRenderList(initialList)
        baseIndex.current = 0
    }, [initialList])

    const getScrollParentRef = useCurrent(props.getScrollParent)

    if (props.controllerRef) {
        props.controllerRef.current = {
            scrollTo(key) {
                console.log("[DEBUG] scroll begin", new Date())
                const el = elMap[key]
                if (el) {
                    const scrollOffset = el.getBoundingClientRect().y - el.parentElement.getBoundingClientRect().y
                    // scroll: width, height
                    // el.scrollIntoView({ behavior: "smooth" }) 
                    // scrollIntoView would cause other scrollbar to move also,not 
                    // what we needed
                    getScrollParentRef.current ? getScrollParentRef.current(rootEl.current) : rootEl.current.parentElement.scroll({ behavior: "smooth", left: 0, top: scrollOffset })
                    console.log("[DEBUG] scroll end", new Date())
                }
            },
        }
    }
    const itemsRef = useCurrent(props.items)
    const propsRef = useCurrent(props)
    useEffect(() => {
        const scrollParent = getScrollParentRef.current ? getScrollParentRef.current(rootEl.current) : rootEl.current.parentElement

        // init state: first item at position 0
        // fact: there will only be at most one first child, and one last child
        // because children does not overlap
        // NOTE: first and last child can be the same
        const handler = e => {
            const target: HTMLElement = e.target
            const { firstChildIndex, lastChildIndex } = findFirstLastChildren(target, rootEl.current)
            console.log("find child:", firstChildIndex, lastChildIndex)
            // calculate the slice
            let { maxLeading, maxRendering, maxTrailing, items } = propsRef.current

            let first = maxLeading >= 0 ? firstChildIndex - maxLeading : 0
            let last = maxTrailing >= 0 ? lastChildIndex + maxTrailing : items.length - 1
            first = first >= 0 ? first : 0
            last = last < items.length ? last : items.length - 1
            const n = (last + 1 - first)
            // trim leading
            // if (maxRendering > 0 && last + 1 - first > maxRendering) {
            //     first += (last + 1 - first) - maxRendering
            // }
            // trim trailing
            if (maxRendering > 0 && n > maxRendering) {
                last -= n - maxRendering
            }

            console.log("render new range:", first, last)

            // destroy other items
            // setRenderList(items.slice(baseIndex.current + first, baseIndex.current + last + 1))
            // baseIndex.current += first
        }
        const handlerDebounced = lodash.debounce(handler, 200)
        scrollParent.addEventListener('scroll', handlerDebounced)
        return () => scrollParent.removeEventListener('scroll', handlerDebounced)
    }, [])

    console.log("renderList:", renderList)
    return <div style={props.style} ref={rootEl}>{
        renderList?.map?.((e, i) => <RenderItem key={e.key} item={e} index={i}
            onMount={el => {
                elMap[e.key] = el
            }}
            onUnmount={el => {
                delete elMap[e.key]
            }}
            renderItem={props.renderItem}
        />)
    }</div>
}

// not really dynamiclly sized
export function old2<T extends Key>(props: VirtualListProps<T>) {
    return <FixedSizeList
        height={600}
        width="100%"
        itemSize={120}
        itemCount={props.items?.length}
    >
        {
            ({ index, style }) => (
                <div style={style}>
                    {props.renderItem(props.items?.[index], index)}
                </div>
            )
        }
    </FixedSizeList>
}

// not really dynamiclly sized
export function old4<T extends Key>(props: VirtualListProps<T>) {
    return <VirtualScroll

        minItemHeight={120}
        totalLength={props.items?.length}
        renderItem={(index) => {
            return (
                <div >
                    {props.renderItem(props.items?.[index], index)}
                </div>
            )
        }}
    >
    </VirtualScroll>
}
