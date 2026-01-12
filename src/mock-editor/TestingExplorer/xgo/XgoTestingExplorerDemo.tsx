import { StrictMode, useEffect, useState } from "react"
import { ItemPath, isSamePath } from "../../List"
import { StatusFilter } from "../TestingList/TestingListWithToolbar"
import { findDataPath, updateData, updateState } from "../TestingList/util"
import { TestingItem } from "../testing-api"
import { XgoTestingExplorer, XgoTestingExplorerProps } from "./XgoTestingExplorer"
import { filterData, setSelect, toggleExpand } from "./util"
import { UrlXgoTestingExplorer } from "./UrlXgoTestingExplorer"

export interface XgoTestingExplorerDemoProps extends XgoTestingExplorerProps {
}

// understanding react: every set will cause re-render
export function XgoTestingExplorerDemo(props: XgoTestingExplorerDemoProps) {
    const [data, setData] = useState(demoData)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.All)
    const [search, setSearch] = useState("")

    useEffect(() => {
        setData(data => filterData(data, statusFilter, search))
    }, [statusFilter, search])

    console.log("data:", data)

    return <XgoTestingExplorer {...props}
        style={{
            ...props.style,
            height: "80vh",
        }}
        data={data}
        copyText={e => e.name}
        statusFilter={statusFilter}
        onChangeStatusFilter={setStatusFilter}
        onSearch={search => {
            setSearch(search)
        }}
        onToggleExpand={depth => {
            setData(data => toggleExpand(data, depth))
        }}
        onClickExpand={(item, path, expand) => {
            setData(data => updateState(data, path.slice(1), e => e.expanded = expand))
        }}
        onClickItem={(item, path) => {
            setData(data => setSelect(data, path))
        }}
        onRefreshRoot={() => {
            console.log("refresh root:")
        }}
        runItemDetail={(item, itemPath) => {
            console.log("runItem:", item, itemPath)
            console.log("data:", data)
            console.log("itemPath:", itemPath)
            const runCase = (item: TestingItem, itemPath: ItemPath) => {
                setData(data => updateState(data, itemPath.slice(1), e => {
                    e.status = "running"
                    e.logs = `TEST ${item.name}\n`
                }))
                setTimeout(() => {
                    setData(data => updateState(data, itemPath.slice(1), e => {
                        if (isSamePath(itemPath, ["A", "B"])) {
                            e.status = "fail"
                            e.logs += "FAIL\n"
                            return
                        }
                        e.status = "success"
                        e.logs += "PASS\n"
                    }))
                }, 1000)
            }

            const runItem = (item: TestingItem, itemPath: ItemPath) => {
                if (item.kind === "case") {
                    runCase(item, itemPath)
                    return
                }
                // run all children
                if (item.children == null || item.children.length === 0) {
                    if (isSamePath(itemPath, ["A", "E"]) && !item.children?.length) {
                        setTimeout(() => {
                            setData(data => updateData(data, itemPath.slice(1), e => {
                                return { ...e, children: [{ key: "F", name: "F", kind: "case", state: {} }] }
                            }))
                        }, 500)
                    }

                    setData(data => updateState(data, itemPath.slice(1), e => {
                        e.status = "success"
                    }))
                    return
                }
                runCase(item, itemPath)
                for (let child of item.children) {
                    runItem(child, [...itemPath, child.key])
                }
            }
            runItem(item, itemPath)
        }}
    />
}

export function StrictUrlXgoTestingExplorerDemo(props: XgoTestingExplorerDemoProps) {
    return <StrictMode>
        <UrlXgoTestingExplorerDemo {...props} />
    </StrictMode>
}


export function UrlXgoTestingExplorerDemo(props: XgoTestingExplorerDemoProps) {
    return <UrlXgoTestingExplorer {...props}
        style={{
            ...props.style,
            height: "80vh",
        }}
        apiPrefix="http://localhost:7070"
    />
}

const demoData: TestingItem = {
    key: "A",
    name: "A",
    kind: "dir",
    state: {},
    children: [{
        key: "B",
        name: "B",
        kind: "case",
    },
    {
        key: "C",
        name: "C",
        kind: "dir",
        children: [{
            key: "D",
            name: "D",
            kind: "case",
            state: {},
        }]
    }, {
        key: "E",
        name: "E",
        kind: "dir",
    }]
}