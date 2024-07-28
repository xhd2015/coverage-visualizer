import { TraceEditor } from "../mock-editor/TestingExplorer/TestingExplorerEditor/TestingEditor/MockEditor/TraceEditor";
import TraceList from "../mock-editor/TestingExplorer/TestingExplorerEditor/TraceList";
import { CallRecord } from "../mock-editor/TestingExplorer/TestingExplorerEditor/TraceList/trace-types";
import { TraceItem } from "../mock-editor/TestingExplorer/TestingExplorerEditor/types";
import { GridLayout } from "../support/components/layout/GridLayout";
import { CSSProperties } from "react";

export interface TraceExplorerProps {
    style?: CSSProperties
    records?: CallRecord[]
    selectedRecord?: TraceItem
    setSelectedRecord?: (value: React.SetStateAction<TraceItem>) => void

    disableMockCheckbox?: boolean
}

// using GridLayout
export function TraceExplorer(props: TraceExplorerProps) {
    const { records, selectedRecord, setSelectedRecord } = props

    return <GridLayout
        style={{
            // border: "1px solid grey",
            overflow: "hidden",
            // why 100%?
            //    https://stackoverflow.com/questions/24956479/why-do-we-give-height-100-to-our-body-and-html
            height: "800px",
            ...props.style,
        }}
        // className={props.className}
        initialSettings={{
            "traceList": {
                width: "300px",
                containerStyle: {
                    overflowX: "hidden",
                    overflowY: "auto",
                    height: "100%"
                }
            },
            "traceDetail": {
                containerStyle: {
                    border: "1px solid green"
                }
            }
        }}
        childrenMapping={{
            "traceList": <TraceList
                style={{ height: "100%" }}
                records={records}
                autoSelectFirst
                disableMockCheckbox={props.disableMockCheckbox}
                onSelectChange={(item, root, index) => {
                    setSelectedRecord?.({ item, root, index })
                }}
            />,
            "traceDetail": <TraceEditor
                traceItem={selectedRecord}
                traceOnlyMode
                upperStyle={{ height: "400px" }}
                upperEditorStyle={{ height: "300px" }}
                bottomStyle={{ height: "400px" }}
                bottomEditorStyle={{ height: "300px" }}
            />
        }}
    />
}