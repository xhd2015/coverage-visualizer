import { useEffect, useState } from "react";
import TestingExplorer from "./TestingExplorer";
import { demoAPI } from "./TestingExplorerEditorDemo";
import { demoData, demoAPI as listDemoAPI } from "./TestingListDemo";
import axios from "axios"
import { traverse } from "./tree";
import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { buildTestingItem, ListCaseResp, TestingItem } from "./testing-api";
import { ExtensionData } from "./TestingExplorerEditor";
import { stringifyData } from "./util/format";
import { Options } from "./TestingList";

const listCaseURL = 'http://localhost:16000/api/case/listAll'
const updateSummaryURL = 'http://localhost:16000/api/summary/update'

export default function () {
    const [testingItems, setTestingItems] = useState<TestingItem[]>()

    const refresh = () => {
        axios(listCaseURL).then(e => {
            const resp: ListCaseResp = e.data?.data
            const item = buildTestingItem(resp.method_case_list)
            setTestingItems(item ? [item] : [])
        })
    }
    useEffect(() => {
        refresh()
    }, [])

    const [curItem, setItem] = useState<TestingItem>()

    const [mockInfo, setMockInfo] = useState<MockInfo>()
    const [caseData, setCaseData] = useState<TestingCase>()
    // get the case
    // ping localhost:16000 first

    useEffect(() => {
        if (curItem?.kind === "case") {
            if (!curItem) {
                setCaseData(undefined)
            } else {
                demoAPI.loadCase(curItem.method, curItem.id).then(setCaseData)
            }
        }
    }, [curItem])

    useEffect(() => {
        demoAPI.loadMockInfo().then(setMockInfo)
    }, [])

    return <TestingExplorer
        style={{
            "marginLeft": "auto",
            "marginRight": "auto",
        }}
        listProps={{
            data: testingItems,
            onTreeChangeRequested() {
                refresh()
            },
            style: {
                // width: "400px",
                // minHeight: "600px",
            },
            async onAllRan(counters) {
                let total = 0
                let fail = 0
                let pass = 0
                let skip = 0

                Object.keys(counters || {}).forEach(k => {
                    let val = counters[k] || 0
                    total += val
                    if (k === "fail" || k === "error") {
                        fail += val
                    } else if (k === "success") {
                        pass += val
                    } else {
                        skip += val
                    }
                })
                interface RunStat {
                    total: number
                    pass: number
                    fail: number
                    skip: number
                }
                const runStat: RunStat = { total, fail, pass, skip }
                await axios({ url: updateSummaryURL, method: "POST", data: { runStat } })
            },
            runLimit: 10,
            api: {
                ...listDemoAPI,
                async duplicate(item, opts: Options) {
                    interface AddCaseRequest {
                        method: string
                        id: number
                        name: string
                        data: Partial<TestingCase>
                    }
                    let id = 0
                    if (opts?.parent?.children?.length) {
                        for (let child of opts?.parent?.children) {
                            if (child.id > id) {
                                id = child.id
                            }
                        }
                    }
                    // TODO: get max id
                    let data: AddCaseRequest = {
                        method: item.method,
                        id: id + 1,
                        name: `${item.name} Copy`,
                        data: { ...caseData },
                    }
                    await axios({
                        url: "http://localhost:16000/api/case/add",
                        method: "POST",
                        data,
                    })
                },
                async delete(item, path) {
                    interface DeleteCaseRequest {
                        method: string
                        id: number
                    }
                    let data: DeleteCaseRequest = {
                        method: item.method,
                        id: item.id,
                    }
                    await axios({
                        url: "http://localhost:16000/api/case/delete",
                        method: "POST",
                        data,
                    })
                },
                async add(item, opts) {
                    let id = 0
                    if (item?.children?.length) {
                        for (let child of item?.children) {
                            if (child.id > id) {
                                id = child.id
                            }
                        }
                    }
                    const newData: Partial<TestingCase> = await axios({ url: "http://localhost:16000/api/case/make", params: { method: item.method } }).then(e => e?.data?.data)
                    interface AddCaseRequest {
                        method: string
                        id: number
                        name: string
                        data: Partial<TestingCase>
                    }
                    // TODO: get max id
                    let data: AddCaseRequest = {
                        method: item.method,
                        id: id + 1,
                        name: "TODO",
                        data: newData
                    }
                    await axios({
                        url: "http://localhost:16000/api/case/add",
                        method: "POST",
                        data,
                    })
                },
                async run(item, path) {
                    let usedCaseData: TestingCase
                    if (item.method === curItem?.method && item.id === curItem?.id && item.name === curItem?.name && caseData) {
                        usedCaseData = caseData
                    } else {
                        usedCaseData = await demoAPI.loadCase(item.method, item.id)
                    }
                    if (!usedCaseData) {
                        return "not_run"
                    }
                    if (usedCaseData.Skip) {
                        return "skip"
                    }
                    const resp = await demoAPI.requestTest({
                        method: item.method,
                        request: stringifyData(usedCaseData.Request),
                        assertIsErr: !!usedCaseData?.AssertError,
                        assertError: usedCaseData?.AssertError,
                        asserts: stringifyData(usedCaseData?.Asserts),
                        mock: stringifyData(usedCaseData.Mock), // serialize so that resp have correct type instead of raw string
                    } as TestingRequestV2)
                    if (resp.AssertResult?.success) {
                        return "success"
                    }
                    if (!resp.AssertResult) {
                        return "error"
                    }
                    return "fail"
                },
            },
            onSelectChange(item, root, index) {
                setItem(item)
            },
        }}
        editorProps={{
            caseName: curItem?.name,
            mockInfo,
            caseData,
            async save(caseName, caseData: TestingCase) {
                await demoAPI.saveCase(curItem.method, curItem.id, caseName, caseData)
            },
            async request(req: TestingRequestV2) {
                if (!curItem?.method) {
                    return undefined
                }
                return demoAPI.requestTest({ ...req, method: curItem.method }).catch(e => {
                    return { Error: e.message } as TestingResponseV2<ExtensionData>
                })
            },
        }}
    />
}