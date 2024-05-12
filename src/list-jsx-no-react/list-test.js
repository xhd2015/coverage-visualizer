// src/list/list.ts
function createList(root, item, opts) {
  const list = ListImpl.newList(item, opts);
  const ul = document.createElement("ul");
  ul.appendChild(list.container);
  root.appendChild(ul);
  return list;
}
var SYM_LI_LIST = Symbol("li.list");

class ListImpl {
  parent;
  itemInfo;
  opts;
  container;
  info;
  children;
  childrenList;
  constructor() {
  }
  static newList(item, opts) {
    const list = new ListImpl;
    list.itemInfo = item;
    list.opts = opts;
    const el = document.createElement("li");
    const info = document.createElement("div");
    el.appendChild(info);
    el[SYM_LI_LIST] = list;
    list.container = el;
    list.info = info;
    list.setInfo(item);
    if (item.children) {
      for (const e of item.children) {
        list.add(e);
      }
    }
    return list;
  }
  getInfo() {
    return this.itemInfo;
  }
  setInfo(info) {
    Object.assign(this.container.style, info.style || {});
    let element;
    this.itemInfo = info;
    if (this.opts?.renderInfo != null) {
      element = this.opts.renderInfo(this, info);
    }
    const childNodes = this.info.childNodes;
    if (element == null) {
      childNodes.forEach((e) => this.info.removeChild(e));
      return;
    }
    let children;
    if (Array.isArray(element)) {
      children = element;
    } else {
      children = [element];
    }
    this.info.replaceChildren(...children);
  }
  setStyle(style) {
    Object.assign(this.container.style, style || {});
  }
  get el() {
    return this.container;
  }
  get elInfo() {
    return this.info;
  }
  get elList() {
    return this.children;
  }
  add(item) {
    if (this.children == null) {
      const children = document.createElement("ul");
      this.container.appendChild(children);
      this.children = children;
      this.childrenList = [];
    }
    const child = ListImpl.newList(item, this.opts);
    child.parent = this;
    this.children.appendChild(child.el);
    this.childrenList.push(child);
  }
  getChildren() {
    if (this.childrenList == null) {
      return [];
    }
    return this.childrenList.map((e) => e);
  }
  getChild(key) {
    const idx = this.findIndex(key);
    if (idx < 0) {
      return null;
    }
    return this.childrenList[idx];
  }
  findIndex(key) {
    if (!this.childrenList) {
      return -1;
    }
    const n = this.childrenList.length;
    for (let i = 0;i < n; i++) {
      const child = this.childrenList[i];
      if (child.itemInfo != null && child.itemInfo.key != null && child.itemInfo.key === key) {
        return i;
      }
    }
    return -1;
  }
  removeChild(key) {
    const idx = this.findIndex(key);
    if (idx < 0) {
      return null;
    }
    return this.removeChildIndex(idx);
  }
  removeChildIndex(idx) {
    const child = this.childrenList[idx];
    child.container.remove();
    this.childrenList.splice(idx, 1);
    child.parent = null;
    return child;
  }
  remove() {
    if (this.parent == null || this.parent.childrenList == null) {
      return;
    }
    const n = this.parent.childrenList.length;
    for (let i = 0;i < n; i++) {
      if (this.parent.childrenList[i] === this) {
        this.parent.removeChildIndex(i);
        return;
      }
    }
  }
  getEnclosingList(e) {
    for (;e != null; e = e.parentElement) {
      if (e.tagName !== "LI") {
        continue;
      }
      const list = e[SYM_LI_LIST];
      if (list != null) {
        return list;
      }
    }
    return null;
  }
  traverse(callback) {
    callback(this);
    if (this.childrenList) {
      for (let e of this.childrenList) {
        e.traverse(callback);
      }
    }
  }
}

// src/list/list-test.tsx
import {
jsxDEV
} from "./jsx.js";
var svgDown = () => jsxDEV("svg", {
  className: "toggle-icon-down",
  stroke: "currentColor",
  fill: "currentColor",
  "stroke-width": "0",
  viewBox: "0 0 16 16",
  height: "1em",
  width: "1em",
  xmlns: "http://www.w3.org/2000/svg",
  children: jsxDEV("path", {
    "fill-rule": "evenodd",
    d: "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
  }, undefined, false, undefined, this)
}, undefined, false, undefined, this);
var svgRight = () => jsxDEV("svg", {
  className: "toggle-icon-right",
  stroke: "currentColor",
  fill: "currentColor",
  "stroke-width": "0",
  viewBox: "0 0 16 16",
  height: "1em",
  width: "1em",
  xmlns: "http://www.w3.org/2000/svg",
  children: jsxDEV("path", {
    "fill-rule": "evenodd",
    d: "M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
  }, undefined, false, undefined, this)
}, undefined, false, undefined, this);
var list2 = createList(document.getElementById("root"), {
  key: "root",
  data: {
    text: "B"
  },
  children: [{
    key: "1",
    data: {
      text: "B"
    },
    info: jsxDEV("div", {
      children: [
        "B",
        jsxDEV("button", {
          onClick: (e) => {
            const subList = list2.getEnclosingList(e.target);
            if (subList == null) {
              return;
            }
            subList.elInfo.subList.getChildren().forEach((e2) => e2.remove());
          },
          children: "Remove Children"
        }, undefined, false, undefined, this),
        jsxDEV("button", {
          onClick: (e) => {
            const subList = list2.getEnclosingList(e.target);
            if (subList == null) {
              return;
            }
            subList.add({ key: "x", info: "Hello" });
          },
          children: "Add"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this),
    children: [{
      key: "1",
      style: { listStyle: "none", cursor: "pointer" },
      data: {
        text: "C"
      },
      info: jsxDEV("div", {
        children: [
          "C",
          jsxDEV("button", {
            onClick: (e) => {
              const subList = list2.getEnclosingList(e.target);
              if (subList == null) {
                return;
              }
              subList.remove();
            },
            children: "Remove"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }]
  }]
}, {
  renderInfo(list3, item) {
    let icon = svgDown();
    if (item.data.expanded === false) {
      icon = svgRight();
      list3.getChildren().forEach((e) => e.remove());
    }
    return jsxDEV("div", {
      children: [
        " ",
        jsxDEV("span", {
          onClick: (e) => {
            const subList = list3.getEnclosingList(e.target);
            if (subList == null) {
              return;
            }
            const prevInfo = subList.getInfo();
            subList.setInfo({
              ...prevInfo,
              data: {
                ...prevInfo.data,
                expanded: prevInfo.data.expanded === false ? true : false
              }
            });
          },
          children: icon
        }, undefined, false, undefined, this),
        " ",
        jsxDEV("span", {
          children: item.data.text
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
});
list2.traverse((e) => e.setStyle({ listStyle: "none", cursor: "pointer" }));
