import { VscCollapseAll } from "react-icons/vsc"

export interface ToolBarProps {
    onToggleExpand?: () => void
    extra?: any
}

export default function ToolBar(props: ToolBarProps) {
    return <div className="list-bar" style={{ display: "flex", alignItems: "center" }}>
        <VscCollapseAll onClick={props.onToggleExpand} />
        {
            props.extra
        }
        {/* <Checkbox label="Fail" value={showFailOnly} onChange={setShowFailOnly} style={{ marginLeft: "4px" }} />
        <Checkbox label="Skip" value={showSkipOnly} onChange={setShowSkipOnly} style={{ marginLeft: "4px" }} /> */}
    </div>
}