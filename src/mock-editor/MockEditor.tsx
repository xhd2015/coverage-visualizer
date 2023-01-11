import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Code from "../support/components/v2/Code";
import { FileDetailGetter } from "../support/support/file";
import { useCurrent } from "./react-hooks";
import TraceList from "./TraceList";

import { editor } from "monaco-editor";
import ColResizeBar from "../support/components/v2/ColResizeBar";
import JSONEditorSchema from "./JSONEditorSchema";
import { ItemIndex } from "./List";
import CopyClipboard from "./support/CopyClipboard";
import LayoutLeftRight from "./support/LayoutLeftRight";
import RadioGroup from "./support/RadioGroup";
import { SchemaResult } from "./testing";
import TextEditor from "./TextEditor";
import { CallRecord } from "./trace-types";

export interface TraceItem {
    item: CallRecord;
    root: CallRecord;
    index: ItemIndex;
}
export interface MockData {
    mockMode: MockMode;
    mockResp: string;
    mockErr: string;
}

export interface MockEditorProps {
    callRecords?: CallRecord[]

    getMock?: (item: TraceItem) => MockData | undefined
    onMockChange?: (item: TraceItem, mockData: MockData) => void

    onSelectChange?: (item: TraceItem) => void

    checkNeedMock?: (e: CallRecord) => boolean

    respSchema?: SchemaResult

    style?: CSSProperties
    className?: string
}

type MockMode = "Mock Response" | "Mock Error" | "No Mock"
type RespEditorOption = "Request" | "Response"

export default function (props: MockEditorProps) {
    const [selectedItem, setSelectedItem] = useState<TraceItem>()
    const selectedRecord = selectedItem?.item

    const [mockData, setMockData] = useState<MockData>()

    const [respMode, setRespMode] = useState<RespEditorOption>("Response")
    const [mockMode, setMockMode] = useState<MockMode>(mockData?.mockMode)
    const [mockResp, setMockResp] = useState<string>(mockData?.mockResp)
    const [mockErr, setMockErr] = useState<string>(mockData?.mockErr)

    const onSelectChangeRef = useCurrent(props.onSelectChange)

    let traceMockMode: MockMode = "No Mock"
    if (selectedRecord?.mockStatus === "mock_error") {
        traceMockMode = "Mock Error"
    } else if (selectedRecord?.mockStatus === "mock_resp") {
        traceMockMode = "Mock Response"
    }

    const getMockRef = useCurrent(props.getMock)
    useEffect(() => {
        onSelectChangeRef.current?.(selectedItem)
        if (!selectedItem) {
            return
        }
        const record = getMockRef?.current?.(selectedItem)
        setMockData(record)
        setMockMode(record?.mockMode || "No Mock")
        setMockResp(record?.mockResp)
        setMockErr(record?.mockErr)
    }, [selectedItem])

    const onMockChangeRef = useCurrent(props.onMockChange)
    const selectedItemRef = useCurrent(selectedItem)
    const calcMockData = useMemo(() => ({ mockMode, mockResp, mockErr }), [mockMode, mockResp, mockErr])
    useEffect(() => {
        if (onMockChangeRef && selectedItemRef.current) {
            onMockChangeRef.current(selectedItemRef.current, calcMockData)
        }
    }, [calcMockData])

    const traceFd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                let content: string = ""
                let language
                if (selectedRecord) {
                    if (respMode === "Response") {
                        if (selectedRecord.error) {
                            content = "Error: " + selectedRecord.error
                            language = "plaintext"
                        } else {
                            content = selectedRecord?.result ? JSON.stringify(selectedRecord?.result, null, "    ") : ""
                            language = "json"
                        }
                    } else {
                        // NOTE: JSON.stringify(undefined) returns undefined
                        content = selectedRecord?.args ? JSON.stringify(selectedRecord?.args, null, "    ") : ""
                        language = "json"
                    }
                }
                return { content, language }
            },
        }
    }, [selectedRecord, respMode])

    // // update selected item's 
    // useEffect(() => {
    // }, [props.callRecords])

    const checkNeedMockRef = useCurrent(props.checkNeedMock)

    const mockSetupEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const mockErrEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const traceEditorRef = useRef<editor.IStandaloneCodeEditor>()

    return <LayoutLeftRight
        rootStyle={{
            display: "flex",
            // height: "610px",
            height: "fit-content",
            minHeight: "400px",
            maxHeight: "610px",
            userSelect: "none",
            ...props.style
            // justifyContent: 'center'
        }}
        onLeftResize={() => {
            if (mockSetupEditorRef.current) {
                mockSetupEditorRef.current.layout()
            }
            if (traceEditorRef.current) {
                traceEditorRef.current.layout()
            }
            if (mockErrEditorRef.current) {
                mockErrEditorRef.current.layout()
            }
        }}
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
        rightChild={<>
            <div style={{ height: "50%", display: "flex", flexDirection: "column" }}>
                <div style={{}}>
                    <div style={{ backgroundColor: "rgb(108 108 108)", color: "white" }}>Set Mock</div>
                    <div style={{ marginLeft: "2px" }}><span style={{ marginRight: "2px" }}><strong>Pkg:</strong></span>
                        <span style={{ color: "#777777", userSelect: "text" }}>{selectedItem?.item?.pkg}</span>
                    </div>
                    <div style={{ marginLeft: "2px" }}><span style={{ marginRight: "2px" }}><strong>Func:</strong></span>
                        <span style={{ color: "#777777", userSelect: "text" }}>{selectedItem?.item?.func}</span>
                        {selectedItem?.item?.func && <CopyClipboard text={selectedItem?.item?.func} />}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                        <RadioGroup<MockMode>
                            options={["Mock Response", "Mock Error", "No Mock"]}
                            value={mockMode || "No Mock"}
                            onChange={setMockMode}
                        /></div>
                </div>
                {
                    mockMode === "No Mock" && <div style={{ height: "200px" }}></div>
                }
                {
                    mockMode === "Mock Response" && <JSONEditorSchema
                        style={{
                            height: "200px"
                        }}
                        value={mockResp}
                        editorRef={mockErrEditorRef}
                        onChange={value => {
                            setMockResp(value)
                        }}
                        schema={props.respSchema}
                    />
                }
                {
                    mockMode === "Mock Error" && <TextEditor
                        style={{
                            // TODO: here
                            //  when using flexGrow instead of height
                            //  the editor will flash on redraw, making it hard to use
                            // reproduce step: 1.comment flexGrow and comment height in and in the next Code element
                            //  2. select Mock to see the effect
                            //
                            // flexGrow: "1",
                            height: "200px"
                        }}
                        value={mockErr}
                        editorRef={mockSetupEditorRef}
                        onChange={value => {
                            setMockErr(value)
                        }}
                    />
                }
            </div>

            <div style={{ height: "50%", marginTop: "10px", display: "flex", flexDirection: "column" }}>
                <div style={{ backgroundColor: "#74a99b", color: "white" }}>Trace</div>
                <div style={{ paddingBottom: "2px" }}>
                    <span style={{ fontWeight: "bold" }}>Status:</span> {
                        (["Mock Response", "Mock Error", "No Mock"] as MockMode[]).map((e, i) => <>{i > 0 && '|'}<span style={{ fontWeight: e === traceMockMode && "bold" }}>{e}</span></>)
                    }
                </div>

                <div style={{ display: "flex" }}>
                    <RadioGroup<RespEditorOption>
                        options={["Request", "Response"]}
                        value={respMode}
                        onChange={setRespMode}
                    /></div>
                <Code
                    containerStyle={{
                        // flexGrow: "1"
                        height: "200px"
                    }}
                    file="traceEditor"
                    editorRef={traceEditorRef}
                    fileDetailGetter={traceFd}
                    readonly={true}
                />
            </div>
        </>}
    />
}