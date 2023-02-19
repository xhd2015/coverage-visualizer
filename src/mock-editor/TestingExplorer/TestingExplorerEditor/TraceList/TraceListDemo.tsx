import React, { CSSProperties } from "react"
import TraceList from "."
import { ItemIndex } from "../../../List"
import { CallRecord } from "./trace-types"


type CallRecordPartial = Omit<Partial<CallRecord>, "children"> & {
    children?: CallRecordPartial[]
}

const callRecords: CallRecordPartial[] = [{
    func: "QueryUserInfo",
    children: [
        {
            func: "ValidateParams",
        },
        {
            func: "ReadDB",
            children: [{
                func: "PrepareSQL",
                panic: true,
            }, {
                func: "FallbackRedis",
                error: "connection reset"
            }, {
                func: "ReportFail",
            }],
        },
    ]
}]


export interface TraceListDemoProps {
    callRecords?: CallRecord[]
    style?: CSSProperties
    onSelectChange?: (item: CallRecord, index: ItemIndex) => void
}

export default function (props: TraceListDemoProps) {
    return <TraceList
        records={props.callRecords || (callRecords as any as CallRecord[])}
        onSelectChange={(record, index) => {
            props.onSelectChange?.(record, index)
        }}
        style={{
            height: "600px",
            width: "600px",
            ...props.style,
        }}
    />
}
