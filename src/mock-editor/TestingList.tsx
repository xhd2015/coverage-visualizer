
import { createElement, CSSProperties, FunctionComponent, useEffect, useMemo, useRef, useState } from "react"
import { VscCollapseAll } from "react-icons/vsc"
import ExpandList, { ExpandItem, ItemController, useExpandListController } from "./ExpandList"
import { ItemIndex, ItemPath } from "./List"
import { useCurrent } from "./react-hooks"
import { filter, map, traverse } from "./tree"

import { AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineCloseCircle, AiOutlineExclamationCircle, AiOutlineMinusCircle, AiOutlinePlus } from "react-icons/ai"
import { BsCircle } from "react-icons/bs"
import { allStatus, RunStatus } from "./testing"

import { MdContentCopy } from "react-icons/md"
import { RiDeleteBin6Line } from "react-icons/ri"
import { VscPlay } from "react-icons/vsc"
import Checkbox from "./support/Checkbox"
import { throttle } from "./util/throttle"
import { TestingItem } from "./testing-api"

import "./TestingList.css"

type StateCounters = Record<RunStatus, number>

export interface Options {
    parent: TestingItem
    path: ItemPath
}
export interface TestingAPI {
    add: (item: TestingItem, opts: Options) => Promise<void>
    run: (item: TestingItem, opts: Options) => Promise<RunStatus>
    duplicate: (item: TestingItem, opts: Options) => Promise<void>
    delete: (item: TestingItem, opts: Options) => Promise<void>
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

    onAllRan?: (counters?: StateCounters) => void

    onTreeChangeRequested?: () => void

    checkBeforeSwitch?: (action: () => void) => void
}

export default function (props: TestingListProps) {
    // filters
    const [showFailOnly, setShowFailOnly] = useState(false)
    const [showSkipOnly, setShowSkipOnly] = useState(false)

    const getMockPropertyRef = useCurrent(props.getMockProperty)

    const apiRef = useCurrent(props.api)
    const runLimited = useMemo(() => throttle((item: TestingItem, e: Options) => apiRef.current?.run?.(item, e), props.runLimit), [props.runLimit])

    const runLimitedRef = useCurrent(runLimited)
    const expandListController = useExpandListController<TestingStatItem>()

    // id is stable
    const initItems = useMemo(() => {
        // let id = 1
        const items = map<TestingItem, TestingStatItem>(props.data, (e, children, idx, itemPath: string[]): TestingStatItem => {
            // merge with previous status
            return {
                record: e,
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
        traverse(items, (e) => {
        }, {
            after(e, ctx, parentCtx, idx, path) {
                if (e.record.kind === "case") {
                    const prev = expandListController.current?.getState?.(path)
                    // console.log("prev:", path, prev)
                    e.counters = prev?.counters || { "not_run": 1 }
                    return
                }
                [e.counters] = mergeChildrenCounters(e.children, child => child.counters)
            },
        })
        // console.log("items:", items)
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

            await runLimitedRef.current(item.record, { parent: controller.parent?.item?.record, path: controller.path }).then((finalStatus) => {
                controller.dispatchUpdate(item => ({ ...item, status: finalStatus, counters: { [finalStatus]: 1 } }))
            }).catch((e) => {
                controller.dispatchUpdate(item => ({ ...item, status: "error", counters: { "error": 1 } }))
            })
            notifyUpdate()
        } else {
            // reset all counters
            item.counters = {} as StateCounters
            if (!item.children?.length) {
                // nothing to run
                controller.dispatchUpdate(e => ({ ...e, status: "success", counters: item.counters }))
                notifyUpdate()
                return
            }
            controller.dispatchUpdate(e => ({ ...e, status: "running", counters: item.counters }))
            item.status = "running"

            // traverse all children, and make them run
            item.children?.forEach?.(child => {
                runItem(child, [...path, child.key], () => {
                    controller.dispatchUpdate(e => {
                        // range all children to get an up to date counters
                        const [newCounters, total] = mergeChildrenCounters(item.children, (chld) => expandListController.current.getState([...path, chld.key]).counters)
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
                    notifyUpdate()
                })
            })
        }
    }


    // console.log("final items:", items)
    return <div style={{
        // border: "1px solid black",
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
                // counters: item.record?.kind === "case" ? (prevItem?.counters || item?.counters) : {
                //     ...prevItem?.counters,
                //     ...item?.counters,
                // },
            })}
            controllerRef={expandListController}
            initialAllExpanded={true}
            toggleExpandRef={toggleExpandRef}
            render={(item, controller) => <ItemRender
                item={item}
                controller={controller}
                api={props.api}
                showMenu={selectedController?.id === controller.id || controller.path.length <= 1} // root or selected
                isRoot={controller.path.length <= 1}
                onTreeChangeRequested={props.onTreeChangeRequested}
                onClick={() => {
                    if (selectedController?.id === controller.id) {
                        return
                    }
                    const action = () => {
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
                    }
                    if (!props.checkBeforeSwitch) {
                        action()
                        return
                    }
                    props.checkBeforeSwitch(action)
                }}
                onClickRun={() => {
                    const isRoot = controller.path?.length <= 1
                    let needCall = isRoot
                    runItem(item, controller.path, () => {
                        // get the update-to-date item
                        const item = controller.item
                        if (!needCall) {
                            return
                        }
                        if (!isRoot) {
                            return
                        }
                        // debug
                        // if (item.key === "/_0") {
                        //     console.log("item update:", controller.item)
                        // }
                        // root
                        if (item.status === 'running' || item.status === 'not_run') {
                            return
                        }
                        needCall = false
                        props.onAllRan?.(item.counters as StateCounters)
                    })
                }}
            />}
        />
    </div>
}
function mergeChildrenCounters(children: TestingStatItem[], getChildCounters: (chld: TestingStatItem) => Partial<StateCounters>): [Partial<StateCounters>, number] {
    const newCounters: Partial<StateCounters> = {}
    let total = 0
    children?.forEach?.(chld => {
        const chldCnt = getChildCounters(chld)
        Object.keys(chldCnt || {}).forEach(k => {
            newCounters[k] = (newCounters[k] || 0) + chldCnt[k]
            total += newCounters[k]
        })
    })
    return [newCounters, total]
}

export function ItemRender(props: {
    item: TestingStatItem, controller: ItemController<TestingStatItem>,
    disableRun?: boolean
    onClick?: () => void,
    showMenu?: boolean,
    isRoot?: boolean,
    api?: TestingAPI,
    onClickRun?: () => void,
    onTreeChangeRequested?: () => void
}) {
    const { item, controller, api, onTreeChangeRequested } = props
    const isRoot = controller && controller.path.length <= 1

    const total = useMemo(() => getTotal(item.counters), [item.counters])

    const skipped = item.counters?.["skip"] || 0
    const success = item.counters?.["success"] || 0

    return <div
        className="testing-item"
        style={{
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
        <div className="testing-item-name">{item.record?.kind === "case" ? `[${item.record?.id}]: ${item.record?.name}` : item.record.name}</div>
        {item.record?.kind !== "case" && <RenderCounter
            status={item.status}
            key={item.record.name}
            counters={item.counters}
            style={{ marginLeft: "4px" }}
        />}



        {
            // always show, use hover to control
        }
        <div
            className="testing-item-menu"
            style={{
                marginLeft: "auto",
                display: props.isRoot ? "flex" : undefined,
                flexWrap: "nowrap", alignItems: 'center'
            }} >
            {
                isRoot && <small style={{ marginLeft: "auto", marginRight: "4px" }}>
                    {renderPercent(success, total - skipped)}/{renderPercent(success, total)}
                </small>
            }
            <VscPlay onClick={(e) => {
                e.stopPropagation()
                props.onClickRun?.()
            }} />

            {
                item.record?.kind === "testSite" && <AiOutlinePlus onClick={(e) => {
                    e.stopPropagation()
                    if (api?.add) {
                        Promise.resolve(api?.add?.(item.record, { path: controller?.path, parent: controller?.parent?.item?.record })).finally(() => {
                            onTreeChangeRequested?.()
                        })
                    }
                }} />
            }
            {
                item.record?.kind === "case" && <RiDeleteBin6Line onClick={(e) => {
                    e.stopPropagation()
                    if (api?.delete) {
                        Promise.resolve(api?.delete?.(item.record, { path: controller?.path, parent: controller?.parent?.item?.record })).finally(() => {
                            onTreeChangeRequested?.()
                        })
                    }
                }} />
            }
            {
                item.record?.kind === "case" && <MdContentCopy onClick={(e) => {
                    e.stopPropagation()
                    if (api?.duplicate) {
                        Promise.resolve(api?.duplicate?.(item.record, { path: controller?.path, parent: controller?.parent?.item?.record })).finally(() => {
                            onTreeChangeRequested?.()
                        })
                    }
                }} />
            }
        </div>


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

// const showStatus: RunStatus[] = ["success", "fail", "error", "skip", "running", "not_run"]
export interface RenderCounterProps {
    key?: string
    counters?: Partial<StateCounters>
    status?: RunStatus
    style?: CSSProperties
}
export function RenderCounter(props: RenderCounterProps) {
    const [total, success, errOrFail, runningOrSkip] = useMemo(() => {
        let success = props.counters?.["success"] || 0
        let errOrFail = (props.counters?.["error"] || 0) + (props.counters?.["fail"] || 0)
        let runningOrSkip = (props.counters?.["running"] || 0) + (props.counters?.["not_run"] || 0) + (props.counters?.["skip"] || 0)
        return [success + errOrFail + runningOrSkip, success, errOrFail, runningOrSkip]
    }, [props.counters])

    const renderNum = (n: number, activeColor: string, appendSuffix?: boolean) => {
        return <small style={{ color: n > 0 ? activeColor : "grey" }}>
            {n}{appendSuffix !== false ? '/' : ''}
        </small>
    }
    return <small style={props.style}>
        {
            renderNum(total, props?.status === "running" ? "blue" : "grey")
        }
        {
            renderNum(success, statusMapping["success"]?.color)
        }
        {
            renderNum(errOrFail, statusMapping["fail"]?.color)
        }
        {
            renderNum(runningOrSkip, statusMapping["not_run"]?.color, false)
        }
    </small>
}

function renderPercent(a, b) {
    return <small style={{ color: b > 0 && a >= b ? "green" : undefined }}>{formatPercent(a, b)}</small>
}

function getTotal(counters?: Partial<StateCounters>): number {
    let total = 0
    allStatus.forEach(status => {
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