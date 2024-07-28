import { useEffect, useState } from "react"
import { ItemPath } from "../../List"
import { StatusFilter } from "../TestingList/TestingListWithToolbar"
import { patchSubStree, updateState, updateSubTree } from "../TestingList/util"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { XgoTestingExplorer, XgoTestingExplorerProps } from "./XgoTestingExplorer"
import { Event, fetchContent, requestRunPoll, useUrlData } from "./http-data"
import { filterData, replaceDataMergingState, setSelect, toggleExpand } from "./util"
import { TraceItem } from "../TestingExplorerEditor/types"

export interface RunDetailResult {
    status: RunStatus
    msg: string
}

export interface UrlXgoTestingExplorerProps extends XgoTestingExplorerProps {
    apiPrefix?: string
}

export function UrlXgoTestingExplorer(props: UrlXgoTestingExplorerProps) {
    const apiPrefix = props.apiPrefix || ''

    // TODO: make list return single list
    const { data: serverData, refresh } = useUrlData(`${apiPrefix}/list`)

    const [data, setData] = useState(serverData)
    const [trace, setTrace] = useState(false)
    const [selectedTraceRecord, setSelectedTraceRecord] = useState<TraceItem>()

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
            runItem(item, path, apiPrefix, false, trace, setData)
        }}
        debugItemDetail={async (item, path) => {
            runItem(item, path, apiPrefix, true, trace, setData)
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
        trace={trace}
        onTraceChange={setTrace}
        selectedTraceRecord={selectedTraceRecord}
        setSelectedTraceRecord={setSelectedTraceRecord}
    />
}

function runItem(item: TestingItem, path: ItemPath, apiPrefix: string, debug: boolean, trace: boolean, setData: React.Dispatch<React.SetStateAction<TestingItem>>) {
    setData(data => {
        return updateState(data, path.slice(1), e => e.debugging = debug)
    })
    setData(data => {
        return updateSubTree(data, path.slice(1), e => ({
            ...e, state: {
                ...e.state,
                status: "running",
                logs: "",
            }
        }))
    })
    requestRunPoll(`${apiPrefix}/session/start`, `${apiPrefix}/session/pollStatus`, { item, path, debug, trace }, {
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
                } else if (e.event === Event.UpdateTrae) {
                    state.showTrace = true
                    state.traceRecords = e.traceRecords
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