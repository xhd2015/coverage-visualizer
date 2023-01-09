import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { BsChevronDown, BsChevronRight } from "react-icons/bs"
import { DispatchUpdate, Item, ItemIndex, ItemPath, List, SubscribeUpdate } from "./List"
import { useCurrent } from "./react-hooks"
import { traverse } from "./tree"

// problems developing a list:
//  1.List & List Item recursive
//  2.event emit and state management
//    state management is about navigation: how to emit event from an deep item to its parent?
// no, not in this case. deep data is not a proper case for React's auto dependency system.
// like form, we just use the ref to pass back the deep state change function, i.e. setItems() 
//  3.need to provide the function: 
//    3.1 expand self, data flow: self -> self
//    3.2 expand all, data flow: parent->children
//
// 4. input data and its internal state
//   4.1 in one case, input data is readonly, (i.e. loaded from server), the expand status is internal 
//       state. what if the input data gets reloaded? will the expand status reset? we expect it to
//       remain
//    to maintain internal status, we should store internal status in another map, and associate them with the original data with key, so key is important.
//    a multi-level map is more proper than a flatten map with keys joined with "/" 
//    use ["k1","k2", ...] to represent a unique path.
//  4.2 IMPORTANT: PROPAGATION when updating an item, should always update to its parent with children slice
//      because if the UI gets redraw, the parent would follow children to find the item, it will
//      get a  stale data if not updating parent when updating the item.

type InternalStateMap<T extends ExpandItem & { children?: T[] }> = { [key: string]: InternalState<T> }
type InternalState<T extends ExpandItem & { children?: T[] }> = { wrapper: ExpandItemWrapper<T>, children: InternalStateMap<T> }

export type ExpandItem = Omit<Item, "children"> & {
    expanded?: boolean // only meaningful with non-leaf
    leaf?: boolean

    expandContainerStyle?: CSSProperties
    expandContainerClassName?: string
    // children: ExpandItem[]
}

export type ExpandItemWrapper<T extends ExpandItem & { children?: T[] }> = {
    item?: T
    parent?: ExpandItemWrapper<T>
    parentIndex?: number

    state?: InternalState<T>

    setExpanded?: (expanded: boolean, all: boolean) => void
    path?: ItemPath
    index?: ItemIndex
    children: ExpandItemWrapper<T>[]

    // when ever the dispatchVersion!==consumerVersion, updateHandlers will be called

    updateHandlers: ({ handler: (item: T) => void })[]

    subscribeUpdate: SubscribeUpdate<T>
    dispatchUpdate: DispatchUpdate<T>

    controller: ItemController<T>
}

export interface ItemController<T extends ExpandItem & { children?: T[] }> {
    readonly path?: ItemPath
    readonly index?: ItemIndex
    readonly id?: number // unique id in memory
    readonly subscribeUpdate: SubscribeUpdate<T>
    readonly dispatchUpdate: DispatchUpdate<T>
}

export interface ExpandListProps<T extends ExpandItem & { children?: T[] }> {
    items?: T[] // single root or item list
    render?: (item: T, controller: ItemController<T>) => any

    initialAllExpanded?: boolean
    toggleExpandRef?: React.MutableRefObject<(expand?: boolean) => void>

    onChange?: (item: T, path: ItemPath) => void

    // call this method when new session all some bug found
    // but in practice you can just ignore it, I'll explain
    // why later.
    clearInternalStates?: React.MutableRefObject<() => void>
}

// debug
function debugCheckDuplicate(items: any[], prefix: string) {
    // check item
    // debug
    traverse(items, item => {
        // DEBUG
        if ((item as any).record?.func === "handleRuleMatch") {
            debugCheckDuplicateChildren(item.children, prefix)
        }
        return true
    })
}

function debugCheckDuplicateChildren(items: any[], prefix: string) {
    const ids = {}
    items?.forEach?.(e => {
        console.log("checking:", prefix, e.key)
        if (ids[e.key]) {
            console.log("found duplicate from source,prefix")
            debugger
        }
        ids[e.key] = true
    })
}

export default function ExpandList<T extends ExpandItem & { children?: T[] }>(props: ExpandListProps<T>) {
    const allExpandedRef = useRef(props.initialAllExpanded)

    const onChangeRef = useCurrent(props.onChange)

    const rootStatRef = useRef<InternalState<T>>()

    let idRef = useRef(1)

    const getState = (path: ItemPath): (InternalState<T> | undefined) => {
        let state = rootStatRef.current
        if (path) {
            for (let key of path) {
                state = state?.children?.[key]
                // console.log("get state:", key, state)
                if (!state) {
                    return undefined
                }
            }
        }
        return state
    }

    // checkDuplicate(props.items)

    useMemo(() => {
        // DEBUG clear the state
        // rootStatRef.current = undefined

        let root: ExpandItemWrapper<T> = rootStatRef.current?.wrapper
        if (!root) {
            // init
            rootStatRef.current = { children: {} } as InternalState<T>
            root = {
                path: [],
                index: [],
                state: rootStatRef.current,
                item: {
                    key: "root",
                    children: []
                },
                children: [],
            } as ExpandItemWrapper<T>
            rootStatRef.current.wrapper = root
        }
        root.item.children = []

        // if ((window as any).debug) {
        //     debugger
        // }
        // build a map from key to 
        traverse<T, ExpandItemWrapper<T>>(props.items, (item, parent, i) => {
            const p: ExpandItemWrapper<T> = parent
            let state: InternalState<T> = p.state.children[item.key]

            const prevItem = state?.wrapper?.item
            // the wrapper never change once created
            if (!state) {
                state = { children: {} } as InternalState<T>
                p.state.children[item.key] = state

                const wrapper: ExpandItemWrapper<T> = {
                    parent: p,
                    parentIndex: i,
                    state: state,
                    path: [...p.path, item.key],
                    index: [...p.index, i],
                    children: [], // fill later
                    updateHandlers: [],
                    subscribeUpdate(handler) {
                        const entry = { handler }
                        wrapper.updateHandlers.push(entry)
                        // console.log("subscriber:", item.key, wrapper.updateHandlers.length)
                        try {
                            handler(wrapper.item)
                        } catch (e) {
                            // silent
                        }

                        // remove
                        return () => {
                            const idx = wrapper.updateHandlers.findIndex(e => e === entry)
                            // console.log("remove subscriber:", item.key, idx, wrapper.updateHandlers.length)
                            if (idx >= 0) {
                                wrapper.updateHandlers.splice(idx, 1)
                            }
                        }
                    },
                    dispatchUpdate: (getUpdate: (prev: T) => T) => {
                        // update gets called on init, is that expected?
                        let updatedItem = getUpdate(wrapper.item)
                        if (updatedItem === wrapper.item) {
                            // unchanged
                            // force update
                            updatedItem = { ...updatedItem }
                            // return
                        }

                        // console.log("dispatch update:", item.key, updatedItem)
                        wrapper.item = updatedItem // to make the expand persistent. 

                        // NOTE: should also update all parent
                        // to ensure when redrawing, parent following children will get
                        // the updated item
                        let i = wrapper.parentIndex
                        let v = wrapper
                        while (v.parent) {
                            v.parent.item.children = [
                                ...v.parent.item.children.slice(0, i),
                                v.item,
                                ...v.parent.item.children.slice(i + 1)
                            ]
                            i = v.parent.parentIndex
                            v = v.parent
                        }

                        const dispatchValue: T = updatedItem
                        wrapper.updateHandlers.forEach(e => e.handler(dispatchValue))
                        onChangeRef.current?.(dispatchValue, wrapper.path)
                    },
                    setExpanded: (expanded, all) => {
                        if (wrapper.item.leaf) {
                            return
                        }
                        // debug
                        // console.log("setExpanded:", wrapper.item.key, wrapper.item.expanded, expanded, all)
                        wrapper.dispatchUpdate(item => ({
                            ...item,
                            expanded: expanded,
                            hideList: expanded === false,
                        }))
                        // x.updateRef.current?.({ ...x })
                        if (all) {
                            wrapper.children.forEach(e => e.setExpanded(expanded, all))
                        }
                    },
                    controller: {} as ItemController<T>
                }
                Object.assign(wrapper.controller, {
                    path: wrapper.path,
                    index: wrapper.index,
                    id: idRef.current++,
                    dispatchUpdate: wrapper.dispatchUpdate,
                    subscribeUpdate: wrapper.subscribeUpdate,
                } as ItemController<T>)
                state.wrapper = wrapper
            } else {
                // update index
                state.wrapper.parentIndex = i
                state.wrapper.index = [...p.index, i]
                Object.assign(state.wrapper.controller, { index: state.wrapper.index })
            }

            // the calcItem is readonly
            const calcItem: T = {
                ...item,

                // always clear calc children because we will put calcItem into it
                children: [],

                expanded: prevItem ? prevItem.expanded : item.expanded,
                hideList: prevItem ? prevItem.hideList : item.expanded === false,

                // apply default css style on list
                listStyle: {
                    listStyleType: "none",
                    paddingLeft: "1em",
                    ...item?.listStyle,
                },

            }
            // replace the item with calculated item
            state.wrapper.item = calcItem
            // remove update handlers?
            // state.wrapper.updateHandlers = []

            // fill later
            state.wrapper.children = []

            p.item.children.push(calcItem)
            p.children.push(state.wrapper)
            return [state.wrapper]
        }, {
            root,
        })

        // TODO: may delete those not in the state map
        // setRoot(root);
    }, [props.items])

    if (props.toggleExpandRef) {
        props.toggleExpandRef.current = (expanded?: boolean) => {
            if (expanded === undefined) {
                expanded = !allExpandedRef.current
            }
            // console.log("toggle:", expanded)
            allExpandedRef.current = expanded;
            rootStatRef.current.wrapper.children.forEach(e => e.setExpanded(expanded, true))
        }
    }

    return <List<T>
        items={rootStatRef.current.wrapper.item.children}
        style={{ listStyleType: "none", paddingLeft: "0px" }}
        getSubscribeUpdate={(item, path) => {
            return getState(path)?.wrapper?.subscribeUpdate
        }}
        render={(item, path) => {
            const state = getState(path)
            return <ExpandListItemRender
                item={item}
                itemRenderContent={props.render?.(item, state?.wrapper?.controller)}
                updateItem={state?.wrapper?.dispatchUpdate}
                subscribeUpdate={state?.wrapper?.subscribeUpdate} />
        }}
    />
}

export interface ExpandListItemRenderProps {
    item?: ExpandItem
    itemRenderContent?: any
    subscribeUpdate?: SubscribeUpdate<ExpandItem>
    updateItem?: (getItem: (prevItem: ExpandItem) => ExpandItem) => void
}

const iconStyle: CSSProperties = {
    minWidth: "fit-content" // sometimes gets hide, this force the icon it be shown always.
}
export function ExpandListItemRender(props: ExpandListItemRenderProps) {
    const [item, setItem] = useState(props.item)
    const [expanded, setExpanded] = useState(item.expanded)

    useEffect(() => {
        props.updateItem?.(item => ({ ...item, expanded, hideList: expanded === false }))
    }, [expanded])

    useEffect(() => {
        return props.subscribeUpdate?.(item => {
            setItem(item)
            // console.log("set expanded via item:", item.key, item.expanded)
            setExpanded(item.expanded)
        })
    }, [])

    return <div
        style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: item.leaf && "1em",
            ...item?.expandContainerStyle,
        }}
        className={item?.expandContainerClassName}>
        {!item.leaf && (
            expanded !== false ? < BsChevronDown style={{ marginRight: "4px", ...iconStyle }}
                onClick={() => {
                    console.log("ExpandListItemRender click expanded false:", item.key, expanded)
                    setExpanded(false)
                }}
            /> : <BsChevronRight style={{ marginRight: "4px", ...iconStyle }}
                onClick={() => {
                    setExpanded(true)
                }}
            />
        )}
        {props.itemRenderContent}
    </div>
}