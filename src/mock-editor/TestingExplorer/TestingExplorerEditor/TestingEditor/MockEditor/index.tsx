import { CSSProperties, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { useCurrent } from "../../../../react-hooks";
import TraceList, { useTraceListController } from "../../TraceList";

import { editor } from "monaco-editor";
import { BsFileEarmarkCheck } from "react-icons/bs";
import { GoFileCode } from "react-icons/go";
import { VscDebugAlt, VscJson, VscReply } from "react-icons/vsc";
import ColResizeBar from "../../../../../support/components/v2/ColResizeBar";
import JSONEditor from "../../../../JSONEditor";
import JSONEditorSchema from "../../../../JSONEditorSchema";
import { ItemIndex } from "../../../../List";
import CopyClipboard from "../../../../support/CopyClipboard";
import Icon from "../../../../support/Icon";
import LayoutLeftRight from "../../../../support/LayoutLeftRight";
import RadioGroup from "../../../../support/RadioGroup";
import TextEditor from "../../../../TextEditor";
import { SchemaResult } from "../../../testing";
import { CallRecord } from "../../TraceList/trace-types";
import { TraceItem, MockEditData, MockType, MockMode, RespEditorOption } from "../../types";
import { TraceEditor, TraceEditorControl } from "./TraceEditor";

export interface MockEditorControl {
    notifyMockChanged: () => void
    notifyRespChanged: () => void
}

export interface MockEditorProps {
    callRecords?: CallRecord[]

    getMock?: (item: TraceItem) => MockEditData | undefined
    onMockChange?: (item: TraceItem, mockData: MockEditData, prevMockData: MockEditData) => void

    mockType?: MockType
    onMockTypeChange?: (item: TraceItem, mockData: MockEditData, mockType: MockType, prevMockType: MockType, next: () => void) => void

    onSelectChange?: (item: TraceItem) => void

    checkNeedMock?: (e: CallRecord) => boolean

    respSchema?: SchemaResult

    controlRef?: MutableRefObject<MockEditorControl>


    // the all mock info
    allMock?: string
    // NOTE: if you change the name to onSaveAllMock
    // the click won't work, don't know why
    // onAllMockSave?: (val: string) => void
    onAllMockChange?: (val: string) => void
    mockSchema?: SchemaResult

    // must define this in parent, don't
    // known why it won't working
    // in child
    mockInJSON?: boolean
    onMockInJSONChange?: (v: boolean) => void
    // onWillChangeMockInJSON

    style?: CSSProperties
    className?: string

    disableDebug?: boolean
    debugging?: boolean
    onClickDebug?: () => void
}

export default function (props: MockEditorProps) {
    const [selectedItem, setSelectedItem] = useState<TraceItem>()
    const selectedRecord = selectedItem?.item

    // const [mockInJSON, setMockInJSON] = useState(0)
    // console.log("mockInJSON init:", mockInJSON)
    const mockInJSON = props.mockInJSON

    const [mockData, setMockData] = useState<MockEditData>()

    const [respMode, setRespMode] = useState<RespEditorOption>("Response")
    const [mockMode, setMockMode] = useState<MockMode>(mockData?.mockMode)
    const [mockResp, setMockResp] = useState<string>(mockData?.mockResp)
    const [mockErr, setMockErr] = useState<string>(mockData?.mockErr)

    const [mockType, setMockType] = useState<MockType>(props.mockType)
    useEffect(() => {
        setMockType(props.mockType)
    }, [props.mockType])

    const onSelectChangeRef = useCurrent(props.onSelectChange)

    let traceMockMode: MockMode = "No Mock"
    if (selectedRecord?.mockStatus === "mock_error") {
        traceMockMode = "Mock Error"
    } else if (selectedRecord?.mockStatus === "mock_resp") {
        traceMockMode = "Mock Response"
    }

    useEffect(() => {
        onSelectChangeRef.current?.(selectedItem)
        if (!selectedItem) {
            return
        }
    }, [selectedItem])

    const selectedItemRef = useCurrent(selectedItem)


    // // update selected item's 
    // useEffect(() => {
    // }, [props.callRecords])

    const checkNeedMockRef = useCurrent(props.checkNeedMock)
    const traceListControllerRef = useTraceListController()
    const traceEditorRef = useRef<TraceEditorControl>()

    if (props.controlRef) {
        props.controlRef.current = {
            notifyMockChanged() {
                traceEditorRef.current?.notifyMockChanged?.()
            },
            notifyRespChanged() {
                traceListControllerRef.current?.refreshMockProperty?.()
            }
        }
    }



    return <LayoutLeftRight
        rootStyle={{
            display: "flex",
            // height: "610px",
            height: "fit-content",
            minHeight: "400px",
            // maxHeight: "610px",
            userSelect: "none",
            ...props.style
            // justifyContent: 'center'
        }}
        watchRootResize
        onLeftResize={() => {
            traceEditorRef.current?.layoutEditors?.()
        }}
        leftHeightMatchRight
        leftStyle={{ position: "relative" }}
        leftChild={<>
            <TraceList
                style={{
                    minWidth: "300px",
                    // width: "250px",
                    width: "fit-content",
                    height: "100%",
                    // override border
                    // "border": undefined,
                    "borderColor": "#b5b8bb",
                    "borderRightWidth": "2px",
                    "borderRightColor": "#b5b8bb",
                    // overflowX: "hidden"
                    overflowX: "auto"
                }}
                controllerRef={traceListControllerRef}
                getMockProperty={e => {
                    return {
                        mocked: e.mockStatus === "mock_error" || e.mockStatus === "mock_resp",
                        needMock: checkNeedMockRef.current?.(e),
                    }
                }}
                records={props.callRecords}
                onSelectChange={(item, root, index) => {
                    setSelectedItem({ item, root, index })
                }}
            />
            <ColResizeBar
                barColor="#dddd85" // yellow like
                getTargetElement={e => {
                    return e.parentElement.firstElementChild as HTMLElement
                }} />
        </>
        }
        rightStyle={{
            // flexGrow: undefined
            display: "flex",
            flexDirection: "column"
        }}
        rightChild={<TraceEditor
            controlRef={traceEditorRef}

            traceItem={selectedItem}

            getMock={props.getMock}
            onMockChange={props.onMockChange}

            mockType={props.mockType}
            onMockTypeChange={props.onMockTypeChange}
            respSchema={props.respSchema}

            allMock={props.allMock}
            onAllMockChange={props.onAllMockChange}
            mockSchema={props.mockSchema}

            mockInJSON={props.mockInJSON}
            onMockInJSONChange={props.onMockInJSONChange}

            disableDebug={props.disableDebug}
            debugging={props.debugging}
            onClickDebug={props.onClickDebug}
        />}
    />
}

function RenderMockType(props: { value?: MockType, onChange?: (value: MockType) => void }) {
    return <span>
        <span>{'Set For '}</span>
        <select value={props.value || "all"} onChange={e => props.onChange?.(e.target.value as MockType)}>
            <option value="all">All</option>
            <option value="current">Current</option>
        </select>
    </span>
}