
import { createElement, CSSProperties, FunctionComponent, ReactElement, useEffect, useMemo, useRef, useState } from "react"
import { AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineCloseCircle, AiOutlineExclamationCircle, AiOutlineMinusCircle, AiOutlinePlus } from "react-icons/ai"
import { BsCircle } from "react-icons/bs"
import { VscNewFolder, VscRefresh } from "react-icons/vsc"

import { MdContentCopy } from "react-icons/md"
import { RiDeleteBin6Line } from "react-icons/ri"
import { VscPlay } from "react-icons/vsc"

import ExpandList, { BG_SELECTED, ExpandItem, ExpandListController, ExpandListItemRenderV2, ItemController, useExpandListController, useSelect } from "../../ExpandList"
import { ItemIndex, ItemPath, List } from "../../List"
import { useCurrent, useUpdatedEffect } from "../../react-hooks"
import Checkbox from "../../support/Checkbox"
import ToolBar from "../../support/ToolBar"
import { filter, map, traverse } from "../../tree"
import { throttle } from "../../util/throttle"
import { allStatus, RunStatus } from "../testing"
import { TestingItem, TestingItemType } from "../testing-api"
import "./TestingList.css"

export type StateCounters = Record<RunStatus, number>

export interface Options {
    parent: TestingItem
    path: ItemPath
}

export type RunItem = (item: TestingItem, opts: Options) => Promise<RunStatus>
export interface TestingAPI {
    add: (item: TestingItem, opts: Options) => Promise<void>
    addFolder: (item: TestingItem, opts: Options) => Promise<void>
    delFolder: (item: TestingItem, opts: Options) => Promise<void>
    run: RunItem
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

export interface MockProperty {
    needMock?: boolean
    mocked?: boolean
}
export type MockPropertyGetter = (e: TestingItem) => MockProperty

export interface TestingListBaseProps {
    className?: string

    // default show
    showEditActions?: boolean

    // style for the root container
    style?: CSSProperties
    getMockProperty?: MockPropertyGetter
    onSelectChange?: (item: TestingItem, root: TestingItem, index: ItemIndex) => void

    // called when root is ran
    onAllRan?: (counters?: StateCounters) => void

    onTreeChangeRequested?: () => void
    onRefreshRoot?: () => void

    checkBeforeSwitch?: (action: () => Promise<void>) => void
}

export interface TestingListProps extends TestingListBaseProps {
    data?: TestingItem[]
    api?: TestingAPI


    runner?: SessionRunner

    // concurrent number to call run
    // default: 10
    runLimit?: number

    onClickCaseRun?: (item: TestingItem, root: TestingItem, index: ItemIndex, update: (fn: (item: TestingStatItem) => TestingStatItem) => void) => void
}


export interface SessionRunner {
    start: (item: TestingItem, path: ItemPath) => Promise<Session>
}

export type UpdateCallback = (status: RunStatus) => void
export interface Session {
    subscribeUpdate: (item: TestingItem, callback: UpdateCallback) => void
}

export function TestingList(props: TestingListProps) {
    // filters
    const [showFailOnly, setShowFailOnly] = useState(false)
    const [showSkipOnly, setShowSkipOnly] = useState(false)

    const getMockPropertyRef = useCurrent(props.getMockProperty)

    const apiRef = useCurrent(props.api)
    // const runLimit = props.runLimit > 0 ? props.runLimit : 10
    const runLimited = useMemo(() => throttle((item: TestingItem, e: Options) => apiRef.current?.run?.(item, e), props.runLimit), [props.runLimit])

    const runLimitedRef = useCurrent(runLimited)
    const expandListController = useExpandListController<TestingStatItem>()

    // id is stable
    const items = useMemo(() => buildAndFilterItems(props.data, expandListController.current, getMockPropertyRef.current, showFailOnly, showSkipOnly, (path) => expandListController.current?.getState?.(path)), [props.data, showFailOnly, showSkipOnly])

    const toggleExpandRef = useRef<() => void>()

    // console.log("trace items after filtered:", versionRef.current, items)
    const { selectedController, setSelectedController, getSelectAction } = useSelect<TestingStatItem>({
        onSelectChange: (item, root, index) => {
            props.onSelectChange?.(item?.record, root?.record, index)
        }
    })

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

    const runItem = async (session: Session | undefined, item: TestingStatItem, path: ItemPath, notifyUpdate: () => void) => {
        // console.log("DEBUG runItem:", path.join("/"), item)
        if (item.status === "running") {
            // disable when already running
            // running by other, so here skip
            return
        }
        // run will contribute to current counter status
        if (!session && !props.api?.run) {
            return
        }
        // update status to running
        const controller = expandListController.current?.getController?.(path)
        if (!controller) {
            return
        }

        if (treatLikeFolder(item)) {
            runFolder(item, controller, (item, path, notify) => runItem(session, item, path, notify), path, expandListController.current, notifyUpdate)
        }
        if (item.record?.kind === "case") {
            await runCase(session, item, controller, runLimitedRef.current, notifyUpdate)
        } else if (session != null) {
            session.subscribeUpdate(item.record, status => {
                controller.dispatchUpdate(item => ({ ...item, status: status }))
                notifyUpdate()
            })
        }
    }
    const clickItem = (item: TestingStatItem, controller: ItemController<TestingStatItem>) => {
        const action = getSelectAction(item, controller)
        if (!action) {
            return
        }
        if (!props.checkBeforeSwitch) {
            action()
            return
        }
        props.checkBeforeSwitch(action)
    }

    const clickRun = async (item: TestingStatItem, controller: ItemController<TestingStatItem>) => {
        // when click on folder
        //   check if need to start a new session
        //   if so, start a new session
        //   sub folders and cases are run
        let session: Session | undefined
        if (props.runner != null) {
            session = await props.runner.start(item.record, [])
        }

        function runAction(item: TestingStatItem) {
            const isRoot = controller.path?.length <= 1
            // console.log("DEBUG run:", controller.path, isRoot)
            // if (true) {
            //     return
            // }
            runItem(session, item, controller.path, () => {
                // get the update-to-date item
                const item = controller.item
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
                props.onAllRan?.(item.counters as StateCounters)
            })
        }


        // if non-case, don't switch to it
        if (item.record?.kind !== "case") {
            runAction(item)
            return
        }

        // for case, switch to it, and use the 'request' button
        // on the interface
        //
        if (props.onClickCaseRun) {
            // switch to the case
            const switchAction = getSelectAction(item, controller)
            const update = (fn: (item: TestingStatItem) => TestingStatItem) => {
                controller.dispatchUpdate(fn)
            }
            if (!switchAction) {
                props.onClickCaseRun(item?.record, controller?.root?.record, controller?.index, update)
                return
            }
            const action = () => switchAction().then(() => props.onClickCaseRun(item?.record, controller?.root?.record, controller?.index, update))
            if (!props.checkBeforeSwitch) {
                action()
                return
            }
            props.checkBeforeSwitch(action)
            return
        }

        runAction(item)

        // for case, switch to it, and use the 'request' button
        // on the interface
        //
        // const selectAction = getSelectAction(item, controller)
        // const action = async () => {
        //     await selectAction?.()
        //     if (props.onClickCaseRun) {
        //         props.onClickCaseRun()
        //     } else {
        //         runAction()
        //     }
        // }
        // if (!props.checkBeforeSwitch) {
        //     action()
        //     return
        // }
        // props.checkBeforeSwitch(action)
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
        <ToolBar
            onToggleExpand={() => toggleExpandRef.current?.()}
            extra={<>
                <Checkbox label="Fail" value={showFailOnly} onChange={setShowFailOnly} style={{ marginLeft: "4px" }} />
                <Checkbox label="Skip" value={showSkipOnly} onChange={setShowSkipOnly} style={{ marginLeft: "4px" }} />
            </>}
        />

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
            clickStyleUseV1
            expandIconUseV1
            render={(item, controller) => <ItemRender
                item={item}
                controller={controller}
                api={props.api}
                showEditActions={props.showEditActions}
                showMenu={selectedController?.id === controller.id || controller.path.length <= 1} // root or selected
                isRoot={controller.path.length <= 1}
                onTreeChangeRequested={props.onTreeChangeRequested}
                onClick={() => clickItem(item, controller)}
                onClickRun={() => clickRun(item, controller)}
                onRefreshRoot={props.onRefreshRoot}
            />}
        />
    </div>
}


export enum HideType {
    None = "",
    All = "all",
    Children = "children"
}
export interface TestingItemState {
    selected?: boolean
    expanded?: boolean
    status?: RunStatus
    debugging?: boolean
    logs?: string
    counters?: any // sub status

    // hide type
    hideType?: HideType
}

export interface TestingItemV2 /* extends Omit<TestingItem, "children"> */ {
    key: string

    // mapping is not necessary as looking up by
    // key isn't really that useful
    children?: TestingItemV2[]

    kind?: TestingItemType
    state?: TestingItemState

    overallStatus?: RunStatus
}

// V2 is purely data driven, no internal state change
export interface TestingListV2Props<T extends TestingItemV2> extends TestingListBaseProps {
    data: T
    onChange?: (data: T) => void
    buildListItem?: (item: TestingListItem) => TestingListItem

    onClickExpand?: (item: TestingListItem, path: ItemPath, expand: boolean) => void
    onClickItem?: (item: TestingListItem, path: ItemPath) => void
    onClickRun?: (item: TestingListItem, path: ItemPath) => void
}

export interface TestingListItem extends TestingItemV2 {
    counters: Partial<StateCounters>
    children?: TestingListItem[]
    listStyle?: CSSProperties
    hideList?: boolean
    hide?: boolean
}

export function TestingListV2<T extends TestingItemV2>(props: TestingListV2Props<T>) {
    const data = props.data

    const buildListItemRef = useCurrent(props.buildListItem)
    const listItems = useMemo(() => map<TestingItemV2, TestingListItem>([data], (e, children): TestingListItem => {
        let testingItem: TestingListItem = {
            ...e,
            children,
            listStyle: {
                listStyleType: "none",
            },
            hide: e.state?.hideType === HideType.All,
            hideList: (e?.state?.expanded === false || e.state?.hideType === HideType.Children),
            counters: {},
        }
        if (buildListItemRef.current) {
            testingItem = buildListItemRef.current(testingItem)
        }
        return testingItem
    }), [data])

    const onChangeRef = useCurrent(props.onChange)
    useUpdatedEffect(() => {
        if (onChangeRef.current != null) {
            onChangeRef.current(data)
        }
    }, [data])

    return <List
        items={listItems}
        style={{
            listStyleType: 'none',
            ...props.style,
        }}
        render={(item, path) => <ExpandListItemRenderV2
            item={{ key: item.key, leaf: !item.children?.length, expandContainerStyle: { backgroundColor: item.state?.selected ? BG_SELECTED : undefined } }}
            key={item.key}
            clickStyleUseV1
            expandIconUseV1
            expanded={item.state?.expanded}
            onClickToggle={e => {
                props.onClickExpand?.(item, path, e)
            }}
            itemRenderContent={<ItemRenderV2
                showEditActions={false}
                isRoot={path.length === 1}
                item={{
                    leaf: !item.children?.length,
                    key: item.key,
                    record: { key: item.key, kind: item.kind, name: item.key, state: item.state },
                    counters: item.counters,
                    status: item.overallStatus,
                }}
                onClick={() => {
                    props.onClickItem?.(item, path)
                }}
                onClickRun={() => {
                    props.onClickRun?.(item, path)
                }}
                onRefreshRoot={props.onRefreshRoot}
            />}
        />}
    />
}

async function runCase(session: Session, item: TestingStatItem, controller: ItemController<TestingStatItem>, runLimited: (item: TestingItem, e: Options) => Promise<RunStatus>, notifyUpdate: () => void) {
    if (session != null) {
        // TODO: support nested case
        session.subscribeUpdate(item.record, status => {
            controller.dispatchUpdate(item => ({ ...item, status: status, counters: { [status]: 1 } }))
            notifyUpdate()
        })
        return
    }

    controller.dispatchUpdate(item => ({ ...item, status: "running", counters: { running: 1 } }))
    notifyUpdate()

    await runLimited(item.record, { parent: controller.parent?.item?.record, path: controller.path }).then((finalStatus) => {
        controller.dispatchUpdate(item => ({ ...item, status: finalStatus, counters: { [finalStatus]: 1 } }))
    }).catch((e) => {
        controller.dispatchUpdate(item => ({ ...item, status: "error", counters: { "error": 1 } }))
    })
    notifyUpdate()
}

function runFolder(item: TestingStatItem, controller: ItemController<TestingStatItem>, runItem: (item: TestingStatItem, path: ItemPath, notifyUpdate: () => void) => Promise<void>, path: ItemPath, expandListController: ExpandListController<TestingStatItem>, notifyUpdate: () => void) {
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
                const [newCounters, total] = mergeChildrenCounters(item.children, (chld) => expandListController.getState([...path, chld.key]).counters)
                let itemStatus: RunStatus = "success"
                if (newCounters["running"]) {
                    itemStatus = "running"
                } else if (newCounters["error"]) {
                    itemStatus = "error"
                } else if (newCounters["fail"]) {
                    itemStatus = "fail"
                } else if (newCounters["skip"] === total) {
                    itemStatus = "skip"
                } else if (newCounters["not_run"] === total) {
                    itemStatus = "not_run"
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

function mergeChildrenCounters(children: TestingStatItem[] | undefined, getChildCounters: (chld: TestingStatItem) => Partial<StateCounters>): [Partial<StateCounters>, number] {
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

function buildAndFilterItems(data: TestingItem[] | undefined, expandListController: ExpandListController<TestingStatItem>, getMockProperty: MockPropertyGetter, showFailOnly: boolean, showSkipOnly: boolean, getStatus: (path: string[]) => ItemStat | undefined) {
    const items = buildStatItems(data, expandListController, getMockProperty)
    return filterItems(items, showFailOnly, showSkipOnly, getStatus)
}

function buildStatItems(data: TestingItem[] | undefined, expandListController: ExpandListController<TestingStatItem>, getMockProperty: MockPropertyGetter): TestingStatItem[] {
    // let id = 1
    const items = map<TestingItem, TestingStatItem>(data, (e, children, idx, itemPath: string[]): TestingStatItem => {
        // merge with previous status
        return {
            record: e,
            children,
            leaf: !e.children?.length,
            counters: {} as StateCounters,
            key: `${e.name}_${idx}`,
            ...getMockProperty?.(e),
            itemStyle: {
                userSelect: "text"
            }
        }
    })
    traverse(items, (e) => {
    }, {
        after(e, ctx, parentCtx, idx, path) {
            if (e.record.kind === "case") {
                const prev = expandListController?.getState?.(path)
                // console.log("prev:", path, prev)
                e.counters = prev?.counters || { "not_run": 1 }
                return
            }
            [e.counters] = mergeChildrenCounters(e.children, child => child.counters)
        },
    })
    // console.log("items:", items)
    return items

}

interface ItemStat {
    status?: RunStatus
}
function filterItems(items: TestingStatItem[], showFailOnly: boolean, showSkipOnly: boolean, getStatus: (path: string[]) => ItemStat | undefined): TestingStatItem[] {
    if (!showFailOnly && !showSkipOnly) {
        return items
    }

    return filter<TestingStatItem, TestingStatItem>(items, (e, path) => {
        // const state = expandListController.current?.getState?.(path)
        const state = getStatus(path)
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
}

export interface ItemRenderV2Props {
    item: TestingStatItem,
    controller?: ItemController<TestingStatItem>

    showEditActions?: boolean

    disableRun?: boolean
    onClick?: () => void
    showMenu?: boolean
    isRoot?: boolean
    api?: TestingAPI
    onClickRun?: () => void
    onTreeChangeRequested?: () => void
    onRefreshRoot?: () => void
}

export interface ItemRenderProps extends ItemRenderV2Props {

}

export function ItemRender(props: ItemRenderProps) {
    return <ItemRenderV2 {...props} isRoot={props.isRoot || (props.controller && props.controller.path.length <= 1)} />
}

export function ItemRenderV2(props: ItemRenderV2Props) {
    let controller: ItemController<TestingStatItem> = props.controller
    const { item, api, onTreeChangeRequested, showEditActions } = props
    const isRoot = props.isRoot

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
        <div className={`testing-item-name ${isRoot ? "root" : ""}`} style={{}}>{renderItemName(item)}</div>
        {treatLikeFolder(item) && <RenderCounter
            status={item.status}
            key={item.record.name}
            counters={item.counters}
            style={{ marginLeft: "4px" }}
        />}

        {
            // always show, use hover to control hideness
        }
        <div
            className="testing-item-menu"
            style={{
                marginLeft: "auto",
                display: isRoot ? "flex" : undefined /* if root ,override display:none; otherwise use display:none */,
                flexWrap: "nowrap",
                alignItems: 'center'
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
                showEditActions !== false && <>
                    {
                        item.record?.kind === "testSite" && <VscNewFolder onClick={(e) => {
                            e.stopPropagation()
                            if (api?.addFolder) {
                                Promise.resolve(api?.addFolder?.(item.record, { path: controller?.path, parent: controller?.parent?.item?.record })).finally(() => {
                                    onTreeChangeRequested?.()
                                })
                            }
                        }} />
                    }
                    {
                        item.record?.kind === "testSite" && <RiDeleteBin6Line onClick={(e) => {
                            e.stopPropagation()
                            if (api?.delFolder) {
                                Promise.resolve(api?.delFolder?.(item.record, { path: controller?.path, parent: controller?.parent?.item?.record })).finally(() => {
                                    onTreeChangeRequested?.()
                                })
                            }
                        }} />
                    }
                    {
                        item.record?.kind !== "case" && <AiOutlinePlus onClick={(e) => {
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
                </>
            }
            {
                isRoot && <VscRefresh onClick={e => {
                    e.stopPropagation()
                    props.onRefreshRoot?.()
                }} />
            }
        </div>
    </div>
}

function treatLikeFolder(item: TestingStatItem | undefined): boolean {
    if (item == null) {
        return false
    }
    if (item.record.kind !== 'case') {
        return true
    }
    if (item.record.children?.length > 0) {
        return true
    }
    return false
}

function renderItemName(item: TestingStatItem | undefined): ReactElement {
    if (!item) {
        return <>unknown</>
    }
    let prefix = ''
    if (item.record?.kind === "case") {

        if (item.record?.id != null) {
            prefix = `[${item.record?.id}]: `
        }

    }
    return <>{prefix}{item.record.name}</>
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