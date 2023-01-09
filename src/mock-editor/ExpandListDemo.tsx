import { Tag } from "antd"
import { useEffect, useRef, useState } from "react"
import { VscCollapseAll } from "react-icons/vsc"
import ExpandList, { ExpandItem } from "./ExpandList"
import { useCurrent } from "./react-hooks"
import { filter, traverse } from "./tree"

export interface DemoItem extends ExpandItem {
    name?: string
    children?: DemoItem[]
    panic?: boolean
    error?: boolean
    needMock?: boolean
    mocked?: boolean
}

const errorColor = "#DA2829"  // red
const panicColor = "#ffb500"  // orange-like
const defaultColor = "#19B7BE" // jaeger sea-blue
const greyColor = "#97918B"
const mockOkColor = "#6cc600" // green
const mockMissingColor = "#000000" // black


const demoItems: DemoItem[] = [{
    key: "Levi",
    name: "Levi",
    children: [
        {
            key: "Cedric",
            name: "Cedric",
            error: true,
            children: [{
                key: "Ratatuille",
                name: "Ratatuille",
                panic: true,
                leaf: true,
            }, {
                key: "Sherlock",
                name: "Sherlock",
                needMock: true,
                children: [{
                    key: "Steam Punk",
                    name: "Steam Punk",
                    needMock: true,
                    mocked: true,
                }]
            }],
        },
        {
            key: "Honker",
            name: "Honker",
            expanded: false,
            children: [{
                key: "High Horse", // need white-space: nowrap, otherwise would break line with with white space when space not enough
                name: "High Horse",
                leaf: true,
            }]
        }
    ]
}]

// apply default list style
traverse(demoItems, e => {
    e.listStyle = { listStyleType: "none", paddingLeft: "1em" }
})

export default function () {

    const toggleExpandRef = useRef<() => void>()
    const [showErrOnly, setShowErrOnly] = useState(false)
    const [showMockOnly, setShowMockOnly] = useState(false)

    const [items, setItems] = useState(demoItems)

    const demoItemsRef = useCurrent(demoItems)
    useEffect(() => {
        if (!showErrOnly && !showMockOnly) {
            setItems(demoItemsRef.current)
            return
        }
        setItems(filter(demoItemsRef.current, e => {
            if (showErrOnly && (e.error || e.panic)) {
                return true
            }
            if (showMockOnly && e.needMock) {
                return true
            }
            return false
        }))
    }, [showErrOnly, showMockOnly])

    return <div style={{
        border: "1px solid black",
        padding: "2px",
        height: "600px",
        width: "250px",
        overflowX: "scroll",
        overflowY: "scroll"
    }}>
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
        <ExpandList<DemoItem>
            items={items}
            initialAllExpanded={true}
            toggleExpandRef={toggleExpandRef}
            render={item => <>
                <div style={{ display: "flex", cursor: "pointer", alignItems: "center" }}>
                    <ItemIndicator item={item}></ItemIndicator>
                    <div style={{ whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ whiteSpace: "nowrap", color: greyColor, marginLeft: "5px" }}>{item.name}</div>
                    {
                        item.panic ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >panic</Tag> :
                            (item.error ? <Tag style={{ color: greyColor, marginLeft: "5px", padding: "1px" }} >error</Tag> : undefined)
                    }
                </div>
            </>}
        />
    </div>
}

export interface ItemIndicatorProps {
    item?: DemoItem
}

export function ItemIndicator(props: ItemIndicatorProps) {
    const item = props.item
    let color = defaultColor
    if (item?.needMock) {
        color = item?.mocked ? mockOkColor : mockMissingColor
    } else {
        if (item?.panic) {
            color = panicColor
        } else if (item?.error) {
            color = errorColor
        }
    }
    return <div style={{
        width: "4px", height: "1em", marginRight: "2px",
        //  backgroundColor: "cornflowerblue" 
        backgroundColor: color
    }}></div>
}
