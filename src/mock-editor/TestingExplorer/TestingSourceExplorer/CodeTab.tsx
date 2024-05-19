import { Tabs } from "antd";
import { CSSProperties, useEffect, useMemo } from "react";
import { LineCodeViewer, LineCodeViewerControler, RenderProps, useLineCodeViewerController } from "../../../code-viewer/LineCodeViewer";
import { IContentDecoration } from "../../../support/components/v2/model";
import TestingExplorerEditor, { TestingExplorerEditorProps } from "../TestingExplorerEditor";
import "./CodeTab.css";
import { loadCovLinesV2 } from "../../../code-viewer/line/line-features-cov";

export type LineMapping = {
    [lineNum: number]: {
        uncoverable?: boolean
        covered?: boolean
    }
}
export interface CodeTabProps {
    style?: CSSProperties
    className?: string
    hideOldCode?: boolean
    fullDiff?: boolean

    defaultTab?: "Test" | "Code"

    // display title
    file?: string

    newCode?: string
    oldCode?: string

    lineMapping?: LineMapping

    lineCodeViewerController?: React.MutableRefObject<LineCodeViewerControler>

    testingEditorProps?: TestingExplorerEditorProps
}

function buildDecorations(lineMapping: LineMapping): IContentDecoration[] {
    const decorations: IContentDecoration[] = []
    Object.keys(lineMapping || {}).forEach(lineNum => {
        const data = lineMapping[lineNum]
        if (data.uncoverable) {
            return
        }
        decorations.push({
            lineNumber: Number(lineNum),
            covered: data.covered,
        })
    })
    return decorations
}

export function CodeTab(props: CodeTabProps) {
    const { hideOldCode, fullDiff, newCode, oldCode, lineMapping, file } = props

    const viewController = useLineCodeViewerController()

    const renderProps = useMemo<RenderProps>(() => {
        return {
            loadFileLines: async (file) => {
                return await loadCovLinesV2({
                    selectedColors: {
                        "CHANGE": true,
                        "DELETE": true,
                        "HAS_COV": true,
                        "NO_COV": true,
                        "UNCHANGE": hideOldCode,
                    },
                    newCode: newCode,
                    oldCode: oldCode,
                    decorations: buildDecorations(lineMapping),
                    // getLineLabels: (line) => props.lineAnnotations?.[line]?.coverageLabels,
                })
            },
            hideOldCode,
            fullDiff,
            style: {
                height: "100%",
                // overflow: "auto"
            }
        }
    }, [newCode, oldCode, hideOldCode, fullDiff, lineMapping])

    useEffect(() => {
        if (viewController.current) {
            viewController.current.updateProps(renderProps)
        }
    }, [renderProps])

    if (props.lineCodeViewerController) {
        props.lineCodeViewerController.current = {
            ...viewController.current
        }
    }

    return <Tabs
        // defaultActiveKey="Test"
        defaultActiveKey={props.defaultTab == "Code" ? "Code" : "Test"}
        // size={size}
        style={{ marginBottom: 32, height: "100%", ...props.style, }}
        className={`code-tab ${props.className || ''}`}
        items={[{
            label: "Test",
            key: "Test",
            children: <TestingExplorerEditor {...props.testingEditorProps} />
        }, {
            label: "Code",
            key: "Code",
            children: <LineCodeViewer
                style={{
                    // height: "100%",
                    // overflow: "hidden"
                }}
                file={file}
                renderProps={renderProps}
                controlRef={viewController}
                lineStyle={{
                    // backgroundColor: "white"
                }}
            />
        }
        ]}
    />
}