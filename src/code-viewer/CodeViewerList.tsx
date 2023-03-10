import ToolBar from "../mock-editor/support/ToolBar";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import ExpandList, { ExpandItem, useSelect } from "../mock-editor/ExpandList";
import LayoutLeftRight, { LayoutLeftRightProps } from "../mock-editor/support/LayoutLeftRight";
import { DiffCodeViewerListTitledDemo, Item } from "./DiffCodeViewerListDemo";
import ViewerList from "./ViewerList";
import { go } from "./lang";
import { compactLines, diffCode } from "./diff";
import { DiffCodeViewerTitled } from "./DiffCodeViewer";
import VirtualList, { VirtualListController } from "../mock-editor/support/VirtualList";
import { traverse } from "../mock-editor/tree";
import { useCurrent } from "../mock-editor/react-hooks";
import { FileCoverage } from "../support/components/CoverageVisualizer";
import ColResizeBar, { ColResizeBarProps } from "../support/components/v2/ColResizeBar";

export interface File extends ExpandItem {
    key: string

    path: string
    children?: File[]

    parent?: File
    coverage?: FileCoverage
}

export interface CodeViewerListProps {
    style?: CSSProperties
    className?: string
    files?: File[]

    listStyle?: CSSProperties
    listClassName?: string

    codeContainerStyle?: CSSProperties
    codeContainerClassName?: string

    renderFileCode?: (file: string) => any

    layoutProps?: LayoutLeftRightProps
    resizeBarProps?: ColResizeBarProps
    getResizeParent?: (e: HTMLElement) => HTMLElement
}

export default function (props: CodeViewerListProps) {
    const files = props.files
    const controlRef = useRef<VirtualListController>()

    const { fileList, keyMap } = useMemo(() => {
        const fileList = []
        const keyMap = {}
        traverse(files, (e, ctx, idx, path) => {
            if (e.leaf) {
                fileList.push(path.join("/"))
            }
        })
        fileList.forEach((file, i) => keyMap[file] = i)
        // console.log(fileList)
        return { fileList, keyMap }
    }, [files])


    const selectPath = useRef<string>()
    const ref = useCurrent({ keyMap })
    const { selectedController, setSelectedController, getSelectAction } = useSelect<File>({
        onSelectChange: (item, root, index) => {
            // NOTE: this maybe called more than once for single select
            // so do what ever you can to prevent duplicate     
            const newPath = item.path
            if (!newPath || newPath === selectPath.current) {
                return
            }
            selectPath.current = newPath
            const idx = ref.current.keyMap[newPath]
            if (!(idx >= 0)) {
                // maybe a dir
                return
            }
            // console.log("found idx:", newPath, idx)
            controlRef.current?.scrollTo?.(idx)
        }
    })

    const toggleExpandRef = useRef<() => void>()

    return <LayoutLeftRight
        {...props.layoutProps}
        rootStyle={props.style}
        leftStyle={{
            position: "relative",
            userSelect: "none",
            ...props.listStyle,
            ...props.layoutProps?.leftStyle,
        }}
        leftClassName={props.listClassName}
        leftChild={<div style={{ "position": "relative" }}>
            <div>
                <ToolBar onToggleExpand={() => toggleExpandRef.current?.()} />
                <ExpandList<File>
                    toggleExpandRef={toggleExpandRef}
                    initialAllExpanded={true}
                    items={files}
                    render={(item, controller) => <FileRender
                        file={item}
                        onClick={() => {
                            const action = getSelectAction(item, controller)
                            if (!action) {
                                return
                            }
                            action()
                        }}
                    />}
                />
                <ColResizeBar
                    barColor="#dddd85" // yellow like
                    getTargetElement={e => {
                        return props.getResizeParent ? props.getResizeParent(e) : e.parentElement.parentElement.parentElement as HTMLElement
                    }}
                    {...props.resizeBarProps}
                />
            </div>
        </div>
        }
        rightStyle={{
            // flexGrow: undefined
            ...props.layoutProps?.rightStyle,
        }}
        rightChild={
            <div style={{
                height: "100%",
                overflowY: "scroll",
                fontSize: "14px",
                // overflow: "auto"
            }}>
                {/* placeholder */}
                {/* <div style={{ minHeight: "1px" }}></div> */}
                <CodeList
                    files={fileList}
                    controlRef={controlRef}
                    style={{
                        width: "100%"
                    }}
                    renderFileCode={props.renderFileCode}
                />
            </div>
        }
    />
}
export interface CodeListProps {
    files?: string[]

    style?: CSSProperties
    controlRef?: React.MutableRefObject<VirtualListController>
    renderFileCode?: (file: string) => any
}
export function CodeList(props: CodeListProps) {
    const files = props.files
    const items = useMemo(() => files.map(e => ({ key: e })), [files])
    return <VirtualList
        controllerRef={props.controlRef}
        style={props.style}
        items={items}
        renderItem={((item, i) => props.renderFileCode?.(item.key))}
        maxRendering={5}
    />
}

export function FileRender(props: { file: File, onClick?: any }) {
    return <div
        style={{
            display: "flex",
            cursor: "pointer",
            alignItems: "center",
            flexGrow: "1",
            // flexWrap: "wrap", // don't wrap, let it x-scroll
        }}
        onClick={props.onClick}
    >{props.file?.key}
        <RenderFileCoverage coverage={props.file?.coverage} />
    </div>
}

export function RenderFileCoverage(props: { coverage?: FileCoverage }) {
    const cov = props.coverage
    return <>{
        cov && <span style={{ color: cov.good ? "green" : "red", marginLeft: "4px", whiteSpace: "nowrap" }}>
            <small>{cov.percent}</small>
        </span>
    }</>
}
