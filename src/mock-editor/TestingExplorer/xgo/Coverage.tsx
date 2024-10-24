import { SyncOutlined } from "@ant-design/icons";
import { Button, Tooltip, Typography } from "antd";
import { FiExternalLink } from "react-icons/fi";
import { getColor, LabelDetail, toPercent } from "./coverage-util";

export interface CoverageData {
    link?: string
    total?: LabelDetail
    incremental?: LabelDetail
}

export interface CoverageLineProps {
    data?: CoverageData
    fetching?: boolean
    onClickFetch?: () => void
}

export function CoverageLine(props: CoverageLineProps) {
    const link = props.data?.link
    const total = props.data?.total
    const incremental = props.data?.incremental
    return <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: "2px" }}>Overall Coverage:</span>

        <Coverage total={total} incremental={incremental} />

        {/* TODO: i18n */}
        <Tooltip placement="top" title="Fetch latest coverage" mouseEnterDelay={1}>
            <Button
                icon={<SyncOutlined spin={props.fetching} />}
                disabled={props.fetching}
                onClick={props.onClickFetch}
                shape="circle"
                size="small"
            ></Button>
        </Tooltip>
        {link ? <Typography.Link href={link} target="_blank"><FiExternalLink /></Typography.Link> : null}
    </div>
}


// coverage
export function Coverage(props: { total?: LabelDetail, incremental?: LabelDetail }) {
    let e: any = '-'
    if (props.total != null || props.incremental != null) {
        e = <span>
            {CoverageValue({ detail: props.total })} {` / `} {CoverageValue({ detail: props.incremental })}
        </span>
    }
    return <Tooltip placement="top" title="Format: Total / Incremental">
        <span style={{ cursor: "default" }}>{e}</span>
    </Tooltip>


}

export interface CoverageValueProps {
    detail: LabelDetail | undefined
}

export function CoverageValue(props: CoverageValueProps) {
    const { detail } = props
    const percent = toPercent(detail?.value, '')
    const color = getColor(percent, detail?.pass ? 'pass' : 'fail')
    return <span style={{ color: color }}>{percent || '-'}</span>
}