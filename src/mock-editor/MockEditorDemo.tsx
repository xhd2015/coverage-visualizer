import { useEffect, useMemo, useState } from "react";
import Code from "../support/components/v2/Code";
import { FileDetailGetter } from "../support/support/file";
import { CallRecord } from "./TraceList";
import TraceListDemo from "./TraceListDemo";
import { useCurrent } from "./react-hooks";

import callRecord from "./testdata.json";

export default function () {
    const [selectedItem, setSelectedItem] = useState<CallRecord>()
    const [respMode, setRespMode] = useState<string>("Response")

    const fd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                return { content: `{\n    "hello":"${selectedItem?.func || ""}"\n}`, language: "json" }
            },
        }
    }, [selectedItem?.func])
    const traceFd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                let content: string = ""
                let language
                if (selectedItem) {
                    if (respMode === "Response") {
                        if (selectedItem.error) {
                            content = "Error: " + selectedItem.error
                            language = "plaintext"
                        } else {
                            content = JSON.stringify(selectedItem?.result, null, "    ")
                            language = "json"
                        }
                    } else {
                        content = JSON.stringify(selectedItem?.args, null, "    ")
                        language = "json"
                    }
                }
                return { content, language }
            },
        }
    }, [selectedItem, respMode])

    return <div style={{ display: "flex", height: "610px", }}>
        <div>
            <TraceListDemo
                style={{ width: "250px", height: "100%" }}
                callRecords={callRecord?.root ? [callRecord?.root] : []}
                onSelectChange={(item, index) => {
                    setSelectedItem(item)
                }}
            />
        </div>
        <div style={{ width: "600px" }}>
            <div style={{ height: "50%", display: "flex", flexDirection: "column" }}>
                <div style={{}}>
                    <div style={{ backgroundColor: "rgb(108 108 108)", color: "white" }}>Set Mock</div>
                    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                        <RadioGroups
                            options={["Mock Response", "Mock Error", "No Mock"]}
                            initialSelect={"No Mock"}
                        /></div>
                </div>
                <Code
                    containerStyle={{ flexGrow: "1" }}
                    file="A"
                    fileDetailGetter={fd}
                />
            </div>
            <div style={{ height: "50%", marginTop: "10px", display: "flex", flexDirection: "column" }}>
                <div style={{ backgroundColor: "#74a99b", color: "white" }}>Trace</div>
                <div style={{ paddingBottom: "2px" }}>
                    <span style={{ fontWeight: "bold" }}>Status:</span><span>Mock Response</span> | <span>Mock Error</span> | <span style={{ fontWeight: "bold" }}>No Mock</span>
                </div>

                <div style={{ display: "flex" }}>
                    <RadioGroups
                        options={["Request", "Response"]}
                        initialSelect={respMode}
                        onChange={setRespMode}
                    /></div>
                <Code
                    containerStyle={{ flexGrow: "1" }}
                    file="B"
                    fileDetailGetter={traceFd}
                />
            </div>
        </div>
    </div>
}

export interface RadioGroupsProps {
    options?: string[]
    initialSelect?: string
    onChange?: (option: string) => void

    initialSelectIdx?: number
    onChangeIdx?: (idx: number) => void
}
export function RadioGroups(props: RadioGroupsProps) {
    const initIdx = useMemo(() => {
        if (props.initialSelectIdx !== undefined) {
            return props.initialSelectIdx
        }
        if (props.initialSelect === undefined) {
            return -1
        }
        for (let i = 0; i < props.options?.length; i++) {
            if (props.options[i] === props.initialSelect) {
                return i
            }
        }
    }, [props.options, props.initialSelect, props.initialSelectIdx])
    const [idx, setIdx] = useState(initIdx)

    const optionsRef = useCurrent(props.options)
    const onChangeRef = useCurrent(props.onChange)
    const onChangeIdxRef = useCurrent(props.onChangeIdx)

    useEffect(() => {
        onChangeRef.current?.(optionsRef.current?.[idx])
        onChangeIdxRef.current?.(idx)
    }, [idx])

    return <>{props.options?.map?.((opt, i) => <div>
        <input
            type="radio"
            key={`${opt}_${i}_input`}
            checked={idx === i}
            onChange={e => {
                if (e.target.checked) {
                    setIdx(i)
                }
            }}
            style={{ marginLeft: "4px" }}
        />
        <label key={`${opt}_${i}_label`}
            style={{ marginLeft: "2px" }}
            onClick={e => {
                setIdx(i)
            }}>{opt}</label>
    </div>)}</>
}