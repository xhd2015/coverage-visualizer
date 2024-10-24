import { CSSProperties, useEffect, useMemo, useState, Dispatch, SetStateAction } from "react"
import { GridLayout } from "../../../support/components/layout/GridLayout"
import { TraceExplorerProps } from "../../../trace/TraceExplorer"
import { ItemPath } from "../../List"
import { Options, RunItem } from "../TestingList"
import { randList } from "../TestingList/TestingListDemo"
import { StatusFilter, TestingListWithToolbar } from "../TestingList/TestingListWithToolbar"
import { findDataAndPath, getDataByPath } from "../TestingList/util"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { XgoTestDetail } from "./XgoTestDetail"
import { fillTestingItem } from "./util"
import { TraceItem } from "../TestingExplorerEditor/types"
import { CoverageLineProps } from "./Coverage"

export interface RunDetailResult {
    status: RunStatus
    msg: string
}

export interface XgoTestingExplorerProps {
    style?: CSSProperties
    className?: string

    data?: TestingItem

    trace?: boolean
    onTraceChange?: Dispatch<SetStateAction<boolean>>

    selectedTraceRecord?: TraceItem
    setSelectedTraceRecord?: (value: SetStateAction<TraceItem>) => void

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

    coverage?: CoverageLineProps
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

    // console.log("selectedItem:", selectedItem?.relPath, selectedItem?.state?.showTrace)

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
                trace={props.trace}
                onTraceChange={props.onTraceChange}
                showTrace={selectedItem?.state?.showTrace}
                shownTraceProps={{
                    selectedRecord: props.selectedTraceRecord,
                    setSelectedRecord: props.setSelectedTraceRecord,
                    records: selectedItem?.state?.traceRecords,
                    disableMockCheckbox: true,
                }}
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
                coverage={props.coverage}
            />
        }}
    />
}

export function useRandomRun(): RunItem {
    return async function (item: TestingItem, opts: Options): Promise<RunStatus> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(randList(["success", /* "fail", "error", "skip" */] as RunStatus[])), (1 + Math.random() * 3) * 1000)
        })
    }
}