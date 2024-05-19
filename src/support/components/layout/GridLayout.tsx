import { CSSProperties, ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { DragBar } from "./DragBar";

export interface GridLayoutProps {
    style?: CSSProperties
    className?: string

    row?: boolean

    childrenMapping?: { [key: string]: ReactElement }
    initialSettings?: { [key: string]: Settings }
}
interface Settings {
    width?: string
    height?: string
    containerStyle?: CSSProperties
    containerClassName?: string
}

function makeTemplateGrids(arr: string[], opts?: { row?: boolean, needQuote?: boolean }): string {
    if (opts?.row) {
        return arr.map(e => opts?.needQuote ? `"${e}"` : e).join("\n")
    }
    return opts?.needQuote ? `"${arr.join(" ")}"` : arr.join(" ")
}

// column resize: https://codepen.io/lukerazor/pen/GVBMZK
export function GridLayout(props: GridLayoutProps) {
    const templateAreas = useMemo(() => makeGrids(props.childrenMapping, props.initialSettings), [])

    const initialGrids = useMemo(() => {
        const list = templateAreas.map(e => {
            if (e.role === "dragBar") {
                return "2px"
            }
            return props.row ? e.settings?.height : e.settings?.width
        }).map(e => e || "1fr")
        return makeTemplateGrids(list, { row: props.row, needQuote: false })
    }, [templateAreas, props.row])

    const [templateGrids, setTemplateGrids] = useState(initialGrids)

    const rootRef = useRef<HTMLDivElement>()

    return <div
        ref={rootRef}
        style={{
            display: "grid",
            gridTemplateAreas: makeTemplateGrids(templateAreas.map(e => e.area), { row: props.row, needQuote: true }),
            ...(props.row ? {
                gridTemplateRows: templateGrids,
                gridTemplateColumns: "100%",
            } : {
                gridTemplateColumns: templateGrids,
                gridTemplateRows: "100%",
            }),

            ...props.style
        }}
        className={props.className}
    >
        {
            templateAreas.map((e, i) => {
                if (e.role === "child") {
                    return <Grid className={e.settings?.containerClassName} style={{ ...e.settings?.containerStyle, gridArea: e.area }} key={e.area}>{props.childrenMapping?.[e.key]}</Grid>
                }
                return <DragBar
                    selfIndex={i}
                    style={{ gridArea: e.area, cursor: props.row ? "row-resize" : "col-resize", backgroundColor: "rgb(240, 240, 240)" }}
                    key={e.area}
                    getSiblings={() => {
                        if (!rootRef.current) {
                            return []
                        }
                        const items = []
                        for (let j = 0; j < rootRef.current.children.length; j++) {
                            items.push(rootRef.current.children[j])
                        }
                        return items
                    }}
                    resizeHeight={props.row}
                    setSiblingsHeight={(heights) => {
                        const templateCols = heights.map(e => `${e}px`).join(" ")
                        setTemplateGrids(templateCols)
                    }}
                    setSiblingsWidth={widths => {
                        const templateCols = widths.map(e => `${e}px`).join(" ")
                        setTemplateGrids(templateCols)
                    }}
                />
            })
        }
    </div>
}


interface Grid {
    key: string
    area: string
    role: "child" | "dragBar"
    index: number

    childElement?: ReactElement
    settings?: Settings
}

function makeGrids(childrenMapping: { [key: string]: ReactElement }, initialSettings?: { [key: string]: Settings }): Grid[] {
    if (!childrenMapping) {
        return []
    }
    const areas: Grid[] = []
    const entries = Object.entries(childrenMapping)
    const n = entries.length
    let i = 0
    for (let i = 0; i < n; i++) {
        const [k, v] = entries[i]
        areas.push({
            key: k,
            area: `child_${i}`,
            role: "child",
            index: i,
            childElement: v,
            settings: initialSettings?.[k]
        })

        if (i < n - 1) {
            areas.push({
                key: `dragBar_${i}`,
                area: `dragBar_${i}`,
                role: "dragBar",
                index: i,
            })
        }
    }
    return areas
}


export interface GridProps {
    style?: CSSProperties
    className?: string
    onRef?: (e: HTMLDivElement) => void

    children?: ReactElement | ReactElement[]
}

function Grid(props: GridProps) {
    const ref = useRef<HTMLDivElement>()
    useEffect(() => {
        props.onRef?.(ref.current)
    }, [])

    return <div ref={ref}
        style={props.style}
        className={props.className}
    >
        {props.children}
    </div>
}