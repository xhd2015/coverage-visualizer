import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { GridLayout } from "../../../support/components/layout/GridLayout"
import { useLoading } from "../../../support/hook/useLoading"
import { ItemPath } from "../../List"
import { Options, RunItem } from "../TestingList"
import { randList } from "../TestingList/TestingListDemo"
import { StatusFilter, TestingListWithToolbar } from "../TestingList/TestingListWithToolbar"
import { findDataAndPath, getDataByPath, patchSubStree, updateState, updateSubTree } from "../TestingList/util"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { XgoTestDetail } from "./XgoTestDetail"
import { Event, fetchContent, requestRunPoll, useUrlData } from "./http-data"
import { fillTestingItem, filterData, replaceDataMergingState, setSelect, toggleExpand } from "./util"

export interface RunDetailResult {
    status: RunStatus
    msg: string
}

export interface XgoTestingExplorerProps {
    style?: CSSProperties
    className?: string

    data?: TestingItem

    fetchContent?: (selectedItem: TestingItem) => Promise<string>

    statusFilter?: StatusFilter
    onChangeStatusFilter?: (filter: StatusFilter) => void
    onSearch?: (search: string) => void
    onToggleExpand?: (depth: number) => void

    onClickExpand?: (item: TestingItem, path: ItemPath, expand: boolean) => void
    onClickItem?: (item: TestingItem, path: ItemPath) => void
    runItemDetail?: (item: TestingItem, itemPath: ItemPath) => (Promise<void> | void)
    onRefreshRoot?: () => void

    debugItemDetail?: (item: TestingItem, itemPath: ItemPath) => (Promise<void> | void)

    openVscode?: (item: TestingItem) => void
    openGoland?: (item: TestingItem) => void
    copyText?: (item: TestingItem) => string
}

// design:
//   allow dynamically add test cases while running
// 
// data driven:
//   the explorer is completely data driven
//   every case has associated data, including:
//      status: not run, running, skip, fail, error
//      log
//      
export function XgoTestingExplorer(props: XgoTestingExplorerProps) {
    const data = props.data || ({ key: "/", name: "/" } as TestingItem)
    const [selectedItem, selectedItemPath] = useMemo(() => findDataAndPath(data, e => e.state?.selected), [data])

    const [content, setContent] = useState("")

    const refreshContent = async (selectedItem: TestingItem) => {
        if (props.fetchContent != null) {
            props.fetchContent(selectedItem).then(content => setContent(content))
        }
    }
    useEffect(() => {
        if (!selectedItem) {
            setContent("")
            return
        }
        if (selectedItem.kind === "case") {
            refreshContent(selectedItem)
        } else {
            setContent("")
        }
    }, [selectedItem])

    const clickVscode = async () => {
        await props.openVscode?.(selectedItem)
    }

    const clickGoland = async () => {
        await props.openGoland?.(selectedItem)
    }
    const clickRefresh = async () => {
        refreshContent(selectedItem)
    }

    return <GridLayout
        style={{
            border: "1px solid grey",
            overflow: "hidden",
            // why 100%?
            //    https://stackoverflow.com/questions/24956479/why-do-we-give-height-100-to-our-body-and-html
            height: "100%",
            ...props.style,
        }}
        className={props.className}
        initialSettings={{
            "testingList": {
                width: "300px",
                containerStyle: {
                    overflowX: "hidden",
                    overflowY: "auto",
                }
            }
        }}
        childrenMapping={{
            "testingList": <TestingListWithToolbar<TestingItem>
                data={data}
                statusFilter={props.statusFilter}
                onChangeStatusFilter={props.onChangeStatusFilter}
                onSearch={props.onSearch}
                onToggleExpand={props.onToggleExpand}
                buildListItem={fillTestingItem}
                onClickExpand={(item, path, expand) => {
                    const testItem = getDataByPath(data, path.slice(1))
                    props.onClickExpand?.(testItem, path, expand)
                }}
                onClickItem={(item, path) => {
                    const testItem = getDataByPath(data, path.slice(1))
                    props.onClickItem?.(testItem, path)
                }}
                onClickRun={(item, path) => {
                    const testItem = getDataByPath(data, path.slice(1))
                    props.runItemDetail?.(testItem, path)
                }}
                onRefreshRoot={props.onRefreshRoot}
            />,
            "testingDetail": <XgoTestDetail
                item={selectedItem}
                content={content}
                log={selectedItem?.state?.logs}
                onClickRun={() => {
                    props.runItemDetail?.(selectedItem, selectedItemPath)
                }}
                running={selectedItem != null && !selectedItem.state.debugging && selectedItem.state.status === "running"}
                onClickDebug={() => {
                    props.debugItemDetail?.(selectedItem, selectedItemPath)
                }}
                debugging={selectedItem != null && selectedItem.state.debugging && selectedItem.state.status === "running"}
                onClickVscode={clickVscode}
                onClickGoland={clickGoland}
                copyText={selectedItem && props.copyText && props.copyText(selectedItem)}
                onClickRefresh={clickRefresh}
            />
        }}
    />
}

export interface UrlXgoTestingExplorerProps extends XgoTestingExplorerProps {
    apiPrefix?: string
}

export function UrlXgoTestingExplorer(props: UrlXgoTestingExplorerProps) {
    const apiPrefix = props.apiPrefix || ''

    // TODO: make list return single list
    const { data: serverData, refresh } = useUrlData(`${apiPrefix}/list`)

    const [data, setData] = useState(serverData)
    useEffect(() => setData(prev => {
        replaceDataMergingState(prev, serverData)
        return serverData
    }), [serverData])

    const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.All)
    const [search, setSearch] = useState("")
    useEffect(() => {
        setData(data => filterData(data, statusFilter, search))
    }, [statusFilter, search])

    const open = async (item: TestingItem, url: string) => {
        const params = new URLSearchParams({ file: item.file, line: String(item.line) }).toString()
        await fetch(url + "?" + params)
    }
    return <XgoTestingExplorer {...props}
        data={data}
        onRefreshRoot={refresh}
        onClickItem={(item, path) => {
            setData(data => setSelect(data, path))
        }}
        statusFilter={statusFilter}
        onChangeStatusFilter={setStatusFilter}
        onSearch={search => {
            setSearch(search)
        }}
        onClickExpand={(item, path, expand) => {
            setData(data => updateState(data, path.slice(1), e => e.expanded = expand))
        }}
        onToggleExpand={depth => {
            setData(data => toggleExpand(data, depth))
        }}
        fetchContent={item => fetchContent(`${apiPrefix}/detail`, item)}
        runItemDetail={(item, path) => {
            runItem(item, path, apiPrefix, false, setData)
        }}
        debugItemDetail={async (item, path) => {
            runItem(item, path, apiPrefix, true, setData)
        }}

        openVscode={async item => {
            await open(item, `${apiPrefix}/openVscode`)
        }}
        openGoland={async item => {
            await open(item, `${apiPrefix}/openGoland`)
        }}
        copyText={item => {
            const path = item.relPath || item.file
            if (!path) {
                return
            }
            return `${path}${item.line > 0 ? `:${item.line}` : ""}`
        }}
    />
}

function runItem(item: TestingItem, path: ItemPath, apiPrefix: string, debug: boolean, setData: React.Dispatch<React.SetStateAction<TestingItem>>) {
    setData(data => {
        return updateState(data, path.slice(1), e => e.debugging = debug)
    })
    setData(data => {
        return updateSubTree(data, path.slice(1), e => ({ ...e, state: { ...e.state, status: "running", logs: "" } }))
    })
    requestRunPoll(`${apiPrefix}/session/start`, `${apiPrefix}/session/pollStatus`, { item, path, debug }, {
        onEvent(e) {
            if (!e.path?.length) {
                return
            }
            if (e.event === Event.MergeTree) {
                setData(data => patchSubStree(data, e.path.slice(1), e.item, (data, patch) => {
                    return { ...data, state: { ...data?.state, ...patch?.state } }
                }))
            }
            setData(data => updateState(data, e.path.slice(1), state => {
                if (e.event === Event.ItemStatus) {
                    if ((e.status as string) !== "") {
                        state.status = e.status
                    }
                }
                const msg = e.msg || ""
                if (msg) {
                    state.logs = (state.logs || "") + msg
                    if (!msg.endsWith("\n")) {
                        state.logs += "\n"
                    }
                }
            }, { optional: true }))
        },
        onEnd(err) {
            if (err != null) {
                setData(data => updateState(data, path.slice(1), e => {
                    e.status = "error"
                    if (err.message !== "") {
                        e.logs += err.message + "\n"
                    }
                }))
            }
            // transfer to finite status
            setData(data => {
                return updateSubTree(data, path.slice(1), e => ({ ...e, state: { ...e.state, status: toFiniteStatus(e.state?.status) } }))
            })
        }
    })
}

function toFiniteStatus(status: RunStatus): RunStatus {
    if (status !== "running") {
        return status
    }
    return "error"
}
export function useRandomRun(): RunItem {
    return async function (item: TestingItem, opts: Options): Promise<RunStatus> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(randList(["success", /* "fail", "error", "skip" */] as RunStatus[])), (1 + Math.random() * 3) * 1000)
        })
    }
}