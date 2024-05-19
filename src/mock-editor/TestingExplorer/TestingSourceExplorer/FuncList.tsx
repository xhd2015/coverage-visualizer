import { CSSProperties } from "react"

export interface FuncListProps {
    style?: CSSProperties
    className?: string
}

export function FuncList(props: FuncListProps) {
    return <div className={props.className} style={props.style}>{ }</div>
}