import { BlockLine } from "../DiffCodeViewer"
import "./amend.css"

export type FileLineLabelGetter = (file: string, lineNum: number) => string[]
export type LineLabelGetter = (lineNum: number) => string[]

export function amendLineLabels(line: BlockLine, oldLineLabels: LineLabelGetter, lineLabels: LineLabelGetter): BlockLine {
    if (oldLineLabels === undefined && oldLineLabels === undefined) {
        return line
    }
    // if (line?.newLine?.lineNumber >= 151 && line?.newLine?.lineNumber <= 160) {
    //     debugger
    // }
    const oldLabels = getLabelList(line?.oldLine?.lineNumber, oldLineLabels, "old-line-content-label-container")
    const newLabels = getLabelList(line?.newLine?.lineNumber, lineLabels, "new-line-content-label-container")
    return {
        ...line,
        oldLine: {
            ...line.oldLine,
            trailingElementInsideLine: oldLabels,
        },
        newLine: {
            ...line.newLine,
            trailingElementInsideLine: newLabels,
        }
    }
}

export function getLabelList(lineNum: number, getLineLabels: LineLabelGetter, className: string): any {
    if (!getLineLabels) {
        return undefined
    }
    if (!(lineNum > 0)) {
        // may be deleted
        return undefined
    }
    // get line labels
    let lineLabels = getLineLabels?.(lineNum)
    if (lineLabels?.length === 1 && lineLabels?.[0] === "") {
        // if the only label is "", then show default
        lineLabels = ["default"]
    } else {
        // if more than one, don't show default label
        lineLabels = lineLabels?.filter?.(e => !!e)
    }
    const lineLabelsLength = lineLabels?.length
    return <span
        className={`child-margin-x-1 ${className}`}
        style={{
            "color": "#8d8d8d",
            "textDecoration": "underline",
            "fontStyle": "italic",
            marginLeft: "2px"
        }}>
        {
            lineLabels?.map?.((e, idx) => <span><a>{e}</a>
                {idx < lineLabelsLength - 1 && <span>,</span>}
            </span>)
        }
    </span>
}
