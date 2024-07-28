import { TraceEditor } from "../mock-editor/TestingExplorer/TestingExplorerEditor/TestingEditor/MockEditor/TraceEditor";
import TraceList, { useTraceListController } from "../mock-editor/TestingExplorer/TestingExplorerEditor/TraceList";
import { CallRecord } from "../mock-editor/TestingExplorer/TestingExplorerEditor/TraceList/trace-types";
import { TraceItem } from "../mock-editor/TestingExplorer/TestingExplorerEditor/types";
import { attachMouseEvents } from "../support/components/resize/mouse";
import { CSSProperties, useEffect, useRef, useState } from "react";

export interface TraceExplorerOldProps {
    style?: CSSProperties
    records: CallRecord[]
    selectedRecord: TraceItem
    setSelectedRecord: (value: React.SetStateAction<TraceItem>) => void
}

// Deprecated: left here only for reference purpose
export function TraceExplorerOld(props: TraceExplorerOldProps) {
    const { records, selectedRecord, setSelectedRecord } = props
    const listRef = useRef<HTMLDivElement>()

    const resizeBarRef = useRef<HTMLDivElement>()
    const contentRef = useRef<HTMLDivElement>()
    const traceListController = useTraceListController()

    const [templateCols, setTemplateCols] = useState("200px 2px 1fr")

    useEffect(() => {
        let pageX: number
        let widths: number[]

        let savedUserSelect

        const getWidth = (e: HTMLElement): number => {
            return e.getBoundingClientRect().width
        }
        return attachMouseEvents(resizeBarRef.current, {
            onMouseOver(e) {
                e.target.style.borderRight = "2px solid #40a9ff"
            },
            onMouseOut(e) {
                e.target.style.borderRight = ""
            },
            onMouseDown(e) {
                pageX = e.pageX
                document.body.style.userSelect = savedUserSelect
                document.body.style.userSelect = "none"

                widths = [getWidth(listRef.current), getWidth(resizeBarRef.current), getWidth(contentRef.current)]
            },
            onMouseMove(e) {
                const diff = e.pageX - pageX
                const newWidths = [...widths]
                newWidths[0] += diff
                newWidths[2] -= diff

                const templateCols = newWidths.map(e => `${e}px`).join(" ")
                setTemplateCols(templateCols)
            },
            onMouseUp(e) {
                let val = savedUserSelect
                if (val === undefined) {
                    val = "initial"
                }
                document.body.style.userSelect = val

            },
        })
    }, [])

    return <div style={{
        display: "grid",
        gridTemplateAreas: `"traceList dragBar content"`,
        gridTemplateColumns: templateCols,
        gridTemplateRows: "800px",
        ...props.style,
    }}>

        <div style={{ gridArea: "traceList", resize: "horizontal" }} ref={listRef}>
            <TraceList
                style={{ height: "100%" }}
                records={records}
                controllerRef={traceListController}
                autoSelectFirst
                onSelectChange={(item, root, index) => {
                    setSelectedRecord({ item, root, index })
                }}
            />
        </div>
        <div style={{ gridArea: "dragBar", cursor: "col-resize" }} ref={resizeBarRef}></div>
        <div style={{ gridArea: "content", border: "1px solid green" }} ref={contentRef}>
            <TraceEditor
                traceItem={selectedRecord}
                traceOnlyMode
                upperStyle={{ height: "400px" }}
                upperEditorStyle={{ height: "300px" }}
                bottomStyle={{ height: "400px" }}
                bottomEditorStyle={{ height: "300px" }}
            />
        </div>
    </div>
}
