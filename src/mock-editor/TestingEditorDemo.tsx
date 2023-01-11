import callRecord from "./testdata.json";

import { useRef } from "react";
import MockEditor, { MockData as MockEditorData } from "./MockEditor";
import TestingEditor from "./TestingEditor";
import "./TestingEditor.css";

export default function () {
    const simpleMockMap = useRef<{ [key: string]: MockEditorData }>({})
    return <TestingEditor
        header={
            <div className="flex-center">
                <div>
                    <span>Package:</span><span>A</span>
                </div>
                <div style={{ marginLeft: "4px" }}>
                    <span>Func:</span><span>B</span>
                </div>
            </div>
        }

        mockEditor={
            <MockEditor
                style={{ width: "100%" }}
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
    />
}