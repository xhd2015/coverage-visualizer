import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { Options, RunItem, Session, SessionRunner, TestingAPI, TestingList, UpdateCallback } from "../TestingList"
import { TestingItem } from "../testing-api"
import { GridLayout } from "../../../support/components/layout/GridLayout"
import { XgoTestDetail } from "./XgoTestDetail"
import { randList } from "../TestingList/TestingListDemo"
import { RunStatus } from "../testing"
import { fetchContent, newSessionRunner, requestRun, useUrlData, useUrlRun } from "./http-data"

export interface RunDetailResult {
    status: RunStatus
    msg: string
}
export interface XgoTestingExplorerProps {
    style?: CSSProperties
    className?: string

    runLimit?: number

    data?: TestingItem[]
    onRefreshRoot?: () => void

    fetchContent?: (selectedItem: TestingItem) => Promise<string>
    runItem?: RunItem
    runner?: SessionRunner

    runItemDetail?: (item: TestingItem) => Promise<RunDetailResult>

    openVscode?: (item: TestingItem) => void
}

// design:
//   allow dynamically add test cases while running
export function XgoTestingExplorer(props: XgoTestingExplorerProps) {
    const [selectedItem, setSelectedItem] = useState<TestingItem>()
    const logMapping = useRef<Record<string, string>>({})

    const [content, setContent] = useState("")
    const [log, setLog] = useState("")

    const refreshContent = async (selectedItem: TestingItem) => {
        if (props.fetchContent != null) {
            props.fetchContent(selectedItem).then(content => setContent(content))
        }
    }
    useEffect(() => {
        if (!selectedItem) {
            setContent("")
            setLog("")
            return
        }
        if (selectedItem.kind === "case") {
            const log = logMapping.current[`${selectedItem.file}:${selectedItem.name}`]
            setLog(log)

            refreshContent(selectedItem)
        } else {
            setLog("")
            setContent("")
        }
    }, [selectedItem])

    const [detailRunning, setDetailRunning] = useState(false)
    const clickRunDetail = async () => {
        setDetailRunning(true)
        try {
            const response = await props.runItemDetail?.(selectedItem)
            logMapping.current[`${selectedItem.file}:${selectedItem.name}`] = response.msg
            setLog(response.msg)
        } finally {
            setDetailRunning(false)
        }
    }
    const clickVscode = async () => {
        props.openVscode?.(selectedItem)
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
            "testingList": <TestingList
                data={props.data}
                showEditActions={false}
                runLimit={props.runLimit}
                api={{
                    ...({} as TestingAPI),
                    run: props.runItem,
                }}
                onRefreshRoot={props.onRefreshRoot}
                onSelectChange={item => setSelectedItem(item)}
                runner={props.runner}
            />,
            "testingDetail": <XgoTestDetail
                item={selectedItem}
                content={content}
                log={log}
                onClickRun={clickRunDetail}
                running={detailRunning}
                onClickVscode={clickVscode}
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
    const { data, refresh } = useUrlData(`${apiPrefix}/list`)
    const run = useUrlRun(`${apiPrefix}/run`)

    const runner = useMemo(() => newSessionRunner(`${apiPrefix}/session/start`, `${apiPrefix}/session/pollStatus`), [])

    return <XgoTestingExplorer {...props}
        data={data}
        onRefreshRoot={refresh}
        runItem={run}
        runner={runner}
        fetchContent={item => fetchContent(`${apiPrefix}/detail`, item)}
        runItemDetail={item => requestRun(`${apiPrefix}/run`, item, { verbose: true })}
        openVscode={item => {
            const params = new URLSearchParams({ file: item.file, line: String(item.line) }).toString()
            fetch(`${apiPrefix}/openVscode?` + params)
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