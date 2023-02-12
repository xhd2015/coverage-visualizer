import { useEffect, useState, CSSProperties } from "react";
import TestingExplorer from "./TestingExplorer";
import { demoAPI } from "./TestingExplorerEditorDemo";
import { demoData, demoAPI as listDemoAPI } from "./TestingListDemo";
import axios from "axios"
import { traverse } from "./tree";
import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { AddCaseRequest, addDir, AddDirRequest, buildTestingItem, buildTestingItemV2, DeleteCaseRequest, deleteDir, ListCaseResp, renameDir, RenameDirRequest, TestingItem } from "./testing-api";
import { ExtensionData } from "./TestingExplorerEditor";
import { stringifyData } from "./util/format";
import { Options } from "./TestingList";
import { useCurrent } from "./react-hooks";

const listCaseURL = 'http://localhost:16000/api/case/listAll?noCaseList=true'
const updateSummaryURL = 'http://localhost:16000/api/summary/update'

export interface TestingExplorerDemoProps {
    style?: CSSProperties
    className?: string
    topElement?: any
}

export default function (props: TestingExplorerDemoProps) {
    const [testingItems, setTestingItems] = useState<TestingItem[]>()

    const refresh = () => {
        axios({ url: listCaseURL, method: "GET" }).then(e => {
            const resp: ListCaseResp = e.data?.data
            const item = buildTestingItemV2(resp.root)
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
                demoAPI.loadCase(curItem.method as string, curItem.path as string, curItem.id as number).then(setCaseData)
            }
        } else {
            // clear data
            setCaseData(undefined)
        }
    }, [curItem])
    const curItemRef = useCurrent(curItem)

    useEffect(() => {
        demoAPI.loadMockInfo().then(setMockInfo)
    }, [])

    const [pendingAction, setPendingAction] = useState<() => void>()

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
                    refresh()
                },
                style: {
                    // width: "400px",
                    // minHeight: "600px",
                },
                checkBeforeSwitch(action) {
                    setPendingAction(() => action)
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
                            data: { ...caseData },
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
                        let usedCaseData: TestingCase
                        if (item.method === curItem?.method && item.id === curItem?.id && item.name === curItem?.name && caseData) {
                            usedCaseData = caseData
                        } else {
                            usedCaseData = await demoAPI.loadCase(item.method as string, item.path as string, item.id as number)
                        }
                        if (!usedCaseData) {
                            return "not_run"
                        }
                        if (usedCaseData.Skip) {
                            return "skip"
                        }
                        const resp = await demoAPI.requestTest({
                            method: item.method,
                            request: stringifyData(usedCaseData?.Request),
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
                    async addFolder(item, opts) {
                        await addDir(item.method as string, item.path as string, "TODO")
                    },
                    async delFolder(item, opts) {
                        await deleteDir(item.method as string, item.path as string, item.name)
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
                pendingAction: pendingAction,
                async save(caseName, caseData: TestingCase) {
                    if (curItemRef.current?.kind === "case") {
                        await demoAPI.saveCase(curItemRef?.current?.method as string, curItemRef?.current?.path as string, curItemRef.current?.id as number, caseName, caseData).finally(() => {
                            refresh()
                        })
                        return
                    } else {
                        await renameDir(curItemRef?.current?.method as string,
                            curItemRef?.current?.path as string,
                            curItemRef.current?.name as string,
                            caseName,
                        ).then(() => refresh())
                    }
                },
                async request(req: TestingRequestV2) {
                    if (!curItem?.method) {
                        return undefined
                    }
                    const data: TestingResponseV2<ExtensionData> = await demoAPI.requestTest({ ...req, method: curItem.method }).catch(e => {
                        return { Error: e.message } as TestingResponseV2<ExtensionData>
                    }) as TestingResponseV2<ExtensionData>
                    return data
                },
            }}
        />
    </div>
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