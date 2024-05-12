


// oldLines are empty => creation

import { ChangeType, CharChange, diff, forEachLineMapping, LineChange } from "./diff-vscode"
import { BlockLine, BlockLineProps } from "./DiffCodeViewer"
import { LineProps } from "./Line"
import { CLS_CHAR_RANGE_DELETE, CLS_CHAR_RANGE_NEW, CLS_LINE_DELETE, CLS_LINE_NEW } from "./styles"

import * as charDiff from "diff"

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
    // debugger
    const changes = await diffFn(oldLines, newLines, {
        charChange: false, // false, we will compute char change using another library with a line-to-line diff
    })

    // console.log("DEBUG diff oldLines:", oldLines)
    // console.log("DEBUG diff newLines:", newLines)
    // the algorithm is not perfect here:
    // for changed blocks A->B, we are just marking there common part changed, and
    // the remaining parts are dropped
    forEachLineMapping(changes, oldLines?.length || 0, newLines?.length || 0, (oldLineStart: number, oldLineEnd: number, newLineStart: number, newLineEnd: number, changeType: ChangeType, charChanges: CharChange[]) => {

        // console.log("DEBUG change:", oldLineStart, oldLineEnd, newLineStart, newLineEnd, changeType)
        // console.log("DEBUG char chages:", charChanges)

        // debugger
        const oldLen = oldLineEnd - oldLineStart
        const newLen = newLineEnd - newLineStart
        const maxLen = Math.max(oldLen, newLen)

        // update
        for (let i = 0; i < maxLen; i++) {
            const line = {
                index: lines.length,
                changeType: changeType,
                oldLine: (changeType === ChangeType.Insert || i >= oldLen) ? undefined : {
                    value: oldLines[oldLineStart + i - 1],
                    lineNumber: oldLineStart + i,
                    hideNumber: i >= oldLen,
                    className: changeType !== ChangeType.Unchange && i < oldLen ? CLS_LINE_DELETE : "",
                    ...opts?.baseProps,
                },
                newLine: (changeType === ChangeType.Delete || i >= newLen) ? undefined : {
                    value: newLines[newLineStart + i - 1],
                    lineNumber: newLineStart + i,
                    hideNumber: i >= newLen,
                    className: changeType !== ChangeType.Unchange && i < newLen ? CLS_LINE_NEW : "",
                    ...opts?.baseProps,
                }
            }
            // compute char change
            if (changeType === ChangeType.Update && line.oldLine?.value && line.newLine?.value) {
                // there is no update in char change, only added or removed
                interface LineCharChange {
                    count: number
                    value: string
                    removed?: boolean
                    added?: boolean
                }
                // see https://github.com/kpdecker/jsdiff
                // const lineCharChanges: LineCharChange[] = charDiff.diffChars(line.oldLine?.value, line.newLine?.value)
                const lineCharChanges: LineCharChange[] = charDiff.diffWordsWithSpace(line.oldLine?.value, line.newLine?.value)

                // if (line.newLine?.value?.includes?.(`uint32(checkoutInfo.ChannelId)`)) {
                //     debugger
                //     console.log("lineCharChanges:", lineCharChanges)
                // }

                const allSpace = (s: string): boolean => {
                    for (let i = 0; i < s?.length; i++) {
                        if (s[i] !== ' ' && s[i] !== '\t') {
                            return false
                        }
                    }
                    return true
                }
                let oldCount = 0
                let newCount = 0
                lineCharChanges.forEach(charChange => {
                    // char diff
                    // const count = charChange.count
                    const count = charChange.value?.length || 0
                    if (!(count > 0)) {
                        return
                    }
                    const spaceChars = allSpace(charChange.value)
                    // only show space change
                    if (charChange.added) {
                        if (spaceChars) {
                            line.newLine.charRangeStyles = line.newLine.charRangeStyles || []
                            line.newLine.charRangeStyles.push({
                                startCol: newCount + 1,
                                endCol: newCount + count,
                                style: {
                                    // backgroundColor: "#c7f0d2"
                                },
                                className: CLS_CHAR_RANGE_NEW
                            })
                        }
                        newCount += count
                    } else if (charChange.removed) {
                        if (spaceChars) {
                            line.oldLine.charRangeStyles = line.oldLine.charRangeStyles || []
                            line.oldLine.charRangeStyles.push({
                                startCol: oldCount + 1,
                                endCol: oldCount + count,
                                style: {
                                    // backgroundColor: "rgb(250 187 196)"
                                },
                                className: CLS_CHAR_RANGE_DELETE
                            })
                        }
                        oldCount += count
                    } else {
                        oldCount += count
                        newCount += count
                    }
                })
            }
            lines.push(line)
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