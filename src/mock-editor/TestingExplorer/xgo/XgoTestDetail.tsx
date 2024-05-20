import { CSSProperties } from "react"
import JSONEditor from "../../JSONEditor"
import { Button } from "antd"
import { TestingItem } from "../testing-api"
import TextEditor from "../../TextEditor"
import { VscodeIcon } from "../../../support/assets/VscodeIcon"
import { VscVscode } from "react-icons/vsc";
import { AiOutlineReload } from "react-icons/ai";

export interface XgoTestDetailProps {
    style?: CSSProperties
    className?: string

    item?: TestingItem
    content?: string
    log?: string

    onClickRun?: () => void
    onClickVscode?: () => void
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
        <div>
            <AiOutlineReload style={{ cursor: "pointer", marginRight: "2px" }}
                onClick={props.onClickRefresh} />

            <VscVscode style={{ color: "#24A9F2", cursor: "pointer" }} height={20} width={20}
                onClick={props.onClickVscode}
            />
        </div>
        <TextEditor containerStyle={{ flexGrow: 1 }} style={{ height: "300px" }} value={props.content} language="go" readonly />
        <div style={{ width: "100%", textAlign: "center" }}>
            <Button onClick={props.onClickRun} loading={props.running}>Test</Button>
        </div>
        <TextEditor containerStyle={{ flexGrow: 1 }} style={{ height: "200px" }} value={props.log} readonly />
    </div>
}