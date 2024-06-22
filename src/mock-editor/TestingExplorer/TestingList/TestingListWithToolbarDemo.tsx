import { CSSProperties, useMemo, useState } from "react"
import { TestingItemV2, TestingListV2 } from "."
import { Button } from "antd"
import { TestingListWithToolbar } from "./TestingListWithToolbar"
import { buildData, demoData } from "./TestingListDemo"


export interface TestingListWithToolbarDemoProps {
    style?: CSSProperties
    className?: string
}

export function TestingListWithToolbarDemo(props: TestingListWithToolbarDemoProps) {
    const demoDataMapping = useMemo<TestingItemV2[]>(() => buildData(demoData), [demoData])
    const [data, setData] = useState(demoDataMapping[0])

    return <TestingListWithToolbar
        style={{
            width: "400px", height: "80vh", border: "1px solid grey",
        }}
        data={data}
        onChange={setData}
    />
}