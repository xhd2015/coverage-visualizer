import { CSSProperties } from "react"

export interface XgoTestingExplorerDemoProps {
    style?: CSSProperties
    className?: string
}

export function XgoTestingExplorerDemo(props: XgoTestingExplorerDemoProps) {
    return <div className={props.className} style={props.style}>{ }</div>
}