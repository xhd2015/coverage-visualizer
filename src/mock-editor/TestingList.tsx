
import { createElement, CSSProperties, FunctionComponent, useEffect, useMemo, useRef, useState } from "react"
import { VscCollapseAll } from "react-icons/vsc"
import ExpandList, { ExpandItem, ItemController, useExpandListController } from "./ExpandList"
import { ItemIndex, ItemPath } from "./List"
import { useCurrent } from "./react-hooks"
import { filter, map } from "./tree"

import { AiOutlineExclamationCircle, AiOutlineCloseCircle, AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineMinusCircle, AiOutlinePlus } from "react-icons/ai"
import { BsCircle } from "react-icons/bs"
import { RunStatus } from "./testing"
import { Dropdown } from "./support/Dropdown"

import { VscPlay } from "react-icons/vsc"
import { RiDeleteBin6Line } from "react-icons/ri"
import { MdContentCopy } from "react-icons/md"
import { throttle } from "./util/throttle"
import Checkbox from "./support/Checkbox"


export type TestingItemType = "dir" | "testSite" | "case"

export interface TestingItem {
    name: string
    kind: TestingItemType
    children?: TestingItem[]
}

const errorColor = "#DA2829"  // red
const panicColor = "#ffb500"  // orange-like
const defaultColor = "#19B7BE" // jaeger sea-blue
const greyColor = "#97918B"
const mockOkColor = "#6cc600" // green
const mockMissingColor = "#000000" // black

type StateCounters = Record<RunStatus, number>

export interface TestingAPI {
    add: (path: ItemPath) => Promise<void>
    run: (path: ItemPath) => Promise<RunStatus>
    duplicate: (path: ItemPath) => Promise<void>
    delete: (path: ItemPath) => Promise<void>
}

interface TestingStatItem extends ExpandItem {
    record?: TestingItem

    status?: RunStatus

    counters: Partial<StateCounters>

    contentStyle?: CSSProperties
    children?: TestingStatItem[]
}

export interface TestingListProps {
    data?: TestingItem[]
    className?: string

    api?: TestingAPI
    runLimit?: number // concurrent number to call run

    // style for the root container
    style?: CSSProperties
    getMockProperty?: (e: TestingItem) => { needMock?: boolean, mocked?: boolean },
    onSelectChange?: (item: TestingItem, root: TestingItem, index: ItemIndex) => void
}

export default function (props: TestingListProps) {
    // filters
    const [showFailOnly, setShowFailOnly] = useState(false)
    const [showSkipOnly, setShowSkipOnly] = useState(false)

    const getMockPropertyRef = useCurrent(props.getMockProperty)

    const apiRef = useCurrent(props.api)
    const runLimited = useMemo(() => throttle((e: ItemPath) => apiRef.current?.run?.(e), props.runLimit), [props.runLimit])

    const runLimitedRef = useCurrent(runLimited)
    const expandListController = useExpandListController<TestingStatItem>()

    // id is stable
    const initItems = useMemo(() => {
        // let id = 1
        const items = map<TestingItem, TestingStatItem>(props.data, (e, children, idx, itemPath: string[]): TestingStatItem => {
            // merge with previous status
            return {
                record: e as TestingItem,
                children,
                leaf: !e.children?.length,
                counters: {} as StateCounters,
                key: `${e.name}_${idx}`,
                ...getMockPropertyRef?.current?.(e),
                itemStyle: {
                    userSelect: "text"
                }
            }
        })
        return items
    }, [props.data])

    const [items, setItems] = useState(initItems)
    const initItemsRef = useCurrent(initItems)

    const toggleExpandRef = useRef<() => void>()

    useEffect(() => {
        if (!showFailOnly && !showSkipOnly) {
            setItems(initItemsRef.current)
            return
        }
        let filterItems = filter<TestingStatItem, TestingStatItem>(initItemsRef.current, (e, path) => {
            const state = expandListController.current?.getState?.(path)
            if (showFailOnly && state && (state.status === "error" || state.status === "fail")) {
                return true
            }
            if (showSkipOnly && state && (state.status === "skip")) {
                return true
            }
            // if (showErrOnly && (e.record?.error || e.record?.panic)) {
            //     return true
            // }
            // if (showMockOnly && e.needMock) {
            //     return true
            // }
            return false
        })

        // // update leaf based on children
        // filter<TestingStatItem, TestingStatItem>(filterItems, e => {
        //     e.leaf = !e.children?.length
        //     // e.key = e.key + `_${versionRef.current}`
        //     return true
        // })
        setItems(filterItems)
    }, [initItems, showFailOnly, showSkipOnly])

    // console.log("trace items after filtered:", versionRef.current, items)

    interface ItemControllerExt extends ItemController<TestingStatItem> {
        clear?: () => void
    }
    const [selectedController, setSelectedController] = useState<ItemControllerExt>()

    // clear selected if it disappear
    useEffect(() => {
        if (!selectedController) {
            return
        }
        let itemList: TestingStatItem[] = items
        for (const i of selectedController.index) {
            if (!(itemList.length > i)) {
                setSelectedController(undefined)
                return
            }
            itemList = itemList[i].children
        }
    }, [items])

    const runItem = async (item: TestingStatItem, path: ItemPath, notifyUpdate: () => void) => {
        if (item.status === "running") {
            // disable when already running
            return// running by other, so here skip
        }
        // run will contribute to current counter status
        if (!props.api?.run) {
            return
        }
        // update status to running
        const controller = expandListController.current?.getController?.(path)
        if (!controller) {
            return
        }

        if (item.record?.kind === "case") {
            controller.dispatchUpdate(item => ({ ...item, status: "running", counters: { running: 1 } }))
            notifyUpdate()
            await runLimitedRef.current(controller.path).then((finalStatus) => {
                controller.dispatchUpdate(item => ({ ...item, status: finalStatus, counters: { [finalStatus]: 1 } }))
            }).catch((e) => {
                controller.dispatchUpdate(item => ({ ...item, status: "error", counters: { "error": 1 } }))
            })
            notifyUpdate()
        } else {
            // reset all counters
            item.counters = {} as StateCounters
            item.status = "not_run"
            if (!item.children?.length) {
                // nothing to run
                controller.dispatchUpdate(e => ({ ...e, ...item }))
                return {}
            }
            controller.dispatchUpdate(e => ({ ...e, status: "running", counters: item.counters }))
            item.status = "running"

            // traverse all children, and make them run
            item.children?.forEach?.(child => {
                runItem(child, [...path, child.key], () => {
                    controller.dispatchUpdate(e => {
                        // range all children to get an up to date counters
                        const newCounters: Partial<StateCounters> = {}
                        let total = 0
                        item.children?.forEach?.(chld => {
                            const chldCnt = expandListController.current.getState([...path, chld.key]).counters
                            Object.keys(chldCnt).forEach(k => {
                                newCounters[k] = (newCounters[k] || 0) + chldCnt[k]
                                total += newCounters[k]
                            })
                        })

                        let itemStatus: RunStatus = "success"
                        if (newCounters["running"]) {
                            itemStatus = "running"
                        } else if (newCounters["error"]) {
                            itemStatus = "error"
                        } else if (newCounters["fail"]) {
                            itemStatus = "fail"
                        } else if (newCounters["skip"] === total) {
                            itemStatus = "skip"
                        }

                        return {
                            ...e,
                            status: itemStatus,
                            counters: newCounters,
                        }
                    })

                    notifyUpdate()
                }).catch((e) => {
                    console.error("update error:", e)
                })
            })
        }
    }

    return <div style={{
        border: "1px solid black",
        padding: "2px",
        overflowX: "auto",
        overflowY: "auto",
        ...props.style,
    }}
        className={props.className}
    >
        <div className="list-bar" style={{ display: "flex", alignItems: "center" }}>
            <VscCollapseAll onClick={() => {
                toggleExpandRef.current?.()
            }} />
            <Checkbox label="Fail" value={showFailOnly} onChange={setShowFailOnly} style={{ marginLeft: "4px" }} />
            <Checkbox label="Skip" value={showSkipOnly} onChange={setShowSkipOnly} style={{ marginLeft: "4px" }} />
        </div>
        <ExpandList<TestingStatItem>
            items={items}
            mergeStatus={(item, prevItem) => ({
                ...prevItem,
                ...item,
                status: prevItem?.status ?? "not_run",
                counters: {
                    ...prevItem?.counters,
                    ...item?.counters,
                },
            })}
            controllerRef={expandListController}
            initialAllExpanded={true}
            toggleExpandRef={toggleExpandRef}
            render={(item, controller) => <ItemRender
                item={item}
                controller={controller}
                showMenu={selectedController?.id === controller.id || controller.path.length <= 1} // root or selected
                onClick={() => {
                    if (selectedController?.id === controller.id) {
                        return
                    }
                    // clear prev
                    if (selectedController) {
                        selectedController.clear?.()
                        selectedController.dispatchUpdate(item => ({ ...item, expandContainerStyle: { backgroundColor: undefined } }))
                    }

                    const clear = controller.subscribeUpdate((item) => {
                        props.onSelectChange?.(item.record, controller.root?.record, controller.index)
                    })

                    setSelectedController({ ...controller, clear })
                    controller?.dispatchUpdate?.(item => ({ ...item, expandContainerStyle: { backgroundColor: "#eeeeee" } }))

                    props.onSelectChange?.(item.record, controller.root?.record, controller.index)
                }}
                onClickRun={() => {
                    runItem(item, controller.path, () => { })
                }}
            />}
        />
    </div>
}

export function ItemRender(props: {
    item: TestingStatItem, controller: ItemController<TestingStatItem>,
    disableRun?: boolean
    onClick?: () => void,
    showMenu?: boolean,
    api?: TestingAPI,
    onClickRun?: () => void,
}) {
    const { item, controller, api } = props
    const isRoot = controller && controller.path.length <= 1

    const total = useMemo(() => getTotal(item.counters), [item.counters])

    const skipped = item.counters?.["skip"] || 0
    const success = item.counters?.["success"] || 0

    return <div style={{
        display: "flex",
        cursor: "pointer",
        alignItems: "center",
        flexGrow: "1",
        // flexWrap: "wrap", // don't wrap, let it x-scroll
        ...item.contentStyle,
    }}
        onClick={props.onClick}
    >
        <RenderStatus status={item?.status} style={{}} />
        <div style={{ whiteSpace: "nowrap", marginLeft: "2px" }}>{item.record.name}</div>
        {item.record?.kind !== "case" && <RenderCounter counters={item.counters}
            style={{ marginLeft: "4px" }}
        />}

        {props.showMenu &&
            // <Dropdown style={{ marginLeft: "auto" }} >
            //     <div style={{ backgroundColor: "#f2f2f2", padding: "4px", borderRadius: "4px" }}>
            //         <BsPlay />
            //     </div>
            // </Dropdown>

            <div style={{ marginLeft: "auto", display: "flex", flexWrap: "nowrap", alignItems: 'center' }} >
                {
                    isRoot && <small style={{ marginLeft: "auto", marginRight: "4px" }}>
                        {renderPercent(success, total - skipped)}/{renderPercent(success, total)}
                    </small>
                }
                <VscPlay onClick={props.onClickRun} />

                {
                    item.record?.kind === "testSite" && <AiOutlinePlus onClick={() => {
                        api?.add?.(controller?.path)
                    }} />
                }
                {
                    item.record?.kind === "case" && <RiDeleteBin6Line onClick={() => {
                        props.api?.delete?.(controller?.path)
                    }} />
                }
                {
                    item.record?.kind === "case" && <MdContentCopy onClick={() => {
                        props.api?.duplicate?.(controller?.path)
                    }} />
                }
            </div>
        }

        {/* <div style={{ whiteSpace: "nowrap", color: greyColor, marginLeft: "5px" }}>{item.name}</div> */}
        {/* {
            item.record.panic ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >panic</Tag> :
                (item.record.error ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >error</Tag> : undefined)
        } */}
        {/* <div style={{ whiteSpace: "nowrap", color: greyColor, marginLeft: "5px" }}>{0}</div> */}
    </div>
}

export interface RenderStatusProps {
    style?: CSSProperties
    status?: RunStatus
}

export function RenderStatus(props: RenderStatusProps) {
    const statusInfo = statusMapping[props.status] || statusMapping["not_run"]
    return createElement(statusInfo.icon, { style: { color: statusInfo?.color, ...props.style } })
}

const statusMapping: Record<RunStatus, { color: string, icon: FunctionComponent<{ style?: CSSProperties }> /*react function */ }> = {
    not_run: {
        color: "grey",
        icon: BsCircle,
    },
    skip: {
        color: "grey",
        icon: AiOutlineMinusCircle,
        // icon: "mdi-information-outline",
    },
    running: {
        color: "blue",
        icon: AiOutlineClockCircle,
        // icon: "mdi-progress-clock",
    },
    success: {
        color: "green",
        icon: AiOutlineCheckCircle,
    },
    error: {
        color: "orange",
        // icon: "mdi-alert-circle-outline",
        icon: AiOutlineExclamationCircle,
    },
    fail: {
        color: "red",
        icon: AiOutlineCloseCircle,
    },
}

const showStatus: RunStatus[] = ["success", "fail", "error", "skip", "running"]
export interface RenderCounterProps {
    counters?: Partial<StateCounters>
    style?: CSSProperties
}
export function RenderCounter(props: RenderCounterProps) {
    const total = useMemo(() => getTotal(props.counters), [props.counters])

    return <small style={props.style}>
        <small style={{ color: total > 0 ? "blue" : "grey" }}>
            {total}/
        </small>
        {
            showStatus.map((status, idx) => <small style={{ color: props.counters?.[status] > 0 ? statusMapping[status].color : "grey" }}>
                {`${idx > 0 ? '/' : ''}${props.counters?.[status] || 0}`}
            </small>)
        }
    </small>
}

function renderPercent(a, b) {
    return <small style={{ color: b > 0 && a >= b ? "green" : undefined }}>{formatPercent(a, b)}</small>
}

function getTotal(counters?: Partial<StateCounters>): number {
    let total = 0
    showStatus.forEach(status => {
        total += counters?.[status] || 0
    })
    return total
}

export function formatPercent(a: number, b: number): string {
    if (b === 0) {
        return "-"
    }
    const v = a / b
    if (isNaN(v)) {
        return "-"
    }
    return Math.floor(v * 100) + "%"
}