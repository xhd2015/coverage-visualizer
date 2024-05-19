import { CSSProperties } from "react"

export interface FileListProps {
    style?: CSSProperties
    className?: string
}
// a FileList should support:
//    search, filter, collapse

export function FileList(props: FileListProps) {
    return <div className={props.className} style={props.style}>

    </div>
}