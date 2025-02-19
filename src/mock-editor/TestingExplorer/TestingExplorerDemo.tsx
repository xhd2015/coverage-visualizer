import axios from "axios";
import { CSSProperties, useEffect, useState } from "react";
import { getRespStatus, MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { AddCaseRequest, addDir, buildTestingItemV2, DeleteCaseRequest, deleteDir, ListCaseResp, renameDir, TestingItem } from "./testing-api";
import { useTestingExplorerEditorController } from "./TestingExplorerEditor";
import { demoAPI as listDemoAPI } from "./TestingList/TestingListDemo";

import TestingExplorer from ".";
import { useCurrent } from "../react-hooks";
import { stringifyData } from "../util/format";
import { demoAPI } from "./TestingExplorerEditor/TestingExplorerEditorDemo";
import { patchResponse } from "./TestingExplorerEditor/util";
import { Options } from "./TestingList";
import { ExtensionData } from "./TestingExplorerEditor/TraceList/trace-types";

const listCaseURL = 'http://localhost:16000/api/case/listAll?noCaseList=true'
const updateSummaryURL = 'http://localhost:16000/api/summary/update'

export interface TestingExplorerDemoProps {
    style?: CSSProperties
    className?: string
    topElement?: any
}

export default function TestingExplorerDemo(props: TestingExplorerDemoProps) {
    const editorControllerRef = useTestingExplorerEditorController()
    const [testingItems, setTestingItems] = useState<TestingItem[]>()

    type ItemBundle = {
        item?: TestingItem,
        version?: number,
        clearResponse?: boolean // clear response before action
        action?: (caseData: TestingCase) => void
    }
    const [itemBundle, setItemBundle] = useState<ItemBundle>({ version: 0 } as ItemBundle)

    const refreshTreeList = async () => {
        const e = await axios({ url: listCaseURL, method: "GET" })
        const resp: ListCaseResp = e.data?.data
        const item = buildTestingItemV2(resp.root)
        setTestingItems(item ? [item] : [])
    }
    useEffect(() => {
        refreshTreeList()
    }, [])

    // const [curItem, setItem] = useState<TestingItem>()

    const [mockInfo, setMockInfo] = useState<MockInfo>()
    const [caseData, setCaseData] = useState<TestingCase>()

    const curItem = itemBundle?.item

    const caseDataRef = useCurrent(caseData)

    // get the case
    // ping localhost:16000 first
    const curItemRef = useCurrent(curItem)
    const reloadItem = async (curItem: TestingItem, action: (caseData: TestingCase) => void, clearResponse: boolean) => {
        // console.log("reload case:", curItem)
        let caseData: TestingCase
        if (curItem?.kind === "case") {
            caseData = await demoAPI.loadCase(curItem.method as string, curItem.path as string, curItem.id as number)
        }
        if (clearResponse) {
            editorControllerRef.current?.clearResponse?.()
        }
        setCaseData(caseData)
        action?.(caseData)
        return caseData
    }

    // refresh the data, without clear response
    const refreshItemData = () => {
        setItemBundle(v => ({ ...v, version: v.version + 1, clearResponse: false }))
    }


    useEffect(() => {
        // console.log("reload case onChange:", itemBundle?.item)
        reloadItem(itemBundle?.item, itemBundle?.action, itemBundle?.clearResponse)
    },
        // destruct basic data so change won't load twice
        [itemBundle?.item?.kind, itemBundle?.item?.method, itemBundle?.item?.path, itemBundle?.item?.id, itemBundle?.clearResponse, itemBundle.version]
    )

    useEffect(() => {
        demoAPI.loadMockInfo().then(setMockInfo)
    }, [])

    const [pendingAction, setPendingAction] = useState<() => Promise<void>>()

    return <div
        className={props.className}
        style={{
            "marginLeft": "auto",
            "marginRight": "auto",
            width: "90%",
            ...props.style,
        }}
    >
        {
            props.topElement
        }
        <TestingExplorer
            listProps={{
                data: testingItems,
                onTreeChangeRequested() {
                    refreshTreeList()
                    refreshItemData()
                },
                onRefreshRoot() {
                    refreshTreeList()
                    refreshItemData()
                },
                style: {
                    // width: "400px",
                    // minHeight: "600px",
                },
                checkBeforeSwitch(action) {
                    setPendingAction(() => action)
                },
                async onClickCaseRun(item, root, index, update) {
                    // console.log("reload case onClick:", item)
                    setItemBundle(v => ({
                        item,
                        clearResponse: true,
                        action: async (caseData: TestingCase) => {
                            // avoid loading items twice
                            const resp = await editorControllerRef.current?.request?.(caseData)
                            const status = getRespStatus(resp)
                            update(item => ({
                                ...item,
                                status: status,
                            }))
                        }
                    }))
                    // console.log("clickCaseRun:", item)
                },

                //     const [show, setShow] = useState(false)
                //     return <div >
                //         <Button onClick={() => setShow(true)}>click</Button>

                //         <ConfirmDialog title="shit" msg="shit" onDiscard={() => new Promise(resolve => setTimeout(resolve, 1 * 1000))}
                //             show={show}
                //             onShow={setShow}
                //         />
                //     </div>
                // }

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
                        let id = maxID(opts?.parent?.children)
                        // TODO: get max id
                        let data: AddCaseRequest = {
                            method: item.method || "",
                            id: id + 1,
                            dir: item.path as string,
                            name: `${item.name} Copy`,
                            data: { ...caseDataRef.current },
                        }
                        await axios({
                            url: "http://localhost:16000/api/case/add",
                            method: "POST",
                            data,
                        })
                    },
                    async delete(item, path) {
                        let data: DeleteCaseRequest = {
                            method: item.method as string,
                            dir: item.path as string,
                            id: item.id as number,
                        }
                        await axios({
                            url: "http://localhost:16000/api/case/delete",
                            method: "POST",
                            data,
                        })
                    },
                    async add(item, opts) {
                        let id = maxID(item?.children)
                        const newData: Partial<TestingCase> = await axios({ url: "http://localhost:16000/api/case/make", params: { method: item.method } }).then(e => e?.data?.data)
                        // TODO: get max id
                        let data: AddCaseRequest = {
                            method: item.method as string,
                            id: id + 1,
                            dir: item.path as string,
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
                        let actualCaseData: TestingCase
                        if (item.method === curItem?.method && item.id === curItem?.id && item.name === curItem?.name && caseData) {
                            actualCaseData = caseData
                        } else {
                            actualCaseData = await demoAPI.loadCase(item.method as string, item.path as string, item.id as number)
                        }
                        if (!actualCaseData) {
                            return "not_run"
                        }
                        if (actualCaseData.Skip) {
                            return "skip"
                        }
                        const resp = await demoAPI.requestTest({
                            method: item.method,
                            request: stringifyData(actualCaseData?.Request),
                            assertIsErr: !!actualCaseData?.AssertError,
                            assertError: actualCaseData?.AssertError,
                            asserts: stringifyData(actualCaseData?.Asserts),
                            mock: stringifyData(actualCaseData.Mock), // serialize so that resp have correct type instead of raw string
                        } as TestingRequestV2)
                        return getRespStatus(resp)
                    },
                    async addFolder(item, opts) {
                        await addDir(item.method as string, item.path as string, "TODO")
                    },
                    async delFolder(item, opts) {
                        await deleteDir(item.method as string, item.path as string, item.name)
                    },
                },
                onSelectChange(item, root, index) {
                    // console.log("onSelectChange:", item)
                    setItemBundle(v => ({ item, clearResponse: true }))
                    // setItem(item)
                },
            }}
            editorProps={{
                caseName: curItem?.name,
                mockInfo,
                caseData,
                pendingAction: pendingAction,
                controlRef: editorControllerRef,
                async save(caseName, caseData: TestingCase) {
                    if (curItemRef.current?.kind === "case") {
                        await demoAPI.saveCase(curItemRef?.current?.method as string, curItemRef?.current?.path as string, curItemRef.current?.id as number, caseName, caseData).finally(() => {
                            refreshTreeList()
                            refreshItemData()
                        })
                        return
                    } else {
                        await renameDir(curItemRef?.current?.method as string,
                            curItemRef?.current?.path as string,
                            curItemRef.current?.name as string,
                            caseName,
                        ).then(() => refreshTreeList())
                    }
                },
                async request(req: TestingRequestV2) {
                    if (!curItem?.method) {
                        return undefined
                    }
                    return await requestAndPatch({ ...req, method: curItem.method })
                },
            }}
        />
    </div>
}

export async function requestAndPatch(req: TestingRequestV2) {
    const data: TestingResponseV2<ExtensionData> = await demoAPI.requestTest(req).catch(e => {
        return { Error: e.message } as TestingResponseV2<ExtensionData>
    }) as TestingResponseV2<ExtensionData>
    return patchResponse(data)
}

function maxID(children?: TestingItem[]): number {
    let id = 0
    for (let child of (children || [])) {
        if ((child.id as number) > id) {
            id = child.id as number
        }
    }
    return id
}