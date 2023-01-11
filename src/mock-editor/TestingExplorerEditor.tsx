import { useEffect, useMemo, useRef, useState } from "react";
import MockEditor, { MockData as MockEditorData, TraceItem } from "./MockEditor";
import { buildRespJSONSchemaMapping, MockData, MockInfo, SchemaResult, serializeMockData, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { API } from "./testing-api";
import TestingEditor, { TestingCaseConfig, TestingCaseResult, TestingEditorControl } from "./TestingEditor";
import "./TestingEditor.css";
import { RootRecord } from "./trace-types";
import { stringifyData, stringifyDataIndent } from "./util/format";

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

export interface TestingExplorerProps {
    api: API
}

export default function (props: TestingExplorerProps) {

    const controllerRef = useRef<TestingEditorControl>()

    const [mockInfo, setMockInfo] = useState<MockInfo>()

    const [selItem, setSelItem] = useState<TraceItem>()

    const [data, setData] = useState<TestingCase>()
    const [respData, setRespData] = useState<TestingResponseV2<ExtensionData>>()
    const config: TestingCaseConfig = useMemo((): TestingCaseConfig => {
        if (!data && !respData) {
            return undefined
        }
        return {
            name: "loaded",
            request: stringifyDataIndent(data.Request),
            comment: data.Comment,
            skip: data.Skip,
            expectErr: !!data.AssertError,
            expectErrStr: data.AssertError,
            expectResponse: !data.AssertError && stringifyDataIndent(data.Asserts),
        }
    }, [data])

    const mockCur = useRef(data?.Mock)
    useEffect(() => {
        mockCur.current = data?.Mock
    }, [data?.Mock])

    const result: TestingCaseResult = useMemo((): TestingCaseResult => {
        if (!respData) {
            return undefined
        }

        return {
            response: stringifyDataIndent(respData?.Response),
            responseError: respData?.Error,
            status: respData?.Error ? "warning" : (respData?.AssertResult?.success ? "pass" : "fail"),
            msg: respData?.Error ? respData?.Error : (respData?.AssertResult?.success ? "" : respData?.AssertResult?.fails?.[0]?.str)
        }
    }, [respData])

    // get the case
    // ping localhost:16000 first
    useEffect(() => {
        props.api.loadCase().then(setData)
    }, [])

    useEffect(() => {
        props.api?.loadMockInfo().then(setMockInfo)
    }, [])

    const schemaMapping = useMemo(() => buildRespJSONSchemaMapping(mockInfo), [mockInfo])
    const respSchema = useMemo((): SchemaResult => {
        const { pkg, func } = selItem?.item || {}
        const respSchema = schemaMapping?.[pkg]?.[func]
        return respSchema
    }, [schemaMapping, selItem])

    const callRecord = respData?.Extension?.Data?.trace
    const callRecordMemo = useMemo(() => callRecord?.root ? [callRecord?.root] : [], [callRecord])

    return <TestingEditor
        config={config}
        result={result}

        controllerRef={controllerRef}
        onRequest={() => {
            if (controllerRef.current.requesting) {
                return
            }
            // clear previous result
            setRespData(undefined)
            controllerRef.current.setRequesting(true)
            const config = controllerRef.current.config
            props.api.requestTest<ExtensionData>({
                method: "manager_core_v2/QueryUserInstalmentInfo/all_in_one",
                request: config.request,
                assertIsErr: config.expectErr,
                assertError: config.expectErrStr,
                asserts: config.expectResponse,
                mock: stringifyData(serializeMockData(mockCur.current)), // serialize so that resp have correct type instead of raw string
            } as TestingRequestV2
            ).then((respData: TestingResponseV2<ExtensionData>) => {
                setRespData(respData)
            }).finally(() => {
                controllerRef.current.setRequesting(false)
            })
        }}
        header={
            <div className="flex-center">
                <div>
                    <span>Package:</span><span>A</span>
                </div>
                <div style={{ marginLeft: "4px" }}>
                    <span>Func:</span><span>B</span>
                </div>
            </div>
        }
        mockEditor={
            <MockEditor
                style={{ width: "100%" }}
                callRecords={callRecordMemo}
                onSelectChange={item => {
                    setSelItem(item)
                }}
                respSchema={respSchema}
                getMock={(item) => {
                    const mockItem = mockCur.current?.Mapping?.[item.item?.pkg]?.[item?.item?.func]
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
                    const mockItem = mockCur.current?.Mapping?.[e?.pkg]?.[e?.func]
                    return !!mockItem
                }}
                onMockChange={(item, data) => {
                    const { pkg, func } = item?.item || {}
                    if (!pkg || !func) {
                        return
                    }
                    if (!mockCur.current) {
                        mockCur.current = {} as MockData
                    }
                    if (!mockCur.current.Mapping) {
                        mockCur.current.Mapping = {}
                    }
                    mockCur.current.Mapping[pkg] = mockCur.current.Mapping[pkg] || {}
                    mockCur.current.Mapping[pkg][func] = data && data.mockMode !== "No Mock" ? {
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
            />
        }
    />
}