import { Button, Checkbox } from "antd"
import { CSSProperties, useEffect, useState, Dispatch, SetStateAction } from "react"
import { AiOutlineReload } from "react-icons/ai"
import { BsFileEarmarkCheck } from "react-icons/bs"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { GoFileCode } from "react-icons/go"
import { SiGoland } from "react-icons/si"
import { VscVscode } from "react-icons/vsc"
import { ProgressIcon } from "../../../support/components/icon/ProgressIcon"
import { TraceExplorer, TraceExplorerProps } from "../../../trace/TraceExplorer"
import TextEditor from "../../TextEditor"
import CopyClipboard from "../../support/CopyClipboard"
import Icon from "../../support/Icon"
import { TestingItem } from "../testing-api"
import { CoverageLine, CoverageLineProps } from "./Coverage"

export interface XgoTestDetailProps {
    style?: CSSProperties
    className?: string

    item?: TestingItem
    content?: string
    log?: string

    trace?: boolean
    onTraceChange?: Dispatch<SetStateAction<boolean>>

    onClickRun?: () => void
    onClickDebug?: () => void
    onClickVscode?: () => void
    onClickGoland?: () => void
    copyText?: string
    onClickRefresh?: () => void
    running?: boolean

    debugging?: boolean

    showTrace?: boolean
    shownTraceProps?: TraceExplorerProps

    coverage?: CoverageLineProps
}

// debug with trace enabled
export function XgoTestDetail(props: XgoTestDetailProps) {
    return <div className={props.className} style={{ height: "100%", ...props.style }}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <CoverageLine {...props.coverage} />
        </div>
        <ItemDetail {...props} />
    </div>
}

export function ItemDetail(props: XgoTestDetailProps) {
    const item = props.item
    if (item == null) {
        return <>Select a Case</>
    }
    if (item.kind !== "case") {
        return <div>
            {item.file}
            {item.state?.logs &&
                <TextEditor style={{ height: "400px" }} value={item.state?.logs} readonly />
            }
        </div>
    }

    const disableButtons = !!(props.running || props.debugging)

    return <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "2px" }}>
            <AiOutlineReload style={{ cursor: "pointer", }}
                onClick={props.onClickRefresh} />

            <ProgressIcon icon={VscVscode} onClick={props.onClickVscode} style={{ color: "#24A9F2", cursor: "progress", marginLeft: "2px" }} height={20} width={20} />

            <ProgressIcon icon={SiGoland} onClick={props.onClickGoland} style={{ color: "rgb(51, 51, 51)", backgroundColor: "rgb(221, 221, 221)", cursor: "pointer", marginLeft: "2px" }} height={20} width={20} />

            <CopyClipboard style={{ marginLeft: "2px" }} copyIcon={GoFileCode} copiedIcon={BsFileEarmarkCheck} text={props.copyText} />
        </div>

        <TextEditor containerStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%" }} style={{ height: "100%" }} value={props.content} language="go" readonly />
        <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <Button onClick={props.onClickRun} loading={props.running} disabled={disableButtons} type="primary">Test</Button>
            </div>

            <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%", display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                <ExpandActions>
                    <Button onClick={props.onClickDebug} loading={props.debugging} disabled={disableButtons} size="middle" >Debug</Button>
                    <TraceCheckbox value={props.trace} onChange={props.onTraceChange} />
                </ExpandActions>
            </div>
        </div>
        <TextEditor containerStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%" }} style={{ height: "100%" }} value={props.log} readonly />

        {
            props.showTrace && <>
                <label>Trace</label>
                <div style={{
                    //  flexShrink: 1, flexBasis: "100px",
                    height: "10%",
                }}>
                    <TraceExplorer {...props.shownTraceProps} />
                </div>
            </>
        }
    </div>
}

export interface TraceCheckboxProps {
    style?: CSSProperties
    className?: string

    value?: boolean
    onChange?: React.Dispatch<React.SetStateAction<boolean>>
}

export function TraceCheckbox(props: TraceCheckboxProps) {
    return <div style={{
        display: "inline-flex",
        height: "100%",
        alignItems: "center",
        marginLeft: "4px",
    }}>
        <Checkbox style={{ marginTop: "-4px" }} checked={props.value} onChange={e => props.onChange?.(e.target.checked)}></Checkbox>
        <span style={{ marginLeft: "2px", cursor: "pointer" }} onClick={() => props.onChange?.(e => !e)}>Trace</span>
    </div>
}

export function ExpandActions(props: { value?: boolean, children?: any, rootStyle?: CSSProperties }) {
    const [expanded, setExpanded] = useState(!!props.value)
    return <>
        <ExpandIcon value={expanded} onChange={setExpanded} rootStyle={props.rootStyle} />
        {
            expanded && props.children
        }
    </>
}


export interface ExpandIconProps {
    value?: boolean
    onChange?: (v: boolean) => void

    rootStyle?: CSSProperties
}

export function ExpandIcon(props: ExpandIconProps) {
    const [expanded, setExpanded] = useState(!!props.value)

    useEffect(() => {
        props.onChange?.(expanded)
    }, [expanded])

    return <Icon rootStyle={{ display: "inline-flex", ...props.rootStyle }} icon={expanded ? FiChevronLeft : FiChevronRight} onClick={() => {
        setExpanded(e => !e)
    }} />
}