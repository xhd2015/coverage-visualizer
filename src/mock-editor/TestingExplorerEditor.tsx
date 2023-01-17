import { CSSProperties, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import MockEditor, { MockData as MockEditorData, MockEditorControl, TraceItem } from "./MockEditor";
import { useCurrent } from "./react-hooks";
import { buildJSONSchema, buildRespJSONSchemaMapping, MockData, MockInfo, SchemaResult, serializeMockData, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { API } from "./testing-api";
import TestingEditor, { TestingCaseConfig, TestingCaseResult, TestingEditorControl } from "./TestingEditor";
import "./TestingEditor.css";
import { tryParse } from "./TestingExplorerEditorDemo";
import { RootRecord } from "./trace-types";
import { stringifyData, stringifyDataIndent } from "./util/format";
import { debounce } from "lodash"

export interface ExtensionData {
    trace?: RootRecord
}

// TODO: 
// 1.make api request local
// 2. code editor relayout [done]
// 3. fix width overflow [done]
// 4. add top nav link
// 5. fix vscode missing icons [done]
// 6. only parse json when lastly submit request [done]
// 7. unified error prompt
// 8. margin to scroll?
// 9. JSON schema support [done]
// 10. unused mock detection [planed previously]
// 11. multi mock for one site
// 12. add file and line info 
// 13. add dir [done] [6hrs]
// 14. fix no end when panic
// 15. fix assert error not effective

export interface TestingExplorerEditorControl {

}

export function useTest(): MutableRefObject<TestingExplorerEditorControl> {
    return useRef<TestingExplorerEditorControl>()
}

export interface TestingExplorerEditorProps {
    caseName?: string
    caseData?: TestingCase



    mockInfo?: MockInfo

    saveBeforeRequest?: boolean // default true

    save?: (caseName: string, caseData: TestingCase) => Promise<void>
    request?: (req: TestingRequestV2) => Promise<TestingResponseV2<ExtensionData> | undefined>

    pendingAction?: () => void

    controlRef?: MutableRefObject<TestingExplorerEditorControl>
    style?: CSSProperties;
}

export default function (props: TestingExplorerEditorProps) {
    const controllerRef = useRef<TestingEditorControl>()

    const [mockInfo, setMockInfo] = useState<MockInfo>()
    const [data, setData] = useState<TestingCase>(props.caseData)

    const [selItem, setSelItem] = useState<TraceItem>()

    // const [name, setName] = useState(props.caseName)
    const nameRef = useCurrent(props.caseName)
    const [respData, setRespData] = useState<TestingResponseV2<ExtensionData>>()

    const saveBeforeRequestRef = useCurrent(props.saveBeforeRequest)
    const saveRef = useCurrent(props.save)

    useEffect(() => {
        if (props.pendingAction) {
            controllerRef.current?.confirmOrDo?.(props.pendingAction)
        }
    }, [props.pendingAction])

    const [config, setConfig] = useState<TestingCaseConfig>()
    useEffect(() => {
        if (!data && !respData) {
            return setConfig({ name: nameRef.current })
        }
        setConfig({
            name: nameRef.current,
            request: stringifyDataIndent(data?.Request),
            comment: data.Comment,
            skip: data.Skip,
            expectErr: !!data.AssertError,
            expectErrStr: data.AssertError,
            expectResponse: !data.AssertError ? stringifyDataIndent(data.Asserts) : "",
        })
    }, [data])
    const configRef = useCurrent(config)

    useEffect(() => {
        setConfig(e => ({ ...e, name: props.caseName }))
    }, [props.caseName])

    // const mockCur = useRef(data?.Mock)
    const mockRef = useRef(data?.Mock)
    useEffect(() => {
        mockRef.current = data?.Mock
    }, [data?.Mock])

    const getCaseData = (): TestingCase => {
        const config = configRef.current
        return {
            Request: tryParse(config.request),
            Skip: !!config.skip,
            Mock: serializeMockData(mockRef.current),
            Asserts: config.expectErr ? undefined : tryParse(config.expectResponse) as TestingCase["Asserts"],
            AssertError: config.expectErr ? config.expectErrStr : "",
            Comment: config.comment,
            AssertMockRecord: undefined,
        }
    }

    const result: TestingCaseResult = useMemo((): TestingCaseResult => {
        if (!respData) {
            return undefined
        }

        let status: TestingCaseResult["status"]
        if (respData?.AssertResult?.success) {
            status = "pass"
        } else if (!respData.AssertResult) {
            status = "warning"
        } else if (respData.Error) {
            status = "fail"
        }

        return {
            response: stringifyDataIndent(respData?.Response),
            responseError: respData?.Error,
            status: status,
            msg: respData?.Error ? respData?.Error : (respData?.AssertResult?.success ? "" : respData?.AssertResult?.fails?.[0]?.str)
        }
    }, [respData])

    // get the case
    // useEffect(() => {
    //     props.api.loadCase().then(setData)
    // }, [])
    useEffect(() => setData(props.caseData), [props.caseData])

    // useEffect(() => {
    //     props.api?.loadMockInfo().then(setMockInfo)
    // }, [])
    useEffect(() => setMockInfo(props.mockInfo), [props.mockInfo])

    const schemaMapping = useMemo(() => buildRespJSONSchemaMapping(mockInfo), [mockInfo])
    const rootMockSchema = useMemo(() => buildJSONSchema(mockInfo), [mockInfo])
    const respSchema = useMemo((): SchemaResult => {
        const { pkg, func } = selItem?.item || {}
        const respSchema = schemaMapping?.[pkg]?.[func]
        return respSchema
    }, [schemaMapping, selItem])

    const controlRef = useRef<MockEditorControl>()
    const [allMock, setAllMock] = useState<string>()
    const [mockJSON, setMockJSON] = useState(false)

    const updateHandler = useCurrent((allMock: string) => {
        // if all mock changed, propagate to underlying
        const mockData: MockData = tryParse(allMock) as MockData
        if (!mockData) {
            return
        }
        const newMockData = serializeMockData(mockData)
        mockRef.current = newMockData
        // setMockData(newMockData)
        // update
    })

    const updateMockJSON = useMemo(() => {
        // TODO: use debounce
        return debounce((allMock: string) => {
            setAllMock(allMock)
            updateHandler.current(allMock)
        }, 2 * 100)
    }, [])

    const callRecord = respData?.Extension?.Data?.trace
    const callRecordMemo = useMemo(() => callRecord?.root ? [callRecord?.root] : [], [callRecord])

    const requestRef = useCurrent(props.request)
    const [requesting, setRequesting] = useState(false)
    const requestHandler = async () => {
        if (controllerRef.current.requesting) {
            return
        }
        if (saveBeforeRequestRef.current !== false && saveRef.current) {
            await saveRef.current(configRef.current?.name, getCaseData())
        }
        if (!requestRef.current) {
            return
        }
        // clear previous result
        setRespData(undefined)
        controllerRef.current.setRequesting(true)
        setRequesting(true)
        const config = controllerRef.current.config
        requestRef.current?.({
            request: config.request,
            assertIsErr: config.expectErr,
            assertError: config.expectErrStr,
            asserts: config.expectResponse,
            mock: stringifyData(serializeMockData(mockRef.current)), // serialize so that resp have correct type instead of raw string
        } as TestingRequestV2
        ).then((respData: TestingResponseV2<ExtensionData>) => {
            setRespData(respData)
        }).finally(() => {
            controllerRef.current.setRequesting(false)
            setRequesting(false)
        })
    }
    return <TestingEditor
        config={config}
        result={result}

        controllerRef={controllerRef}
        onChange={config => {
            setConfig(config)
        }}
        saveHandler={async () => {
            if (saveBeforeRequestRef.current !== false && saveRef.current) {
                await saveRef.current(configRef.current?.name, getCaseData())
            }
        }}
        onRequest={requestHandler}
        // header={
        //     <div className="flex-center">
        //         <div>
        //             <span>Package:</span><span>A</span>
        //         </div>
        //         <div style={{ marginLeft: "4px" }}>
        //             <span>Func:</span><span>B</span>
        //         </div>
        //     </div>
        // }
        mockEditor={
            <MockEditor
                style={{
                    width: "100%",
                    ...props.style,
                }}
                callRecords={callRecordMemo}
                onSelectChange={item => {
                    setSelItem(item)
                }}
                controlRef={controlRef}
                respSchema={respSchema}
                allMock={allMock}
                onAllMockChange={updateMockJSON}
                mockInJSON={mockJSON}
                onMockInJSONChange={prevInJSON => {
                    // immediately update
                    if (!prevInJSON) {
                        // changed from non mock to mock, setup initial content
                        setAllMock(stringifyDataIndent(mockRef.current))
                    } else {
                        // changed from mock to no mock, notify change
                        controlRef.current?.notifyMockChanged?.()
                    }
                    setMockJSON(!prevInJSON)
                }}
                // onAllMockSave={updateAllMock}
                mockSchema={rootMockSchema}
                getMock={(item) => {
                    const mockItem = mockRef.current?.Mapping?.[item?.item?.pkg]?.[item?.item?.func]
                    if (!mockItem) {
                        return undefined
                    }
                    return {
                        ...mockItem,
                        mockMode: mockItem.Error ? "Mock Error" : "Mock Response",
                        mockErr: mockItem.Error,
                        mockResp: stringifyDataIndent(mockItem.Resp) // needs to be string, not object
                    }
                }}
                checkNeedMock={(e) => {
                    const mockItem = mockRef.current?.Mapping?.[e?.pkg]?.[e?.func]
                    return !!mockItem
                }}
                onMockChange={(item, data) => {
                    const { pkg, func } = item?.item || {}
                    if (!pkg || !func) {
                        return
                    }
                    if (!mockRef.current) {
                        mockRef.current = {} as MockData
                    }
                    if (!mockRef.current.Mapping) {
                        mockRef.current.Mapping = {}
                    }
                    mockRef.current.Mapping[pkg] = mockRef.current.Mapping[pkg] || {}
                    mockRef.current.Mapping[pkg][func] = data && data.mockMode !== "No Mock" ? {
                        ...data,
                        ...({
                            // ignore these fields
                            mockMode: undefined,
                            mockErr: undefined,
                            mockResp: undefined,
                        } as any),
                        Error: data.mockMode === "Mock Error" ? data.mockErr : "",
                        // TODO: handle JSON parse error here
                        // NOTE: why JSON.parse? because this is an inner data we have to do so
                        // when finally request the endpoint we can use string, but here, object only
                        Resp: data.mockMode === "Mock Error" ? "" : data.mockResp
                    } : undefined
                }}
                debugging={requesting}
                disableDebug={requesting}
                // debugging={true}
                // disableDebug={true}
                onClickDebug={requestHandler}
            />
        }
    />
}