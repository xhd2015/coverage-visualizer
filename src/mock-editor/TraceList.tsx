
import { Tag } from "antd"
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { VscCollapseAll } from "react-icons/vsc"
import ExpandList, { ExpandItem, ItemController } from "./ExpandList"
import { ItemIndex, ItemPath } from "./List"
import { useCurrent } from "./react-hooks"
import { filter, map, traverse } from "./tree"

export interface RootRecord {
    startTime: string // the abolute begin time
    root: CallRecord
}

export interface CallRecord {
    pkg: string
    func: string
    file: string
    line: number // 1-based

    start: number // relative to request begin, as nanoseconds
    end: number

    args: any

    error?: string // has error,may be empty
    panic?: boolean // has panic
    result: any // keyed by name, if no name, a slice

    log?: any // log set within request
    children?: CallRecord[]
}

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
    style?: CSSProperties

    onSelectChange?: (item: CallRecord, index: ItemIndex) => void
}

export default function (props: TraceListProps) {
    // filters
    const [showErrOnly, setShowErrOnly] = useState(false)
    const [showMockOnly, setShowMockOnly] = useState(false)

    // id is stable
    const initItems = useMemo(() => {
        // let id = 1
        const items = map<CallRecord, CallRecordItem>(props.records, (e, children, idx): CallRecordItem => ({
            record: e as CallRecord,
            children,
            leaf: !children?.length,
            key: `${e.func}_${idx}`, // filled later
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
            return true
        })
        setItems(filterItems)
    }, [showErrOnly, showMockOnly])

    // console.log("trace items:", items)

    const [selectedController, setSelectedController] = useState<ItemController<CallRecordItem>>()

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
            <div style={{ marginLeft: "4px", display: "flex", alignItems: "center" }}>
                <input type="checkbox" checked={showErrOnly} onChange={e => setShowErrOnly(e.target.checked)} />
                <span style={{ marginLeft: "2px" }}>Error</span>
            </div>
            <div style={{ marginLeft: "4px", display: "flex", alignItems: "center" }}>
                <input type="checkbox" checked={showMockOnly} onChange={e => setShowMockOnly(e.target.checked)} />
                <span style={{ marginLeft: "2px" }}>Mock</span>
            </div>
        </div>
        <ExpandList<CallRecordItem>
            items={items}
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
                        selectedController.dispatchUpdate(item => ({ ...item, expandContainerStyle: { backgroundColor: undefined } }))
                    }
                    setSelectedController(controller)
                    controller?.dispatchUpdate?.(item => ({ ...item, expandContainerStyle: { backgroundColor: "#eeeeee" } }))

                    props.onSelectChange?.(item.record, controller.index)
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
