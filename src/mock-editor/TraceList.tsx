
import { Tag } from "antd"
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { VscCollapseAll } from "react-icons/vsc"
import ExpandList, { ExpandItem, ItemController, useExpandListController } from "./ExpandList"
import { ItemIndex } from "./List"
import { useCurrent } from "./react-hooks"
import Checkbox from "./support/Checkbox"
import { CallRecord } from "./trace-types"
import { filter, map } from "./tree"


const errorColor = "#DA2829"  // red
const panicColor = "#ffb500"  // orange-like
const defaultColor = "#19B7BE" // jaeger sea-blue
const greyColor = "#97918B"
const mockOkColor = "#6cc600" // green
const mockMissingColor = "#000000" // black

export interface CallRecordItem extends ExpandItem {
    record?: CallRecord

    needMock?: boolean
    mocked?: boolean

    contentStyle?: CSSProperties
    children?: CallRecordItem[]
}

export interface TraceListProps {
    records?: CallRecord[]
    className?: string

    // style for the root container
    style?: CSSProperties

    getMockProperty?: (e: CallRecord) => { needMock?: boolean, mocked?: boolean },

    onSelectChange?: (item: CallRecord, root: CallRecord, index: ItemIndex) => void
}

export default function (props: TraceListProps) {
    // filters
    const [showErrOnly, setShowErrOnly] = useState(false)
    const [showMockOnly, setShowMockOnly] = useState(false)


    const debugKey = false
    let versionRef = useRef(0)

    // uncomment this to see if key causes problems
    // expericent: list always causes problems
    versionRef.current++

    const getMockPropertyRef = useCurrent(props.getMockProperty)

    // id is stable
    const initItems = useMemo(() => {
        // let id = 1
        const items = map<CallRecord, CallRecordItem>(props.records, (e, children, idx): CallRecordItem => ({
            record: e as CallRecord,
            children,
            leaf: !children?.length,
            key: `${e.func}_${idx}${debugKey ? "_" + versionRef.current : ""}`, // will not change as long as records not change
            // needMock:,
            // mocked:
            ...getMockPropertyRef?.current?.(e),
            itemStyle: {
                userSelect: "text"
            }
        }))
        return items
    }, [props.records])

    const [items, setItems] = useState(initItems)
    const initItemsRef = useCurrent(initItems)

    const toggleExpandRef = useRef<() => void>()

    useEffect(() => {
        if (!showErrOnly && !showMockOnly) {
            setItems(initItemsRef.current)
            return
        }
        let filterItems = filter<CallRecordItem, CallRecordItem>(initItemsRef.current, e => {
            if (showErrOnly && (e.record?.error || e.record?.panic)) {
                return true
            }
            if (showMockOnly && e.needMock) {
                return true
            }
            return false
        })

        // update leaf based on children
        filter<CallRecordItem, CallRecordItem>(filterItems, e => {
            e.leaf = !e.children?.length
            // e.key = e.key + `_${versionRef.current}`
            e.key = debugKey ? e.key + `_${versionRef.current}` : e.key
            return true
        })
        setItems(filterItems)
    }, [initItems, showErrOnly, showMockOnly])

    // console.log("trace items after filtered:", versionRef.current, items)

    interface ItemControllerExt extends ItemController<CallRecordItem> {
        clear?: () => void
    }
    const [selectedController, setSelectedController] = useState<ItemControllerExt>()

    // clear selected if it disappear
    useEffect(() => {
        if (!selectedController) {
            return
        }
        let itemList: CallRecordItem[] = items
        for (const i of selectedController.index) {
            if (!(itemList.length > i)) {
                setSelectedController(undefined)
                return
            }
            itemList = itemList[i].children
        }
    }, [items])

    const expandListController = useExpandListController<CallRecordItem>()
    // update selected status if source changed
    // const selectedControllerRef = useCurrent(selectedController)
    // useEffect(() => {
    //     const controller = selectedControllerRef.current
    //     if (!controller) {
    //         return
    //     }
    //     const item = expandListController.current?.getState(controller?.path)
    //     if (!item) {
    //         // clear selected
    //         setSelectedController(undefined)
    //         return
    //     }
    //     props.onSelectChange?.(item.record, controller.root?.record, controller.index)
    // }, [initItems])

    return <div style={{
        border: "1px solid black",
        padding: "2px",
        overflowX: "scroll",
        overflowY: "scroll",
        ...props.style,
    }}
        className={props.className}
    >
        <div className="list-bar" style={{ display: "flex", alignItems: "center" }}>
            <VscCollapseAll onClick={() => {
                toggleExpandRef.current?.()
            }} />
            <Checkbox label="Error" value={showErrOnly} onChange={setShowErrOnly} style={{ marginLeft: "4px" }} />
            <Checkbox label="Mock" value={showMockOnly} onChange={setShowMockOnly} style={{ marginLeft: "4px" }} />
        </div>
        <ExpandList<CallRecordItem>
            items={items}
            controllerRef={expandListController}
            initialAllExpanded={true}
            toggleExpandRef={toggleExpandRef}
            render={(item, controller) => <ItemRender
                item={item}
                controller={controller}
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
            />}
        />
    </div>
}
export function ItemRender(props: { item: CallRecordItem, controller: ItemController<CallRecordItem>, onClick?: () => void }) {

    const item = props.item

    return <div style={{
        display: "flex",
        cursor: "pointer",
        alignItems: "center",
        ...item.contentStyle,
    }}
        onClick={props.onClick}
    >
        <ItemIndicator item={item}></ItemIndicator>
        <div style={{ whiteSpace: "nowrap" }}>{item.record.func}</div>
        {/* <div style={{ whiteSpace: "nowrap", color: greyColor, marginLeft: "5px" }}>{item.name}</div> */}
        {
            item.record.panic ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >panic</Tag> :
                (item.record.error ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >error</Tag> : undefined)
        }
        <div style={{ whiteSpace: "nowrap", color: greyColor, marginLeft: "5px" }}>{formatCost(item.record.end - item.record.start)}</div>
    </div>
}
function formatCost(ns: number): string {
    if (isNaN(ns)) {
        return "NaN ns"
    }
    if (ns < 1000) {
        return `${ns}ns`
    }
    const us = Math.floor(ns / 1000)
    if (us < 1000) {
        return `${us}μs`
    }
    const ms = Math.floor(us / 1000)
    if (ms < 1000) {
        return `${ms}ms`
    }
    const s = Math.floor(ms / 1000)
    return `${s}s`
}

export interface ItemIndicatorProps {
    item?: CallRecordItem
}

export function ItemIndicator(props: ItemIndicatorProps) {
    const item = props.item
    let color = defaultColor
    if (item?.needMock) {
        color = item?.mocked ? mockOkColor : mockMissingColor
    } else {
        if (item?.record?.panic) {
            color = panicColor
        } else if (item?.record?.error) {
            color = errorColor
        }
    }
    return <div style={{
        width: "4px", height: "1em", marginRight: "2px",
        //  backgroundColor: "cornflowerblue" 
        backgroundColor: color
    }}></div>
}
