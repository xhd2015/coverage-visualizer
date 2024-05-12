import { debounce } from "lodash";
import "./select.css"

export interface IQuerySelectorAll {
    querySelectorAll: Document["querySelectorAll"]
    contains: Document["contains"]
}
export interface GroupSelectionOptions {
    nonSelectGroup?: string
    onSelect?: (group: string, start: Node, end: Node) => void

}
export class GroupSelection {
    root: IQuerySelectorAll | (() => IQuerySelectorAll)
    groups: string[]
    opts?: GroupSelectionOptions

    // _noneOfGroup is elements in root that does not match any of groups
    // as MDN said: :not(a,b) is the same as :not(a):not(b), which effectively
    // do logical AND
    // _noneOfGroup: string

    _eventHandler: any
    _debouncedEmit: any

    _selecting: boolean
    _group: string

    constructor(root: IQuerySelectorAll | (() => IQuerySelectorAll), groups: string[], opts?: GroupSelectionOptions) {
        this.root = root
        this.groups = groups
        this.opts = opts

        // each group itself, and its children
        // this._noneOfGroup = ":not(" + this.groups.map(e => `${e},${e} *`).join(",") + ")"

        this._selecting = false
        this._group = ""

        this._debouncedEmit = debounce((sel: Selection) => {
            this._emit(sel)
        }, 200)

        this.init()
    }

    init() {
        const handler = (e: Event) => {
            this._handle(e)
        }
        this._eventHandler = handler
        document.addEventListener('selectionchange', handler)
    }
    dispose() {
        document.removeEventListener('selectionchange', this._eventHandler)
    }

    _setUserSelect(el: Element, val: string) {
        let hel = el as HTMLElement
        if (hel.style) {
            hel.style.userSelect = val
        }
    }

    _handle(e: Event) {
        // console.log("sel event:", e)
        const sel = document.getSelection()
        // console.log("sel:", sel)
        // console.log("sel str:", sel.toString())
        // Caret: click outside, or double click inside
        if (!sel.anchorNode || sel.type === "Caret" /*caret means click outside */) {
            if (!this._selecting) {
                return
            }
            // debugger
            this._selecting = false
            this._group = ""
            // console.log("DEBUG selecting clear selecting")
            // clean up
            this.groups.forEach(group => {
                this._resolvedRoot.querySelectorAll(group).forEach(el => this._setUserSelect(el, "auto"))
            })
            if (this.opts?.nonSelectGroup) {
                this._resolvedRoot.querySelectorAll(this.opts?.nonSelectGroup).forEach(el => this._setUserSelect(el, "auto"))
            }
            if (this.opts?.onSelect) {
                this.opts.onSelect(undefined, undefined, undefined)
            }
        } else {
            if (this._selecting) {
                // console.log("DEBUG selecting")
                // console.log("DEBUG resolved root 2:", this._resolvedRoot)
                this._debouncedEmit(sel)
                return
            }
            if (!this._resolvedRoot.contains(sel.anchorNode)) {
                return
            }
            // console.log("set selecting")
            // console.log("resolved root:", this._resolvedRoot)
            const getElementParent = (node: Node): Element => {
                while (true) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        return node as Element
                    }
                    node = node.parentNode
                }
            }

            const el = getElementParent(sel.anchorNode)
            let matchGroup: string
            for (const group of this.groups) {
                if (el.matches(`${group} *,${group}`)) {
                    matchGroup = group
                    break
                }
            }
            // console.log("match group:", matchGroup)
            if (matchGroup) {
                for (const group of this.groups) {
                    const val = group === matchGroup ? "auto" : "none"
                    // console.log("selecting group sel:", group, val)
                    const elements = this._resolvedRoot.querySelectorAll(group)
                    // console.log("selecting group elements:", elements)

                    // let debugEl: HTMLElement
                    // if (val === "none" && group === ".code-viewer-line-new-container .code-viewer-line-number") {
                    //     // debugEl = elements[5] as HTMLElement
                    //     // debugger
                    //     // before: 
                    //     // console.log("selecting before:", debugEl.style.userSelect)
                    // }
                    elements.forEach(el => {
                        // if (el !== debugEl) {
                        this._setUserSelect(el, val)
                        // }
                    })
                    // if (val === "none" && group === ".code-viewer-line-new-container .code-viewer-line-number") {
                    //     // debugger
                    //     const el = elements[5] as HTMLElement
                    //     el.classList.add("shit")
                    //     console.log("selecting after:", el.attributes["style"])
                    // }
                }
                if (this.opts?.nonSelectGroup) {
                    this._resolvedRoot.querySelectorAll(this.opts?.nonSelectGroup).forEach(el => this._setUserSelect(el, "none"))
                }
                this._selecting = true
                this._group = matchGroup
                this._debouncedEmit(sel)
            }
        }
    }
    resetGroup() {
        if (!this._selecting) {
            return
        }
        // console.log("DEBUG selecting reset")
        this._selecting = false
        this._group = undefined
        for (const group of this.groups) {

            this._resolvedRoot.querySelectorAll(group).forEach(el => this._setUserSelect(el, "auto"))
        }
        if (this.opts?.nonSelectGroup) {
            this._resolvedRoot.querySelectorAll(this.opts?.nonSelectGroup).forEach(el => this._setUserSelect(el, "auto"))
        }
    }
    _emit(sel: Selection) {
        for (let i = 0; i < sel.rangeCount; i++) {
            // console.log("range:", i, sel.getRangeAt(i))
            const range = sel.getRangeAt(i)
            const rect = range.getBoundingClientRect()
            // console.log("rect:", rect, rect.x, rect.y)
            const startNode = range.startContainer
            const endNode = range.endContainer
            if (this._selecting) {
                const children = this._resolvedRoot.querySelectorAll(this._group)
                // console.log("children:", children)
                let start: Node
                let end: Node
                children.forEach((child) => {
                    if (startNode && child.contains(startNode)) {
                        start = child
                        // console.log("start:", idx)
                    }
                    if (endNode && child.contains(endNode)) {
                        end = child
                        // console.log("end:", idx)
                    }
                })
                if ((start || end) && this.opts?.onSelect) {
                    this.opts?.onSelect(this._group, start, end)
                }
            }
        }
    }
    get _resolvedRoot(): IQuerySelectorAll {
        if (typeof this.root === 'function') {
            return this.root()
        }
        return this.root
    }
}
