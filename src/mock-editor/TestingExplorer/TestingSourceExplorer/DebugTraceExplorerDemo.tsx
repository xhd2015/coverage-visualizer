import { CSSProperties, useState } from "react";
import { MockData } from "../testing";
import { DebugTraceExplorer } from "./DebugTraceExplorer";
import { API } from "./EndpointDebugTraceExplorer";
import { buildFileTree } from "./util";

export interface DebugTraceExplorerDemoProps {
    style?: CSSProperties
    className?: string
}

const files = buildFileTree(["src/main.go"])
const funcs = ["main", "startGo"]

export function DebugTraceExplorerDemo(props: DebugTraceExplorerDemoProps) {

    const [addr, setAddr] = useState("localhost:45000")
    const [pkg, setPkg] = useState("")
    const [fn, setFn] = useState("")
    const [respLastArg, setRespLastArg] = useState(false)

    return <div>
        <div>
            Addr:<input value={addr} onChange={e => setAddr(e.target.value)}></input>
        </div>

        <div>
            Pkg:<input value={pkg} onChange={e => setPkg(e.target.value)} style={{ width: "1000px" }}></input>
        </div>
        <div>
            Func:<input value={fn} onChange={e => setFn(e.target.value)} style={{ width: "600px" }}></input>
        </div>
        <div>
            Return Last Arg:<input type='checkbox' checked={respLastArg} onChange={e => setRespLastArg(e.target.checked)}></input>
        </div>

        <DebugTraceExplorer
            files={files}
            funcs={funcs}
            codeTabProps={{
                testingEditorProps: {
                    async request(req) {
                        if (!addr) {
                            throw new Error("requires addr")
                        }
                        if (!pkg) {
                            throw new Error("requires pkg")
                        }
                        if (!fn) {
                            throw new Error("requires func")
                        }
                        console.log("click request:", req)
                        let mockDataStr: string
                        let mockData: MockData

                        let reqStr: string
                        if (typeof req.mock === 'string') {
                            mockDataStr = req.mock
                        } else {
                            mockData = req.mock
                        }
                        if (typeof req.request === 'string') {
                            reqStr = req.request
                        } else {
                            reqStr = JSON.stringify(req.request)
                        }
                        const resp = await API.invokeFunc(addr,
                            {
                                // pkg: "example.com/mod/pkg",
                                // func: "Example",
                                // requestStr: `{"req":{"Time":"2023-12-20 00:00:00"}}`,
                                pkg: pkg,
                                func: fn,
                                requestStr: reqStr,
                                respLastArg,

                                // either one will be effective
                                mockDataStr: mockDataStr,
                                mockData: mockData,
                                //  {
                                //     "Mapping": {
                                //         "example.com/mod/pkg": {
                                //             "Hello": {
                                //                 "Resp": {}
                                //             }
                                //         }
                                //     }
                                // }
                            })
                        console.log("invokResp:", resp)
                        // await new Promise(resolve => setTimeout(resolve, 2000))
                        if (true) {
                            return {
                                Response: resp.responseStr,
                                Error: resp.error,
                                AssertResult: {
                                    success: true,
                                },
                                Extension: {
                                    Data: {
                                        trace: resp.stackTrace,
                                    }
                                }
                            }
                        }
                    },
                },
                newCode: `package hello

hello world
print ok
`,
                // of course we can still get coverage
                lineMapping: {
                    1: {
                        uncoverable: true
                    },
                    2: {
                        uncoverable: true
                    },
                    3: {
                        covered: true,
                    },
                    4: {
                        covered: false,
                    }
                }
            }}
        />
    </div>

}