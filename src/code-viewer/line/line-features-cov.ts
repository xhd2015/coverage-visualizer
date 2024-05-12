import { LineLabelGetter, amendLineLabels } from "../label/amend";

import { loadLines, loadLinesV2 } from "./line-features";
import { BlockLine, BlockLineProps } from "../DiffCodeViewer";
import { IContentDecoration } from "../../support/components/v2/model";
import { CLS_LINE_DELETE, CLS_LINE_NEW } from "../styles";
import { ChangeType } from "../diff-vscode";

import "./line-features-cov.css";

export enum Feature {
    Unchange = "unchange",
    Uncovered = "uncovered",
    Covered = "covered",
    Changed = "changed",
    Deleted = "deleted",
}
export type Colors = "CHANGE" | "DELETE" | "HAS_COV" | "NO_COV" | "UNCHANGE"

export interface LoadLinesOptions {
    selectedColors: Partial<Record<Colors, boolean>>

    hideChanges?: boolean

    file: string
    getNewCode?: (file) => Promise<string>
    getOldCode?: (file) => Promise<string>
    getDecoration?: (file: string) => Promise<IContentDecoration[]>
    getLineLabels?: LineLabelGetter

    mapLines?: (lines: BlockLine[]) => BlockLine[]
}

export interface LoadLinesOptionsV2 {
    selectedColors: Partial<Record<Colors, boolean>>

    hideChanges?: boolean
    newCode?: string
    oldCode?: string
    decorations?: IContentDecoration[]
    getLineLabels?: LineLabelGetter

    mapLines?: (lines: BlockLine[]) => BlockLine[]
}

export async function loadCovLines(opts: LoadLinesOptions): Promise<BlockLineProps[]> {
    const { selectedColors, file, getNewCode, getOldCode, getDecoration, getLineLabels, hideChanges } = opts
    const lines = await loadLines<IContentDecoration, Feature>({
        features: {
            [Feature.Changed]: selectedColors?.["CHANGE"] !== false,
            [Feature.Deleted]: selectedColors?.["DELETE"] !== false,
            [Feature.Covered]: selectedColors?.["HAS_COV"] !== false,
            [Feature.Uncovered]: selectedColors?.["NO_COV"] !== false,
            [Feature.Unchange]: !!selectedColors?.["UNCHANGE"], // default exclude
        },
        file,
        getNewCode,
        getOldCode,
        getDecoration,
        computeFeatures,
        featureNewClassNames: {
            [Feature.Changed]: hideChanges ? [] : [CLS_LINE_NEW],
            [Feature.Covered]: ["line-covered"],
            [Feature.Uncovered]: ["line-uncovered"],
        },
        featureOldClassNames: {
            [Feature.Deleted]: hideChanges ? [] : [CLS_LINE_DELETE],
        },
        mapDiffBlockLines(blockLines) {
            let newBlockLines = blockLines?.map?.(line => amendLineLabels(line, undefined, getLineLabels))
            if (opts?.mapLines) {
                newBlockLines = opts?.mapLines(newBlockLines)
            }
            return newBlockLines
        },
    })
    return lines
}
export async function loadCovLinesV2(opts: LoadLinesOptionsV2): Promise<BlockLineProps[]> {
    const { selectedColors, newCode, oldCode, decorations, getLineLabels, hideChanges } = opts
    const lines = await loadLinesV2<IContentDecoration, Feature>({
        features: {
            [Feature.Changed]: selectedColors?.["CHANGE"] !== false,
            [Feature.Deleted]: selectedColors?.["DELETE"] !== false,
            [Feature.Covered]: selectedColors?.["HAS_COV"] !== false,
            [Feature.Uncovered]: selectedColors?.["NO_COV"] !== false,
            [Feature.Unchange]: !!selectedColors?.["UNCHANGE"], // default exclude
        },
        newCode,
        oldCode,
        decorations,
        computeFeatures,
        featureNewClassNames: {
            [Feature.Changed]: hideChanges ? [] : [CLS_LINE_NEW],
            [Feature.Covered]: ["line-covered"],
            [Feature.Uncovered]: ["line-uncovered"],
        },
        featureOldClassNames: {
            [Feature.Deleted]: hideChanges ? [] : [CLS_LINE_DELETE],
        },
        mapDiffBlockLines(blockLines) {
            let newLines = blockLines?.map?.(line => amendLineLabels(line, undefined, getLineLabels))
            if (opts?.mapLines) {
                newLines = opts.mapLines(newLines)
            }
            return newLines
        },
    })
    return lines
}



const featureMapping: Partial<Record<ChangeType, Feature>> = {
    [ChangeType.Unchange]: Feature.Unchange,
    [ChangeType.Delete]: Feature.Deleted,
    [ChangeType.Insert]: Feature.Changed,
    [ChangeType.Update]: Feature.Changed,
}

function computeFeatures(line: BlockLine, lineMapping: { [line: number]: IContentDecoration }): Partial<Record<Feature, boolean>> {
    const features: Partial<Record<Feature, boolean>> = {}
    const dec = lineMapping[line.newLine?.lineNumber]
    if (dec) {
        if (dec.covered) {
            features[Feature.Covered] = true
        } else {
            features[Feature.Uncovered] = true
        }
    }
    const feature = featureMapping[line.changeType]
    if (feature) {
        features[feature] = true
    }
    return features
}
