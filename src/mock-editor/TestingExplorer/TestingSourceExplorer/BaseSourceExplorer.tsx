import { CSSProperties, useMemo } from "react"
import { GridLayout } from "../../../support/components/layout/GridLayout"
import { CodeTab, CodeTabProps } from "./CodeTab"
import { TreeItem, TreeList, TreeListProps } from "./TreeList"
import { buildFileTree } from "./util"


export interface SourceExplorerProps {
    style?: CSSProperties
    className?: string

    filesProps?: Partial<TreeListProps<TreeItem>>
    funcsProps?: Partial<TreeListProps<TreeItem>>

    files?: TreeItem[]
    funcs?: string[]
    codeTabProps?: CodeTabProps
}

export interface BaseSourceExplorerProps extends SourceExplorerProps {
    casesProps?: Partial<TreeListProps<TreeItem>>
    cases?: string[]
}
export interface BaseDebugTraceExplorerProps extends SourceExplorerProps {

}

const FUNC_WIDTH = "200px"

export function BaseTestingSourceExplorer(props: BaseSourceExplorerProps) {
    const funcs = useMemo(() => buildFileTree(props.funcs), [props.funcs])
    const cases = useMemo(() => buildFileTree(props.cases), [props.cases])

    return <GridLayout
        style={{
            height: "600px",
            border: "1px solid grey",
            // overflow: "hidden",
            ...props.style,
        }}
        className={props.className}
        initialSettings={{
            "files": {
                width: "200px",
                containerStyle: {
                    "overflow": "auto" // make the file list scrollable
                }
            },
            "funcCase": {
                width: FUNC_WIDTH,
            },
            "codeTabs": {
                containerStyle: {
                    // "overflow": "auto"
                }
            }
        }}
        childrenMapping={{
            "files": <TreeList
                {...props.filesProps}
                style={{
                    width: "100%",
                    border: "none",
                    minHeight: "10px",
                    paddingLeft: "16px",
                    overflowY: 'auto',
                    overflowX: "hidden",
                    ...props.filesProps?.style,
                }}
                items={props.files}
            />,
            "funcCase": <GridLayout
                row
                style={{
                    // width: "400px",
                    height: "100%",
                    borderLeft: "1px solid grey",
                    overflowX: "hidden",
                    overflowY: 'auto',
                }}
                initialSettings={{
                    "funcs": {
                        height: "50%",
                        containerStyle: {
                            // maxHeight: "50%",
                            overflowY: "auto"
                            // height: "300px"
                        }
                    },
                    "cases": {
                        height: "50%",
                        containerStyle: {
                            // maxHeight: "50%",
                            // height: "300px"
                        }
                    }
                }}
                childrenMapping={{
                    "funcs": <TreeList
                        {...props.funcsProps}
                        style={{
                            width: "100%",
                            border: "none",
                            minHeight: "10px",

                            ...props.funcsProps?.style,
                        }}
                        items={funcs}
                        expandListProps={{
                            showFileIcon: false,
                            ...props.funcsProps?.expandListProps,
                        }}
                    />,
                    "cases": <TreeList
                        {...props.casesProps}
                        style={{
                            width: "100%",
                            border: "none",
                            borderTop: "1px solid grey",
                            minHeight: "10px",

                            paddingLeft: "12px",
                            ...props.casesProps?.style,
                        }}

                        items={cases}
                        expandListProps={{
                            showFileIcon: false,
                            ...props.casesProps?.expandListProps,
                        }}
                    />
                }}
            />,
            "codeTabs": <CodeTab {...props.codeTabProps} />
        }}
    />
}

export function BaseDebugTraceExplorer(props: BaseDebugTraceExplorerProps) {
    const funcs = useMemo(() => buildFileTree(props.funcs), [props.funcs])
    return <GridLayout
        style={{
            height: "600px",
            border: "1px solid grey",
            // overflow: "hidden",
            ...props.style,
        }}
        className={props.className}
        initialSettings={{
            "files": {
                width: "200px",
                containerStyle: {
                    "overflow": "auto" // make the file list scrollable
                }
            },
            "funcs": {
                width: FUNC_WIDTH,
            },
            "codeTabs": {
                containerStyle: {
                    // "overflow": "auto"
                }
            }
        }}
        childrenMapping={{
            "files": <TreeList
                {...props.filesProps}
                style={{
                    width: "100%",
                    border: "none",
                    minHeight: "10px",
                    paddingLeft: "16px",
                    overflowY: 'auto',
                    overflowX: "hidden",
                    ...props.filesProps?.style,
                }}
                items={props.files}
            />,
            "funcs": <TreeList
                {...props.funcsProps}
                style={{
                    width: "100%",
                    border: "none",
                    minHeight: "10px",

                    ...props.funcsProps?.style,
                }}
                items={funcs}
                expandListProps={{
                    showFileIcon: false,
                    ...props.funcsProps?.expandListProps,
                }}
            />,
            "codeTabs": <CodeTab
                {...props.codeTabProps}
            />
        }}
    />
}