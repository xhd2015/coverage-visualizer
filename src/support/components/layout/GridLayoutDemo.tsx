import { CSSProperties } from "react"
import { GridLayout } from "./GridLayout"

export interface GridLayoutDemoProps {
    style?: CSSProperties
    className?: string
}

export function GridLayoutDemo(props: GridLayoutDemoProps) {
    return <GridLayout
        style={{
            height: "400px",
            border: "1px solid grey",
            overflow: "hidden"
        }}
        row
        childrenMapping={{
            "a": <div>A</div>,
            "b": <div>B</div>,
        }}
    />
}