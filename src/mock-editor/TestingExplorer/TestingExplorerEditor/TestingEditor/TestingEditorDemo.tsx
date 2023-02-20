import callRecord from "../../testdata.json";
import React, { useRef } from "react";
import MockEditor, { MockEditData as MockEditorData } from "./MockEditor";
import "./TestingEditor.css";
import TestingEditor from ".";

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