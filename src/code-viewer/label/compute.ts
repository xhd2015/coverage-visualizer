import { FileAnnotation, FileAnnotationMapping, FileStats } from "@/model/AnalyseResult"

export function compareLabel(a: string, b: string): number {
    const [a0, a1] = splitLabel(a)
    const [b0, b1] = splitLabel(b)
    if (a0 === 'ALL') {
        return -1
    }
    if (b0 === 'ALL') {
        return 1
    }
    const d0 = compareString(a0, b0)
    if (d0 != 0) {
        return d0
    }
    return compareString(a1, b1)
}

// type labelType = 'ALL'  |'single' | ''
export function splitLabel(label: string): [string, string] {
    if (label === 'ALL' || label === '' || label === '所有') {
        return ['ALL', label]
    }
    const idx = label.indexOf(":")
    if (idx >= 0) {
        return [label.slice(0, idx), label.slice(idx + 1)]
    }
    const uIdx = label.indexOf("_")
    if (uIdx >= 0) {
        return [label.slice(0, uIdx), label.slice(uIdx + 1)]
    }
    return ['', label]
}
function compareString(a: string, b: string): number {
    if (a === b) {
        return 0
    }
    return a < b ? -1 : 1
}

export interface FileLabelData {
    newLineLabelsToID: { [lineNum: number]: number }
    oldLineLabelsByID: { [id: number]: { [label: string]: boolean } }
}
// deprecated
export function getLineLabelsFromFileData(fileData: FileLabelData, line: number): { [label: string]: boolean } {
    const id = fileData?.newLineLabelsToID?.[line]
    return fileData?.oldLineLabelsByID?.[id]
}
function checkFileHasAnyFeature(file: string, selectedFeatures: { [feature: string]: boolean }, checkFileHasFeature: (feature: string, file: string) => boolean): boolean {
    for (let feature in selectedFeatures) {
        if (selectedFeatures[feature] && checkFileHasFeature(feature, file)) {
            return true
        }
    }
    return false
}

export function filterFilesByFeatures(files: FileAnnotationMapping, selectedFeatures: { [feature: string]: boolean }, checkFileHasFeature: (feature: string, file: string) => boolean, opts?: { hasExtraFeature: (file: string) => boolean }): FileAnnotationMapping {
    if (!files) {
        return undefined
    }
    if (!mapHasData(selectedFeatures)) {
        return files
    }
    const newFiles: FileAnnotationMapping = {}
    for (let file in files) {
        const annotation = files[file]
        const hasAnyFeature = checkFileHasAnyFeature(file, selectedFeatures, checkFileHasFeature) || (opts?.hasExtraFeature ? opts?.hasExtraFeature(file) : false)
        if (!hasAnyFeature) {
            continue
        }
        newFiles[file] = annotation
    }
    return newFiles
}
export function mapHasData(m: any): boolean {
    if (!m) {
        return false
    }
    for (let _ in m) {
        return true
    }
    return false
}

export function checkFileHasChange(file: string, annotation: FileAnnotation): boolean {
    for (let line in annotation.lines) {
        if (annotation.lines[line]?.changed) {
            return true
        }
    }
    return false
}
export function checkFileHasDelete(file: string, annotation: FileAnnotation): boolean {
    if (!annotation.deletedLines) {
        return false
    }
    for (let _ in annotation.deletedLines) {
        return true
    }
    return false
}

export function checkFileHasAnyLabel(file: string, labels: { [label: string]: boolean }, fileData: FileAnnotation) {
    if (!mapHasData(labels)) {
        return true
    }
    for (let line in (fileData?.lines || {})) {
        const lineLabels = fileData?.lines?.[line]?.execLabels
        if (!lineLabels) {
            continue
        }
        for (let label in labels) {
            if (lineLabels?.[label]) {
                return true
            }
        }
    }
    return false
}

// const debugFile = "src/biz/common_service.go"
const debugFile = ""

export function fileAnnotationToFileStats(files: FileAnnotationMapping): FileStats {
    if (!files) {
        return undefined
    }
    const fileStats: FileStats = {}
    for (let file in files) {
        if (debugFile && file !== debugFile) {
            continue
        }
        fileStats[file] = files[file].changeDetail
    }
    return fileStats
}

