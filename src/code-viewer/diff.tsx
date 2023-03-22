


// oldLines are empty => creation

import { ChangeType, diff, forEachLineMapping, LineChange } from "./diff-vscode"
import { BlockLine, BlockLineProps } from "./DiffCodeViewer"
import { LineProps } from "./Line"
import { lineDelete, lineNew } from "./styles"

// newLines are empty => deletion
export interface DiffBlock {
    oldLineNumber?: number
    oldLines?: string[]
    newLineNumber?: number
    newLines?: string[]

    unmodified?: boolean // the two blocks only for view,no diff
}
export interface DiffOptions {
    baseProps?: Partial<LineProps>
    diffLines?: (oldLines: string[], newLines: string[]) => (LineChange[] | Promise<LineChange[]>)
}

export function diffCode(oldCode: string, newCode: string, opts?: DiffOptions): Promise<BlockLine[]> {
    return diffLines(oldCode?.split?.("\n"), newCode?.split?.("\n"), opts)
}

export async function diffLines(oldLines: string[], newLines: string[], opts?: DiffOptions): Promise<BlockLine[]> {
    const lines: BlockLine[] = []
    const diffFn = opts?.diffLines || diff
    const changes = await diffFn(oldLines, newLines)

    // the algorithm is not perfect here:
    // for changed blocks A->B, we are just marking there common part changed, and
    // the remaining parts are dropped
    forEachLineMapping(changes, oldLines?.length, newLines?.length, (oldLineStart: number, oldLineEnd: number, newLineStart: number, newLineEnd: number, changeType: ChangeType) => {

        // console.log("DEBUG change:", oldLineStart, oldLineEnd, newLineStart, newLineEnd, changeType)

        // debugger
        const oldLen = oldLineEnd - oldLineStart
        const newLen = newLineEnd - newLineStart
        const maxLen = Math.max(oldLen, newLen)

        // update
        for (let i = 0; i < maxLen; i++) {
            lines.push({
                index: lines.length,
                changeType: changeType,
                oldLine: (changeType === ChangeType.Insert || i >= oldLen) ? undefined : {
                    value: oldLines[oldLineStart + i - 1],
                    lineNumber: oldLineStart + i,
                    hideNumber: i >= oldLen,
                    className: changeType !== ChangeType.Unchange && i < oldLen ? lineDelete : "",
                    ...opts?.baseProps,
                },
                newLine: (changeType === ChangeType.Delete || i >= newLen) ? undefined : {
                    value: newLines[newLineStart + i - 1],
                    lineNumber: newLineStart + i,
                    hideNumber: i >= newLen,
                    className: changeType !== ChangeType.Unchange && i < newLen ? lineNew : "",
                    ...opts?.baseProps,
                }
            })
        }
    })
    return lines
}

export interface CompactOptions {
    shouldShow?: (line: BlockLine) => boolean
    ctxBefore?: number // default 3
    ctxAfter?: number // default 3
}
export function compactLines(lines: BlockLine[], opts?: CompactOptions): BlockLineProps[] {
    // find all lines that should show,
    // 
    // include a line if:
    //  
    const ctxBefore = opts?.ctxBefore >= 0 ? opts.ctxBefore : 3
    const ctxAfter = opts?.ctxAfter >= 0 ? opts.ctxAfter : 3

    let showArrOrig = lines?.map?.(line => opts?.shouldShow ? opts?.shouldShow(line) : true)
    // mark context
    let showArr = [...showArrOrig]
    showArrOrig.map((show, i) => {
        if (!show) {
            return
        }
        for (let j = 0; j < ctxBefore; j++) {
            const idx = i - j - 1
            if (idx >= 0 && idx < showArr.length) {
                showArr[idx] = true
            }
        }
        for (let j = 0; j < ctxAfter; j++) {
            const idx = i + j + 1
            if (idx >= 0 && idx < showArr.length) {
                showArr[idx] = true
            }
        }
    })

    let collapsedLines: BlockLine[] = []

    const newBlockLines: BlockLineProps[] = []
    lines?.forEach?.((line, i) => {
        let shouldShow = showArr[i]
        if (!shouldShow) {
            collapsedLines.push(line)
            return
        }
        // has prev collapsed
        if (collapsedLines?.length) {
            newBlockLines.push({ collapsed: true, collapsedLines: collapsedLines })
            collapsedLines = []
        }
        newBlockLines.push({ line })
    })
    if (collapsedLines?.length) {
        newBlockLines.push({ collapsed: true, collapsedLines: collapsedLines })
    }
    return newBlockLines
}