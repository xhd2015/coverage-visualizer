
function add(parent, child) {
    parent.appendChild(child?.nodeType ? child : document.createTextNode(child));
};

function appendChildren(parent, children) {
    if (children == null) {
        return
    }
    if (Array.isArray(children)) {
        children.forEach((nestedChild) => appendChildren(parent, nestedChild));
    } else {
        add(parent, children);
    }
};

function createElement(tag, props) {
    const { children } = props;
    if (typeof tag === "function") {
        return tag(props, children)
    }
    let element
    if (props["xmlns"]) {
        // for svg
        element = document.createElementNS(props["xmlns"], tag)
    } else if (tag === "svg" || tag === "path") {
        element = document.createElementNS("http://www.w3.org/2000/svg", tag)
    } else {
        element = document.createElement(tag);
    }
    if (props) {
        for (let name in props) {
            if (name === "children") {
                continue
            }
            const value = props[name]
            if (name.startsWith("on") && name.toLowerCase() in window) {
                element.addEventListener(name.toLowerCase().slice(2), value);
            } else {
                let attr = name
                if (name === "className") {
                    attr = "class"
                }
                element.setAttribute(attr, value);
            }
        }
    }
    appendChildren(element, children);
    return element;
}

export { createElement as jsxDEV }