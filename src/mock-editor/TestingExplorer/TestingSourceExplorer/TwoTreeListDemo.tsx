import { CSSProperties } from "react"
import { GridLayout } from "../../../support/components/layout/GridLayout"
import { TreeList } from "./TreeList"
import { TreeListDemo } from "./TreeListDemo"
import { buildFileTree } from "./util"

export interface TwoTreeListDemoProps {
    style?: CSSProperties
    className?: string
}

const files = buildFileTree(["src/main.go"])
const funcs = buildFileTree(["main", "startGo"])
const cases = buildFileTree(["param", "resp"])

export function TwoTreeListDemo(props: TwoTreeListDemoProps) {
    return <GridLayout
        style={{
            height: "400px",
            border: "1px solid grey",
            overflow: "hidden"
        }}
        childrenMapping={{
            "files": <TreeListDemo
                style={{
                    width: "100%",
                    border: "none",
                    minHeight: "10px",
                }}
                items={files}
            />,
            "funcCase": <GridLayout
                row
                style={{
                    // width: "400px",
                    height: "100%",
                    borderLeft: "1px solid grey",
                    overflow: "hidden"
                }}

                childrenMapping={{
                    "funcs": <TreeListDemo style={{
                        width: "100%",
                        border: "none",
                        minHeight: "10px",
                    }}
                        items={funcs}
                        expandListProps={{
                            showFileIcon: false
                        }}
                    />,
                    "cases": <TreeListDemo
                        style={{
                            width: "100%",
                            border: "none",
                            borderTop: "1px solid grey",
                            minHeight: "10px",
                        }}
                        items={cases}
                        expandListProps={{
                            showFileIcon: false
                        }}
                    />
                }}
            />
        }}
    />
}