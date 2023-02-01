import { CSSProperties, useRef, useState } from "react";
import { traverse } from "../mock-editor/tree";
import CodeViewerList, { File } from "./CodeViewerList";
import { compactLines, diffCode } from "./diff";
import { ChangeType } from "./diff-vscode";
import { BlockLine, DiffCodeViewerTitled } from "./DiffCodeViewer";
import { go } from "./lang";

// we've tested for 100 files there shall have no
// obvious performance problem
// the VirtualList may be optimized later
const root: File = {
    key: "/",
    children: [
        {
            key: "src",
            children: [{
                key: "main.go",
                leaf: true,
            }, {
                key: "service",
                children: [{
                    key: "base.go",
                    leaf: true,
                }],
            }, {
                key: "handler",
                children: Array(100).fill(0).map((e, i) => ({ key: `handler_${i}.go`, leaf: true }))
            }],
        },
        {
            key: "test",
            children: [{
                key: "main_test.go",
                leaf: true,
            }],
        }
    ]
}

export interface CodeViewerListDemoProps {
    style?: CSSProperties
    className?: string
}

// TODO: compact the code
export default function CodeViewerListDemo(props: CodeViewerListDemoProps) {

    return <CodeViewerList
        files={root.children}
        style={{
            // border: "1px solid lightgrey",
            width: "80%",
            minWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            overflow: "auto",
            height: "80vh",
            ...props.style,
        }}
        className={props.className}
        listStyle={{
            width: "300px",
            border: "1px solid lightgrey",
            marginRight: "10px",
            overflow: "auto"
        }}
        renderFileCode={(file) => <DiffCodeViewerTitled
            title={file}
            key={file}
            style={{
                marginBottom: "20px",
                border: "1px solid #dbdbdb",
            }}
            titleStyle={{
                position: "sticky",
                top: "0",
                zIndex: "1",
                backgroundColor: "#FAFAFA",
            }}
            loadingPlaceholder={<div>Loading...</div>}
            loadLines={async () => {
                let newCode = `package main

func main(){
    // comment
    fmt.Printf("world")

    me have nothing
    you have something
    // dd
    you have me
    // AF
    // XYZ
}
`

                if (file === 'test/main_test.go') {
                    newCode = newCode.repeat(100)
                }
                const blockLines = diffCode(
                    `package main

func main(){
    fmt.Printf("hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")
    // end

    me have nothing
    you have something
    // dd
    // AF
    // XYZ
}
`, newCode,
                    {
                        baseProps: {
                            grammar: go.grammar,
                            language: go.langauge,
                        }
                    }
                )
                const lines = compactLines(blockLines, {
                    shouldShow(line) {
                        // if (file === "src/main.go") {
                        //     return false
                        // }
                        return line.changeType !== ChangeType.Unchange
                    },
                    ctxBefore: file === "src/main.go" ? 1 : 3,
                    ctxAfter: file === "src/main.go" ? 1 : 3,
                })
                return new Promise(resolve => setTimeout(() => resolve(lines), 1000))
            }}
        />}
    />
}