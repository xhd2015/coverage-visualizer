import { CSSProperties } from "react"

export interface CaseListProps {
    style?: CSSProperties
    className?: string
}

export function CaseList(props: CaseListProps) {
    return <div className={props.className} style={props.style}>{ }</div>
}