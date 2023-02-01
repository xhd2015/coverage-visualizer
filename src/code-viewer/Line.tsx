import { CSSProperties, useMemo } from "react"
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'

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
}

const greyColor = "#AFAFAF"

export function Line(props: LineProps) {
    return <div
        style={{ display: "flex", alignItems: "baseline", ...props.style }}
        className={`code-viewer-line ${props.className ?? ""}`}
    >
        <div style={{
            marginRight: "0px",
            color: greyColor,
            padding: "0 10px 0 5px"
        }}
            className={`code-viewer-line-number ${props.lineNumberClassName ?? ""}`}
        >
            {!props.hideNumber && <span>{props.lineNumber}</span>}
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
            }}
        />
    </div>
}

export interface LineContentProps {
    value?: string
    grammar?: Prism.Grammar
    language?: string
    className?: string
    style?: CSSProperties
}
export function LineContent(props: LineContentProps) {
    const hightHtml = useMemo(() => props.grammar && props.language && Prism.highlight(props.value ?? "", props.grammar, props.language), [props.value, props.grammar, props.language])

    // pre-wrap make pre wrap elements when overflow parent
    return <pre
        className={props.className}
        style={{
            ...props.style
        }}><code><div
            dangerouslySetInnerHTML={{
                __html: hightHtml,
            }}
        ></div></code></pre>
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