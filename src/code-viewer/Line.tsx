import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { CSSProperties, ReactElement, useMemo, useState } from "react";

export interface LineProps {
    value?: string
    lineNumber?: number

    // if hideNumber is true, then line
    // does not exist
    hideNumber?: boolean

    className?: string
    style?: CSSProperties

    grammar?: Prism.Grammar
    language?: string

    lineNumberClassName?: string
    contentClassName?: string
    contentStyle?: CSSProperties


    headElement?: ReactElement


    // element
    trailingElement?: any
    trailingElementInsideLine?: any

    charRangeStyles?: CharRangeStyle[]

    //
    extraElement?: any

    showHoverElement?: boolean
    hoverElement?: ReactElement

    showLineThrough?: boolean
}

const greyColor = "#AFAFAF"

export function Line(props: LineProps) {
    // stable than CSS :hover
    const [hover, setHover] = useState(false)
    return <div
        style={{
            display: "flex",
            // alignItems: "baseline", 
            flexDirection: "column",
            ...props.style
        }}
        className={`code-viewer-line ${props.className ?? ""}`}
        onMouseOver={e => setHover(true)}
        onMouseOut={e => setHover(false)}
    >
        <div
            style={{
                display: "flex",
                position: "relative"
            }}
        >
            {
                // for blame info
                props.headElement
            }
            <div
                style={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "column",
                    width: "100%"
                }}
                className="code-viewer-line-container"
            >
                <div
                    style={{
                        display: "flex",
                        position: "relative"
                    }}
                >
                    {(hover || props.showHoverElement) && props.hoverElement}
                    <div style={{
                        marginRight: "0px",
                        color: greyColor,
                        padding: "0 10px 0 5px",
                        position: "relative"
                    }}
                        className={`code-viewer-line-number ${props.lineNumberClassName ?? ""}`}
                    >
                        {!props.hideNumber &&
                            <span style={{
                                // ...(props.showLineThrough && {
                                //     textDecoration: "line-through",
                                //     textDecorationColor: "black",
                                //     textDecorationThickness: "1.5px",
                                // })
                                position: 'relative'
                            }}>
                                {props.lineNumber}
                                {
                                    props.showLineThrough && <div
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "1.5px",
                                            right: "0",
                                            top: "50%",
                                            backgroundColor: "#929292",

                                        }}
                                    ></div>
                                }
                            </span>
                        }

                    </div>
                    <LineContent
                        value={props.value}
                        // grammar={Prism.languages.javascript}
                        // language="javascript"
                        grammar={props.grammar}
                        language={props.language}
                        className={`code-viewer-line-content ${props.contentClassName ?? ""}`}
                        style={{
                            // paddingLeft: "20px"
                            ...props.contentStyle,
                        }}
                        trailingElement={props.trailingElementInsideLine}
                        charRangeStyles={props.charRangeStyles}
                    />
                    {
                        // for line extra labels
                        props.trailingElement
                    }
                </div>
                {
                    // for new line comment
                    props.extraElement
                }
            </div>
        </div>
    </div>
}

export interface CharRangeStyle {
    // startCol counts from 1
    startCol: number
    // endCol is inclusive
    endCol?: number // default to end
    style?: CSSProperties
    className?: string
}

export interface LineContentProps {
    value?: string
    grammar?: Prism.Grammar
    language?: string
    className?: string
    style?: CSSProperties
    trailingElement?: any

    // highligh char changes
    charRangeStyles?: CharRangeStyle[]
}

export function LineContent(props: LineContentProps) {
    const { highlightHTML, isHTML } = useMemo(() => {
        let highlightHTML: string
        let plainText = false
        if (!props.grammar || !props.language) {
            // language not set
            // use text node to escape value
            highlightHTML = props.value ?? ""
            plainText = true
        } else {
            highlightHTML = Prism.highlight(props.value ?? "", props.grammar, props.language)
        }

        if (!highlightHTML || !props.charRangeStyles?.length) {
            return { highlightHTML, isHTML: !plainText }
        }

        return {
            highlightHTML: applyCharRangeStyles(props.value ?? "", highlightHTML, plainText, props.charRangeStyles),
            isHTML: true
        }
    }, [props.value, props.grammar, props.language, props.charRangeStyles])

    // pre-wrap make pre wrap elements when overflow parent
    return <pre
        className={props.className}
        style={{
            ...props.style
        }}><code>{isHTML ? <span
            dangerouslySetInnerHTML={{
                __html: highlightHTML,

            }}
        ></span> : <span>{highlightHTML}</span>
        }</code>{props.trailingElement}</pre>
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html): Element {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstElementChild;
}


// TokenNode represents a highlighted span or plain text
// of a piece of code
class TokenNode {
    node: Node
    span: HTMLSpanElement
    constructor(node: Node) {
        this.node = node
        if (node.nodeType === Node.TEXT_NODE) {
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            // upper cased
            if (el.tagName === "SPAN") {
                this.span = el
            } else {
                throw new Error(`unknown element type: ${el.tagName}`)
            }
        } else {
            throw new Error(`unknown node type: ${node.nodeType}`)
        }
    }

    getText(): string {
        if (this.span) {
            return this.span.innerText
        }
        return this.node.nodeValue
    }
    getLength(): number {
        return this.getText().length
    }
    setText(text: string) {
        if (this.span) {
            this.span.innerText = text
        }
        this.node.nodeValue = text
    }
    asSpan(): HTMLSpanElement {
        if (this.span) {
            return this.span
        }
        // covert the node to span
        const newSspan = this.node.ownerDocument.createElement("span")
        newSspan.innerText = this.node.nodeValue

        this.node.parentNode.replaceChild(newSspan, this.node)
        this.node = newSspan
        this.span = newSspan
        return newSspan
    }
}
// applyCharRangeStyles applies extra properties to a highlighted html
// the operations include splitting the original html into chunks, if necessary
// NOTE: assume charRangeStyles are sorted, have no intersections with each other
function applyCharRangeStyles(line: string, lineHTML: string, plainText: boolean, charRangeStyles: CharRangeStyle[]): string {
    let container: Element
    let doc: Document
    if (plainText) {
        doc = document
        container = document.createElement("div")
        container.appendChild(document.createTextNode(lineHTML))
    } else {
        let parser = new DOMParser()
        // the whole thing should be wrapped in a <pre> tag to avoid trimming spaces
        doc = parser.parseFromString("<pre>" + lineHTML + "</pre>", "text/html")
        // console.log("doc:", doc)

        container = doc.body.firstElementChild
    }

    const nodes = container.childNodes

    // each node is either a NodeText or a <span>

    // compute a mapping between nodes and their ranges

    // the algorithm is described below:
    //
    // f(nodes[i:], chars[j:]) = 
    //   assert chars[j]'s start col >= nodes[i]'s start col
    //   if chars[j]'s startCol > nodes[i]'s endCol:
    //       f(nodes[i+1:],chars[j:])
    //   else
    //       targetNode = nodes[i]
    //       targetChar = chars[j]
    //       if chars[j]'s endCol > nodes[i]'s endCol:
    //          # need split suffix
    //          targetChar = chars[j] slice nodes[i]'endCol
    //          chars[j] = chars[j] - prefix targetChar
    //       if char[j]'s startCol > node[i]'s startCol:
    //          # need split prefix
    //          targetNode = node[i] starting from char[j]'s startCol
    //          nodes[i] = node[i] - suffix targetNode
    //       apply targetNode,targetChar
    //       f(nodes[i:],chars[j:])

    const vnodes: TokenNode[] = []
    let totalLen = 0
    nodes.forEach(node => {
        const vnode = new TokenNode(node)
        vnodes.push(vnode)
        totalLen += vnode.getText().length
    })


    let i = 0
    let n = vnodes.length
    let nodeLens = 0

    const charRanges = [...charRangeStyles]
    let j = 0
    let m = charRanges.length
    while (i < n && j < m) {
        const vnode = vnodes[i]
        let vnodeText = vnode.getText()
        let nodeStart = nodeLens
        let nodeEnd = nodeLens + vnode.getLength()

        const charRange = charRanges[j]

        let charStart = charRange.startCol >= 0 ? charRange.startCol - 1 : 0
        let charEnd = charRange.endCol >= 0 ? charRange.endCol : totalLen

        if (charStart < nodeStart) {
            throw new Error(`invalid char range: ${charStart}`)
        }
        if (charStart >= nodeEnd) {
            nodeLens = nodeEnd
            i++
            continue
        }
        if (charStart > nodeStart) {
            // split prefix and suffix
            // apply style to prefix
            const prefixLen = charStart - nodeStart
            const prefix = vnodeText.slice(0, prefixLen)
            const suffix = vnodeText.slice(prefixLen)
            // console.log("prefix:", prefix, suffix)

            vnode.setText(suffix)
            vnodeText = suffix
            const prefixNode = doc.createTextNode(prefix)
            vnode.node.parentNode.insertBefore(prefixNode, vnode.node)

            vnodes.splice(i, 0, new TokenNode(prefixNode))
            // nodeEnd -= prefixLen
            nodeStart += prefixLen
            i++
            n++
        }
        if (charEnd < nodeEnd) {
            // split prefix and suffix
            // apply style to prefix
            const tailLen = nodeEnd - charEnd
            const prefix = vnodeText.slice(0, vnodeText.length - tailLen)
            const suffix = vnodeText.slice(vnodeText.length - tailLen)
            // console.log("prefix:", prefix, suffix)

            vnode.setText(prefix)
            vnodeText = prefix
            const suffixNode = doc.createTextNode(suffix)
            vnode.node.parentNode.insertBefore(suffixNode, vnode.node.nextSibling)

            vnodes.splice(i + 1, 0, new TokenNode(suffixNode))
            nodeEnd -= tailLen
            n++
        } else if (charEnd > nodeEnd) {
            // split char ranges
            charRanges.splice(j + 1, 0, { ...charRange, startCol: charEnd })
            m++
        }

        const el = vnode.asSpan()
        // set style
        if (charRange.style) {
            for (let key in charRange.style) {
                el.style[key] = charRange.style[key]
            }
        }
        if (charRange.className) {
            el.classList.add(charRange.className)
        }
        nodeLens = nodeEnd
        i++
        j++
    }
    return container.innerHTML
}


// just an example
function applyCharRangeStylesExample(line: string, lineHTML: string, charRangeStyles?: CharRangeStyle[]): string {
    let parser = new DOMParser()
    const doc = parser.parseFromString(lineHTML, "text/html")
    console.log("doc:", doc)

    const container = doc.body
    const firstNode = container.childNodes[0]
    if (firstNode.nodeType === Node.TEXT_NODE && firstNode.nodeValue === 'fmt') {
        // replace with span
        container.replaceChild(doc.createTextNode("example"), firstNode)
    }
    // childNodes contains text node, while children only contains tagged node
    // console.log("doc childNodes:", doc.body.childNodes)
    // console.log("doc children:", doc.body.children)

    return container.innerHTML
}