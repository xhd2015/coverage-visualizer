import { CSSProperties } from "react"


export interface TreeListDemoProps {
    style?: CSSProperties
    className?: string
}

export function TreeListDemo(props: TreeListDemoProps) {



    return <div className={props.className} style={props.style}>{ }</div>
}