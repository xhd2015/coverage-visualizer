import { Button } from "antd"
import { CSSProperties } from "react"
import { AiOutlineReload } from "react-icons/ai"
import { BsFileEarmarkCheck } from "react-icons/bs"
import { GoFileCode } from "react-icons/go"
import { SiGoland } from "react-icons/si"
import { VscVscode } from "react-icons/vsc"
import { ProgressIcon } from "../../../support/components/icon/ProgressIcon"
import TextEditor from "../../TextEditor"
import CopyClipboard from "../../support/CopyClipboard"
import { TestingItem } from "../testing-api"

export interface XgoTestDetailProps {
    style?: CSSProperties
    className?: string

    item?: TestingItem
    content?: string
    log?: string

    onClickRun?: () => void
    onClickVscode?: () => void
    onClickGoland?: () => void
    copyText?: string
    onClickRefresh?: () => void
    running?: boolean
}

// debug with trace enabled
export function XgoTestDetail(props: XgoTestDetailProps) {
    return <div className={props.className} style={{ height: "100%", ...props.style }}>
        <ItemDetail {...props} />
    </div>
}

export function ItemDetail(props: XgoTestDetailProps) {
    const item = props.item
    if (item == null) {
        return <>Select a Case</>
    }
    if (item.kind == "dir") {
        return <div>{item.file}</div>
    }

    return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ marginBottom: "2px" }}>
            <AiOutlineReload style={{ cursor: "pointer", }}
                onClick={props.onClickRefresh} />

            <ProgressIcon icon={VscVscode} onClick={props.onClickVscode} style={{ color: "#24A9F2", cursor: "progress", marginLeft: "2px" }} height={20} width={20} />

            <ProgressIcon icon={SiGoland} onClick={props.onClickGoland} style={{ color: "rgb(51, 51, 51)", backgroundColor: "rgb(221, 221, 221)", cursor: "pointer", marginLeft: "2px" }} height={20} width={20} />

            <CopyClipboard style={{ marginLeft: "2px" }} copyIcon={GoFileCode} copiedIcon={BsFileEarmarkCheck} text={props.copyText || 'test'} />
        </div>

        <TextEditor containerStyle={{ flexGrow: 1 }} style={{ height: "300px" }} value={props.content} language="go" readonly />
        <div style={{ width: "100%", textAlign: "center" }}>
            <Button onClick={props.onClickRun} loading={props.running}>Test</Button>
        </div>
        <TextEditor containerStyle={{ flexGrow: 1 }} style={{ height: "200px" }} value={props.log} readonly />
    </div>
}