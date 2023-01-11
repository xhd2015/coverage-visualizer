import { useMemo, useRef } from "react";
import MockEditor, { MockData } from "./MockEditor";
import callRecord from "./testdata.json";

export default function () {
    const simpleMockMap = useRef<{ [key: string]: MockData }>({})
    return <MockEditor
        style={{
            marginLeft: "400px",
        }}
        callRecords={callRecord?.root ? [callRecord?.root] : []}
        getMock={(item) => {
            const key = item.item.pkg + "." + item.item.func
            return simpleMockMap.current[key]
        }}
        onMockChange={(item, data) => {
            const key = item.item.pkg + "." + item.item.func
            simpleMockMap.current[key] = data
        }}
    />
}