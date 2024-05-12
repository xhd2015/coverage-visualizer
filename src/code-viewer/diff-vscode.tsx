
import { DiffComputer } from "monaco-editor/esm/vs/editor/common/diff/diffComputer"


export interface LineChange {
    originalStartLineNumber: number
    originalEndLineNumber: number  // 0: insertion
    modifiedStartLineNumber: number
    modifiedEndLineNumber: number // 0: delete

    charChanges?: CharChange[] // optional, if shouldComputeCharChanges is true
}
export interface CharChange {
    originalStartLineNumber: number
    originalStartColumn: number
    originalEndLineNumber: number
    originalEndColumn: number

    modifiedStartLineNumber: number
    modifiedStartColumn: number
    modifiedEndLineNumber: number
    modifiedEndColumn: number
}

export interface DiffOptions {
    pretty?: boolean // default true
    charChange?: boolean // default false
}
export function diff(oldLines: string[], newLines: string[], opts?: DiffOptions): LineChange[] {
    // create the diff computer
    const computer = new DiffComputer(oldLines || [], newLines || [], {
        shouldMakePrettyDiff: opts?.pretty !== false,
        shouldComputeCharChanges: opts?.charChange,
        shouldIgnoreTrimWhitespace: true,
        maxComputationTime: Number.MAX_VALUE, // to unlimit the cost used, return all meaningful changes
    })
    const res = computer.computeDiff()
    return res.changes
}
export enum ChangeType {
    None = "none",
    Unchange = "unchange",
    Update = "update",
    Insert = "insert",
    Delete = "delete",
}

// forEachLineMapping iterate each line range with associated markup
// NOTE: when fn gets called, the lines are 1-based, and start is inclusive, end is exclusive.
export function forEachLineMapping(changes: LineChange[], oldLines: number, newLines: number, fn: (oldLineStart: number, oldLineEnd: number, newLineStart: number, newLineEnd: number, changeType: ChangeType, charChanges: CharChange[]) => void) {
    // convert changes to line mapping
    let oldLineStart = 1
    let newLineStart = 1
    const n = changes?.length
    for (let i = 0; i <= n; i++) {
        let oldLineEnd = 0
        let newLineEnd = 0
        let oldLineStartNext = 0  // to update oldLineStart
        let newLineStartNext = 0 // to update newLineStart
        let oldLineStartNextForCallback = 0  // to call fn
        let newLineStartNextForCallback = 0// to call fn

        let changeType = ChangeType.None
        let charChanges: CharChange[]
        if (i < n) {
            const change = changes[i]
            charChanges = change.charChanges
            changeType = ChangeType.Update
            oldLineEnd = change.originalStartLineNumber
            oldLineStartNext = change.originalEndLineNumber + 1
            oldLineStartNextForCallback = oldLineStartNext

            // lines before change are unmodified
            if (!change.originalEndLineNumber) {
                // insertion of new text, align at next line
                oldLineEnd++
                oldLineStartNext = oldLineEnd
                oldLineStartNextForCallback = oldLineEnd
                changeType = ChangeType.Insert
            }
            newLineEnd = change.modifiedStartLineNumber
            newLineStartNext = change.modifiedEndLineNumber + 1
            newLineStartNextForCallback = newLineStartNext
            if (!change.modifiedEndLineNumber) {
                // deletion of old text
                newLineEnd++
                newLineStartNext = newLineEnd
                newLineStartNextForCallback = newLineEnd
                changeType = ChangeType.Delete
            }
        } else {
            // lines are 1-based
            oldLineEnd = oldLines + 1
            newLineEnd = newLines + 1
        }

        // unchanged mapping must have exactluy same count of lines
        const m = newLineEnd - newLineStart
        if (m != oldLineEnd - oldLineStart) {
            throw new Error(`unchanged range not the same: new=[${newLineStart}->${newLineEnd}](${m}), old=[${oldLineStart}->${oldLineEnd}](${oldLineEnd - oldLineStart})`)
        }
        // unchanged lines
        fn(oldLineStart, oldLineEnd, newLineStart, newLineEnd, ChangeType.Unchange, undefined)
        if (changeType !== ChangeType.None) {
            fn(oldLineEnd, oldLineStartNextForCallback, newLineEnd, newLineStartNextForCallback, changeType, charChanges)
        }

        oldLineStart = oldLineStartNext
        newLineStart = newLineStartNext
    }
}
