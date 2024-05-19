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
import { prettyJSONObjectSafe } from "@fultonjs/common/lib/code"

export interface TraceEditorControl {
    layoutEditors: () => void
    notifyMockChanged: () => void
}

export interface TraceEditorProps {
    getMock?: (item: TraceItem) => MockEditData | undefined
    onMockChange?: (item: TraceItem, mockData: MockEditData, prevMockData: MockEditData) => void

    mockType?: MockType
    onMockTypeChange?: (item: TraceItem, mockData: MockEditData, mockType: MockType, prevMockType: MockType, next: () => void) => void

    respSchema?: SchemaResult

    controlRef?: MutableRefObject<TraceEditorControl>


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

    traceItem?: TraceItem

    upperStyle?: CSSProperties
    upperEditorStyle?: CSSProperties
    bottomStyle?: CSSProperties
    bottomEditorStyle?: CSSProperties

    traceOnlyMode?: boolean
}

export function TraceEditor(props: TraceEditorProps) {
    const selectedItem = props.traceItem
    const selectedRecord = selectedItem?.item

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
        if (!selectedItem) {
            return
        }
        updateStatusRef.current?.(selectedItem)
    }, [selectedItem])

    const onMockChangeRef = useCurrent(props.onMockChange)
    const selectedItemRef = useCurrent(selectedItem)
    const calcMockData = useMemo(() => ({ mockMode, mockResp, mockErr }), [mockMode, mockResp, mockErr])
    const [prevMockData, setPrevMockData] = useState<MockEditData>()
    useEffect(() => {
        setPrevMockData(calcMockData)
        if (onMockChangeRef.current && selectedItemRef.current) {
            onMockChangeRef.current(selectedItemRef.current, calcMockData, prevMockData)
        }
    }, [calcMockData])
    const calcMockDataRef = useCurrent(calcMockData)

    const mockSetupEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const mockErrEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const reqEditorRef = useRef<editor.IStandaloneCodeEditor>()
    const respEditorRef = useRef<editor.IStandaloneCodeEditor>()

    if (props.controlRef) {
        props.controlRef.current = {
            layoutEditors() {
                // console.log("leftResize")
                if (mockSetupEditorRef.current) {
                    // console.log("layout mockResp")
                    mockSetupEditorRef.current.layout()
                }
                if (reqEditorRef.current) {
                    // console.log("layout trace")
                    reqEditorRef.current.layout()
                }
                if (respEditorRef.current) {
                    // console.log("layout trace")
                    respEditorRef.current.layout()
                }
                if (mockErrEditorRef.current) {
                    // console.log("layout mockErr")
                    mockErrEditorRef.current.layout()
                }
            },
            notifyMockChanged() {
                updateStatusRef.current?.(selectedItemRef.current)
            }
        }
    }

    return <div>
        <div style={{ /* height: "50%",  */display: "flex", flexDirection: "column", position: "relative", ...props.upperStyle }}>
            <div style={{}}>
                <div style={{ backgroundColor: "rgb(108 108 108)", color: "white" }}>{props.traceOnlyMode ? 'Request' : 'Set Mock'}</div>
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
                {!props.traceOnlyMode &&
                    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                        {
                            !mockInJSON && <> <RadioGroup<MockMode>
                                options={["Mock Response", "Mock Error", "No Mock"]}
                                value={mockMode || "No Mock"}
                                onChange={setMockMode}
                            />
                                <RenderMockType value={mockType} onChange={newMockType => {
                                    if (selectedItemRef.current) {
                                        props.onMockTypeChange?.(selectedItemRef.current, calcMockDataRef.current, newMockType, mockType, () => {
                                            setMockType(newMockType)
                                        })
                                    }
                                }} />
                            </>
                        }
                        {
                            mockInJSON && <div>Mock Editor</div>
                        }
                    </div>
                }
            </div>
            {!props.traceOnlyMode &&
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
            }
            {props.traceOnlyMode && <RequestEditor hasRequest={!!selectedRecord} request={selectedRecord?.args} editorRef={reqEditorRef} style={props.upperEditorStyle} />
            }
        </div>

        <div style={{/*  height: "50%", marginTop: "10px", */ display: "flex", flexDirection: "column", ...props.bottomStyle }}>
            <div style={{ backgroundColor: "#74a99b", color: "white" }}>{props.traceOnlyMode ? 'Response' : 'Trace'}</div>
            {!props.traceOnlyMode &&
                <>
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
                    <RequestResponseEditor
                        hasValue={!!selectedRecord}
                        request={selectedRecord?.args}
                        resp={respMode === "Response"}
                        result={selectedRecord?.result}
                        error={selectedRecord?.error}
                        editorRef={respEditorRef}
                    />
                </>
            }

            {
                props.traceOnlyMode && <ResponseEditor
                    hasResponse={!!selectedRecord}
                    result={selectedRecord?.result}
                    error={selectedRecord?.error}
                    editorRef={respEditorRef}
                    style={props.bottomEditorStyle}
                />
            }
        </div>
    </div>
}


export interface RequestEditorProps {
    style?: CSSProperties
    request?: any
    hasRequest?: boolean
    editorRef?: MutableRefObject<editor.IStandaloneCodeEditor>
}

export function RequestEditor(props: RequestEditorProps) {
    const { request, hasRequest } = props

    const [traceContent, traceLang] = useMemo(() => {
        let content: string = ""
        let language
        if (hasRequest) {
            // NOTE: JSON.stringify(undefined) returns undefined
            content = request !== undefined ? prettyJSONObjectSafe(request) : ""
            language = "json"
        }
        return [content, language]
    }, [hasRequest, request])

    return <JSONEditor
        style={{
            // flexGrow: "1",
            height: "200px",
            ...props.style,
        }}
        editorRef={props.editorRef}
        value={traceContent}
        language={traceLang}
        readonly={true}
    />
}

export interface ResponseEditorProps {
    style?: CSSProperties
    result?: any
    error?: string
    hasResponse?: boolean
    editorRef?: MutableRefObject<editor.IStandaloneCodeEditor>
}

export function ResponseEditor(props: ResponseEditorProps) {
    const { result, error, hasResponse } = props

    const [traceContent, traceLang] = useMemo(() => {
        let content: string = ""
        let language
        if (hasResponse) {
            if (error) {
                content = "Error: " + error
                language = "plaintext"
            } else {
                // NOTE: undefined will return undefined, rather "null"
                content = result !== undefined ? prettyJSONObjectSafe(result) : ""
                language = "json"
            }
        }
        return [content, language]
    }, [hasResponse, error, result])

    return <JSONEditor
        style={{
            // flexGrow: "1"
            height: "200px",
            ...props.style,
        }}

        editorRef={props.editorRef}
        value={traceContent}
        language={traceLang}
        readonly={true}
    />
}

export interface RequestResponseEditorProps {
    hasValue?: boolean

    resp?: boolean

    request?: any
    result?: any
    error?: string
    editorRef?: MutableRefObject<editor.IStandaloneCodeEditor>
}

export function RequestResponseEditor(props: RequestResponseEditorProps) {
    const [traceContent, traceLang] = useMemo(() => {
        let content: string = ""
        let language
        if (props.hasValue) {
            if (props.resp) {
                if (props.error) {
                    content = "Error: " + props.error
                    language = "plaintext"
                } else {
                    // NOTE: undefined will return undefined, rather "null"
                    content = props?.result !== undefined ? prettyJSONObjectSafe(props?.result) : ""
                    language = "json"
                }
            } else {
                // NOTE: JSON.stringify(undefined) returns undefined
                content = props?.request !== undefined ? prettyJSONObjectSafe(props?.request) : ""
                language = "json"
            }
        }
        return [content, language]
    }, [props.hasValue, props.resp, props.request, props.error, props.result])

    return <JSONEditor
        style={{
            // flexGrow: "1"
            height: "200px"
        }}

        editorRef={props.editorRef}
        value={traceContent}
        language={traceLang}
        readonly={true}
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