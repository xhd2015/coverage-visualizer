
import { BlockLine, BlockLineProps } from "../DiffCodeViewer";
import { compactLines, diffCode } from "../diff";
import { go } from "../lang";

export type Feature = string

export interface CodeDecoration {
    lineNumber: number
}

export interface LoadLinesOptions<T extends CodeDecoration, F extends string> {
    // all shown features, show if set to true
    features: Partial<Record<F, boolean>>
    file: string
    getNewCode?: (file) => Promise<string>
    getOldCode?: (file) => Promise<string>
    getDecoration?: (file: string) => Promise<T[]>

    // compute line features
    computeFeatures?: (line: BlockLine, lineMapping: { [line: number]: T }) => Partial<Record<F, boolean>>

    featureNewClassNames?: Partial<Record<F, string[]>>
    featureOldClassNames?: Partial<Record<F, string[]>>

    mapDiffBlockLines?: (blockLines: BlockLine[]) => BlockLine[]
}

export interface LoadLinesOptionsV2<T extends CodeDecoration, F extends string> {
    features?: Partial<Record<F, boolean>>
    newCode: string
    oldCode?: string
    decorations?: T[]
    computeFeatures?: (line: BlockLine, lineMapping: { [line: number]: T }) => Partial<Record<F, boolean>>

    featureNewClassNames?: Partial<Record<F, string[]>>
    featureOldClassNames?: Partial<Record<F, string[]>>
    mapDiffBlockLines?: (blockLines: BlockLine[]) => BlockLine[]
}
// load lines, lines are compacted
// F represents feature
// deprecated, use loadLinesV2
export async function loadLines<T extends CodeDecoration, F extends string>(opts: LoadLinesOptions<T, F>): Promise<BlockLineProps[]> {
    const { features, file, getNewCode, getOldCode, getDecoration, featureNewClassNames, featureOldClassNames, computeFeatures, mapDiffBlockLines } = opts
    const [oldCode, newCode] = await Promise.all([
        getOldCode?.(file),
        getNewCode?.(file),
    ])
    const decorations = await getDecoration?.(file)

    return loadLinesV2({
        features,
        newCode,
        oldCode,
        decorations,
        computeFeatures,
        featureNewClassNames,
        featureOldClassNames,
        mapDiffBlockLines,
    })
}

// load lines, lines are compacted
// F represents feature
export async function loadLinesV2<T extends CodeDecoration, F extends string>(opts: LoadLinesOptionsV2<T, F>): Promise<BlockLineProps[]> {
    if (!opts?.computeFeatures) {
        throw new Error("require computeFeatures")
    }
    const { features, oldCode, newCode, decorations, featureNewClassNames, featureOldClassNames, computeFeatures, mapDiffBlockLines } = opts
    const lineMapping: { [line: number]: T } = {}
    const desc = decorations
    desc?.forEach?.(d => lineMapping[d.lineNumber] = d)

    // debug
    // let debug = false
    // if (newCode.includes("func InitTask(ctx context.Context) {")) {
    //     debug = true
    // }

    let blockLines = await diffCode(oldCode, newCode,
        {
            baseProps: {
                grammar: go.grammar,
                language: go.langauge,
                className: "", // override default className
            },
            // use default local diff
            // diffLines: (oldLines, newLines) => diffLines(oldLines, newLines),
        }
    )
    if (mapDiffBlockLines) {
        blockLines = mapDiffBlockLines(blockLines)
    }

    const lineFeatures = blockLines?.map?.(line => computeFeatures(line, lineMapping))
    const featuresExcluded: Partial<Record<F, boolean>> = {}
    Object.keys(features || {}).forEach(f => {
        if (!features[f]) {
            featuresExcluded[f] = true
        }
    })

    const styles = lineFeatures?.map?.(lineFeature => computeStyle(lineFeature, featuresExcluded, features, featureNewClassNames, featureOldClassNames))

    const lines = compactLines(blockLines, {
        shouldShow(line) {
            const { hide } = styles[line.index]
            return !hide
        },
    })
    lines.forEach(e => {
        const style = styles[e.line?.index]
        if (!style) {
            return
        }
        const { newClassNames, oldClassNames } = style
        if (e.line?.newLine && newClassNames?.length) {
            e.line.newLine.className = `${newClassNames.join(" ")} ${e.line.newLine.className}`
        }
        if (e.line?.oldLine && oldClassNames?.length) {
            e.line.oldLine.className = `${oldClassNames.join(" ")} ${e.line.oldLine.className}`
        }
    })
    return lines
}

function computeStyle<F extends string>(lineFeatures: Partial<Record<F, boolean>>, featuresExcluded: Partial<Record<F, boolean>>, allFeatures: Partial<Record<F, boolean>>, featureNewClassNames: Partial<Record<F, string[]>>, featureOldClassNames: Partial<Record<F, string[]>>): { hide: boolean, newClassNames?: string[], oldClassNames?: string[] } {
    // filter falsy features
    const lineFeaturesTruthy: Partial<Record<F, boolean>> = {}
    Object.keys(lineFeatures || {}).forEach(k => {
        if (lineFeatures[k]) {
            lineFeaturesTruthy[k] = true
        }
    })

    const lineFeaturesExcludeMapping = {}
    Object.keys(lineFeaturesTruthy).forEach(k => lineFeaturesExcludeMapping[k] = false)
    Object.keys(featuresExcluded).forEach(f => {
        if (f in lineFeaturesExcludeMapping && featuresExcluded[f]) {
            lineFeaturesExcludeMapping[f] = true
        }
    })
    // if all excluded, hide
    // otherwise, choose className based on priority
    let allExcluded = true
    for (let f in lineFeaturesExcludeMapping) {
        if (!lineFeaturesExcludeMapping[f]) {
            allExcluded = false
            break
        }
    }

    // even hide is true, it is still possibly shown by ctx
    const hide = allExcluded
    const newClassNames: string[] = []
    const oldClassNames: string[] = []

    Object.keys(allFeatures).forEach(f => {
        // line has feature f, and not excluded
        if (lineFeaturesTruthy[f] && !lineFeaturesExcludeMapping[f]) {
            newClassNames.push(...(featureNewClassNames?.[f] || []))
            oldClassNames.push(...(featureOldClassNames?.[f] || []))
        }
    })

    return { hide, newClassNames, oldClassNames }
}
