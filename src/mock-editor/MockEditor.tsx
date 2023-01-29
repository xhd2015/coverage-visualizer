import { CSSProperties, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { useCurrent } from "./react-hooks";
import TraceList from "./TraceList";

import { editor } from "monaco-editor";
import { BsFileEarmarkCheck } from "react-icons/bs";
import { GoFileCode } from "react-icons/go";
import { VscDebugAlt, VscJson, VscReply } from "react-icons/vsc";
import ColResizeBar from "../support/components/v2/ColResizeBar";
import JSONEditor from "./JSONEditor";
import JSONEditorSchema from "./JSONEditorSchema";
import { ItemIndex } from "./List";
import CopyClipboard from "./support/CopyClipboard";
import Icon from "./support/Icon";
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

export interface MockEditorControl {
    notifyMockChanged: () => void
}

export interface MockEditorProps {
    callRecords?: CallRecord[]

    getMock?: (item: TraceItem) => MockData | undefined
    onMockChange?: (item: TraceItem, mockData: MockData) => void

    onSelectChange?: (item: TraceItem) => void

    checkNeedMock?: (e: CallRecord) => boolean

    respSchema?: SchemaResult

    controlRef?: MutableRefObject<MockEditorControl>


    // the all mock info
    allMock?: string
    // NOTE: if you changethe name to onSaveAllMock
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

type MockMode = "Mock Response" | "Mock Error" | "No Mock"
type RespEditorOption = "Request" | "Response"

export default function (props: MockEditorProps) {
    const [selectedItem, setSelectedItem] = useState<TraceItem>()
    const selectedRecord = selectedItem?.item

    // const [mockInJSON, setMockInJSON] = useState(0)
    // console.log("mockInJSON init:", mockInJSON)
    const mockInJSON = props.mockInJSON

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

    const updateStatusRef = useCurrent((selectedItem: TraceItem) => {
        const record = getMockRef?.current?.(selectedItem)
        setMockData(record)
        setMockMode(record?.mockMode || "No Mock")
        setMockResp(record?.mockResp)
        setMockErr(record?.mockErr)
    })

    useEffect(() => {
        onSelectChangeRef.current?.(selectedItem)
        if (!selectedItem) {
            return
        }
        updateStatusRef.current?.(selectedItem)
    }, [selectedItem])

    const onMockChangeRef = useCurrent(props.onMockChange)
    const selectedItemRef = useCurrent(selectedItem)
    const calcMockData = useMemo(() => ({ mockMode, mockResp, mockErr }), [mockMode, mockResp, mockErr])
    useEffect(() => {
        if (onMockChangeRef && selectedItemRef.current) {
            onMockChangeRef.current(selectedItemRef.current, calcMockData)
        }
    }, [calcMockData])

    const [traceContent, traceLang] = useMemo(() => {
        let content: string = ""
        let language
        if (selectedRecord) {
            if (respMode === "Response") {
                if (selectedRecord.error) {
                    content = "Error: " + selectedRecord.error
                    language = "plaintext"
                } else {
                    // NOTE: undefined will return undefined, rather "null"
                    content = selectedRecord?.result !== undefined ? JSON.stringify(selectedRecord?.result, null, "    ") : ""
                    language = "json"
                }
            } else {
                // NOTE: JSON.stringify(undefined) returns undefined
                content = selectedRecord?.args !== undefined ? JSON.stringify(selectedRecord?.args, null, "    ") : ""
                language = "json"
            }
        }
        return [content, language]
    }, [selectedRecord, respMode])

    // // update selected item's 
    // useEffect(() => {
    // }, [props.callRecords])

    const checkNeedMockRef = useCurrent(props.checkNeedMock)

    const mockSetupEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const mockErrEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const traceEditorRef = useRef<editor.IStandaloneCodeEditor>()

    if (props.controlRef) {
        props.controlRef.current = {
            notifyMockChanged() {
                updateStatusRef.current(selectedItemRef.current)
            },
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
            // console.log("leftResize")
            if (mockSetupEditorRef.current) {
                // console.log("layout mockResp")
                mockSetupEditorRef.current.layout()
            }
            if (traceEditorRef.current) {
                // console.log("layout trace")
                traceEditorRef.current.layout()
            }
            if (mockErrEditorRef.current) {
                // console.log("layout mockErr")
                mockErrEditorRef.current.layout()
            }
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
        rightChild={<>
            <div style={{ /* height: "50%",  */display: "flex", flexDirection: "column", position: "relative" }}>
                <div style={{}}>
                    <div style={{ backgroundColor: "rgb(108 108 108)", color: "white" }}>Set Mock</div>
                    <div style={{ marginLeft: "2px" }}>
                        <span style={{ marginRight: "2px" }}><strong>Pkg:</strong></span>
                        <span style={{ color: "#777777", userSelect: "text" }}>{selectedItem?.item?.pkg}</span>
                    </div>
                    <div style={{ marginLeft: "2px" }}>
                        <span style={{ marginRight: "2px" }}><strong>Func:</strong></span>
                        <span style={{ color: "#777777", userSelect: "text" }}>{selectedItem?.item?.func}</span>
                        {selectedItem?.item?.func && <>
                            <CopyClipboard text={selectedItem?.item?.func} />
                            <CopyClipboard copyIcon={GoFileCode} copiedIcon={BsFileEarmarkCheck} text={selectedItem?.item?.file ? `${selectedItem?.item?.file}:${selectedItem?.item?.line}` : ''} />
                        </>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                        {
                            !mockInJSON && <RadioGroup<MockMode>
                                options={["Mock Response", "Mock Error", "No Mock"]}
                                value={mockMode || "No Mock"}
                                onChange={setMockMode}

                            />
                        }
                        {
                            mockInJSON && <div>Mock Editor</div>
                        }
                    </div>
                </div>
                <div style={{ position: "relative", height: "fit-content" }}>
                    {
                        mockInJSON && <JSONEditorSchema
                            style={{
                                height: "200px"
                            }}
                            key="mockInJSON"
                            value={props.allMock}
                            // editorRef={allMockEditorRef}
                            onChange={props.onAllMockChange}
                            schema={props.mockSchema}
                        />
                    }
                    {
                        !mockInJSON && <>
                            {
                                mockMode === "No Mock" && <div style={{ height: "200px" }}
                                    key="noMock"></div>
                            }
                            {
                                mockMode === "Mock Response" && <JSONEditorSchema
                                    style={{
                                        height: "200px"
                                    }}
                                    key="mockResponse"
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
                                    key="mockErr"
                                    value={mockErr}
                                    editorRef={mockSetupEditorRef}
                                    onChange={value => {
                                        setMockErr(value)
                                    }}
                                />
                            }
                        </>
                    }
                    {/* toolbar */}
                    <div style={{ position: "absolute", top: "0", marginLeft: "2px" }}>
                        <Icon
                            icon={mockInJSON ? VscReply : VscJson}
                            // icon={VscJson}
                            key="A"
                            rootStyle={{ "marginBottom": "2px" }}
                            onClick={() => {
                                // console.log("mockInJSON:", mockInJSON)
                                props.onMockInJSONChange?.(mockInJSON)
                            }} />
                        <Icon
                            key="B"
                            icon={VscDebugAlt}
                            rootStyle={{ "marginBottom": "2px" }}
                            disabled={props.disableDebug}
                            loading={props.debugging}
                            onClick={() => {
                                props.onClickDebug?.()
                            }} />
                    </div>

                </div>

            </div>

            <div style={{/*  height: "50%", marginTop: "10px", */ display: "flex", flexDirection: "column" }}>
                <div style={{ backgroundColor: "#74a99b", color: "white" }}>Trace</div>
                <div style={{ paddingBottom: "2px" }}>
                    <span style={{ fontWeight: "bold" }}>Status:</span> {
                        (["Mock Response", "Mock Error", "No Mock"] as MockMode[]).map((e, i) => <span key={e}>{i > 0 && '|'}<span style={{ fontWeight: e === traceMockMode && "bold" }}>{e}</span></span>)
                    }
                </div>

                <div style={{ display: "flex" }}>
                    <RadioGroup<RespEditorOption>
                        options={["Request", "Response"]}
                        value={respMode}
                        onChange={setRespMode}
                    /></div>

                <JSONEditor
                    style={{
                        // flexGrow: "1"
                        height: "200px"
                    }}

                    editorRef={traceEditorRef}
                    value={traceContent}
                    language={traceLang}
                    readonly={true}
                />
            </div>
        </>}
    />
}