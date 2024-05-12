
// style guide:
//   1. use undefined as type, use null as value
//   2. use el as corresponding html element 

// a list defines a hiearchical tree:
//   item info:
//     icon, text, indication info
//     operations
//   children
// every item should have 
// 
// list:
//    > item info
//        child1
//           child1 item info
//        child2
//   
// a list should allow the user to control item
//

import { CSSProperties } from "react"

// html structor of a tree:
// <ul id="1">
//   <li>
//      <div class="head">
//         <icon/>
//         <span onClick="onClickHead(2)">text</span>
//         <div class="extra-info">...</div>
//      </div>
//      <ul id="2">...</ul>
//   </li>
// </ul>

const SYM_LI_LIST = Symbol("li.list")

type Key = string | number

type DisplayElement = Element | Element[] | any


// assume T has a state:
//   expanded
// should each item have an id?
// corresponding to a <li>
export interface ListItem<T> {
  // the key should be unique within the same list
  key: Key
  style?: CSSProperties
  data?: T
  children?: ListItem<T>[]
}

// will have the 

// ul, li
class ListImpl<T> {
  parent: ListImpl<T>

  itemInfo: ListItem<T>
  opts: CreateListOptions<T>

  // container for info and children
  container: HTMLLIElement

  // container for info
  info: HTMLDivElement

  // container for children
  children: HTMLUListElement

  childrenList: ListImpl<T>[]

  constructor() {
  }

  static newList<T>(item: ListItem<T>, opts: CreateListOptions<T>): ListImpl<T> {
    const list = new ListImpl<T>()
    list.itemInfo = item
    list.opts = opts

    // create html elements
    const el = document.createElement("li")

    const info = document.createElement("div")
    el.appendChild(info)

    el[SYM_LI_LIST] = list

    // set attributes
    list.container = el
    list.info = info

    // set extra info
    list.setInfo(item)

    if (item.children) {
      for (const e of item.children) {
        list.add(e)
      }
    }

    return list
  }

  getInfo(): ListItem<T> {
    return this.itemInfo
  }
  setInfo(info: ListItem<T>) {
    // apply styles
    Object.assign(this.container.style, info.style || {})

    let element
    this.itemInfo = info
    if (this.opts?.renderInfo != null) {
      element = this.opts.renderInfo(this, info)
    }

    const childNodes = this.info.childNodes
    if (element == null) {
      childNodes.forEach(e => this.info.removeChild(e))
      return
    }
    let children: Element[]
    if (Array.isArray(element)) {
      children = element
    } else {
      children = [element]
    }
    this.info.replaceChildren(...children)
  }

  setStyle(style: CSSProperties) {
    Object.assign(this.container.style, style || {})
  }

  get el() {
    return this.container
  }
  get elInfo() {
    return this.info
  }

  get elList() {
    return this.children
  }

  add(item: ListItem<T>) {
    if (this.children == null) {
      // init list
      const children = document.createElement("ul")
      this.container.appendChild(children)

      this.children = children
      this.childrenList = []
    }

    // create child list, and append to 
    // children of current
    const child = ListImpl.newList(item, this.opts)
    child.parent = this
    this.children.appendChild(child.el)
    this.childrenList.push(child)
  }
  getChildren(): List<T>[] {
    if (this.childrenList == null) {
      return []
    }
    return this.childrenList.map(e => e)
  }

  getChild(key: Key): ListImpl<T> | undefined {
    const idx = this.findIndex(key)
    if (idx < 0) {
      return null
    }
    return this.childrenList[idx]
  }

  findIndex(key: Key): number {
    if (!this.childrenList) {
      return -1
    }
    const n = this.childrenList.length
    for (let i = 0; i < n; i++) {
      const child = this.childrenList[i]
      if (child.itemInfo != null && child.itemInfo.key != null && child.itemInfo.key === key) {
        return i
      }
    }
    return -1
  }

  removeChild(key: Key): ListImpl<T> | undefined {
    const idx = this.findIndex(key)
    if (idx < 0) {
      return null
    }
    return this.removeChildIndex(idx)
  }

  removeChildIndex(idx: number): ListImpl<T> | undefined {
    const child = this.childrenList[idx]
    child.container.remove()
    this.childrenList.splice(idx, 1)
    child.parent = null

    return child
  }

  remove() {
    if (this.parent == null || this.parent.childrenList == null) {
      return
    }
    const n = this.parent.childrenList.length
    for (let i = 0; i < n; i++) {
      if (this.parent.childrenList[i] === this) {
        // find index
        this.parent.removeChildIndex(i)
        return
      }
    }
  }

  // search down
  getEnclosingList(e: Element): ListImpl<T> | undefined {
    // check all li with SYM_LI_LIST
    for (; e != null; e = e.parentElement) {
      // tagName returns upper case for HTML
      if (e.tagName !== "LI") {
        continue
      }
      const list = e[SYM_LI_LIST]
      if (list != null) {
        return list
      }
    }

    return null
  }

  traverse(callback: (list: List<T>) => void) {
    callback(this)
    if (this.childrenList) {
      for (let e of this.childrenList) {
        e.traverse(callback)
      }
    }
  }
}

export interface List<T> {
  readonly el: HTMLElement
  readonly elInfo: HTMLElement
  readonly elList: HTMLElement

  getInfo: () => ListItem<T>
  setInfo: (info: ListItem<T>) => void

  setStyle: (style: CSSProperties) => void



  add: (item: ListItem<T>) => void

  getChildren: () => List<T>[]

  removeChild: (key: Key) => List<T> | undefined

  // remove from parent
  remove: () => void

  // get direct child
  getChild: (key: Key) => List<T> | undefined

  // get enclosing list
  getEnclosingList: (e: Element | EventTarget) => List<T> | undefined

  // traverse list recursively
  traverse: (callback: (list: List<T>) => void) => void
}

export interface CreateListOptions<T> {
  renderInfo: (list: List<T>, item: ListItem<T>) => any
}

// renderInfo: (data => void)
export function createList<T>(root: HTMLElement, item: ListItem<T>, opts?: CreateListOptions<T>): List<T> {
  const list = ListImpl.newList(item, opts)

  const ul = document.createElement("ul")
  ul.appendChild(list.container)
  root.appendChild(ul)

  return list
}