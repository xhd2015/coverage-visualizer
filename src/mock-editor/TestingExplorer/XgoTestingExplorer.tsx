import { CSSProperties } from "react"

export interface XgoTestingExplorerProps {
    style?: CSSProperties
    className?: string
}

export function XgoTestingExplorer(props: XgoTestingExplorerProps) {
    return <div className={props.className} style={props.style}>{ }</div>
}