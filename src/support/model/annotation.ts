export interface FileDetail {
    IsNew?: boolean
    Deleted?: boolean
    RenamedFrom?: string
    ContentChanged?: boolean
}

// views are just the visual part of annotations

// annotations
export interface ProjectAnnotationView {
    files: FileAnnotationMappingView
}
export type FileAnnotationMappingView = { [shortFileName: string]: FileAnnotationView }
export type LineAnnotationsView = { [lineNum: number]: LineAnnotationView }

export interface FileAnnotationView {
    blocks: { [blockID: number]: BlockAnnotationView }
    changeDetail: FileDetail
    lines: LineAnnotationsView
}

export interface BlockAnnotationView {
}

// key and value matters
export type LabelMapping = { [label: string]: boolean }

// LineAnnotationView is the view part of LineAnnotation
// other fields are intermediate part
export interface LineAnnotationView {
    uncoverable?: boolean
    code?: CodeAnnotationView
    coverageLabels?: LabelMapping
}

export interface CodeAnnotationView {
    // excluded by comment or other labeling
    excluded: boolean
}