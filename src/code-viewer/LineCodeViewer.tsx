import { CSSProperties, MutableRefObject, ReactElement, useCallback, useEffect, useRef, useState } from "react"
import { BlockLineProps, CodeSelection, DiffCodeViewerTitled, LineRenderOptions, ScrollOptions, useDiffCodeViewerTitledController } from "./DiffCodeViewer"
// import { BlockLineProps, DiffCodeViewerTitled } from "@/coverage-visualizer/src/code-viewer/DiffCodeViewer"

export interface RenderProps {
    style?: CSSProperties
    className?: string
    loadFileLines: (file: string) => Promise<BlockLineProps[]>
    fullDiff?: boolean
    hideOldCode?: boolean

    renderFileNewLineHoverElement?: (file: string, blockLine: BlockLineProps) => LineRenderOptions
    renderFileWithSelection?: (file: string, selection: CodeSelection, line: BlockLineProps) => ReactElement
}
export type RenderCallback = (props: RenderProps) => void

export interface LineCodeViewerControler {
    updateProps: (renderProps: RenderProps) => void
    scrollToLine: (lineNumber: number, opts?: ScrollOptions) => void
}
export function useLineCodeViewerController(): MutableRefObject<LineCodeViewerControler> {
    return useRef()
}

export interface LineCodeViewerProps {
    style?: CSSProperties
    className?: string

    // style applied to all lines
    lineStyle?: CSSProperties

    file: string
    // deprecated onRenderProps change
    subscribeChange?: (callback: RenderCallback) => (() => void)

    renderProps?: RenderProps
    controlRef?: MutableRefObject<LineCodeViewerControler>
}

export function LineCodeViewer(props: LineCodeViewerProps) {
    const [renderProps, setRenderProps] = useState(props.renderProps)

    const { file } = props
    const loadLinesFunc = useCallback(() => renderProps?.loadFileLines?.(file), [renderProps?.loadFileLines, file])

    const renderNewLineHoverElement = useCallback((blockLine: BlockLineProps): { element: ReactElement, shouldShow?: boolean } => {
        return renderProps?.renderFileNewLineHoverElement?.(file, blockLine)
    }, [renderProps?.renderFileNewLineHoverElement, file])

    const renderWithSelection = useCallback((selection: CodeSelection, line: BlockLineProps): ReactElement => {
        return renderProps?.renderFileWithSelection?.(file, selection, line)
    }, [renderProps?.renderFileWithSelection, file])


    const controller = useDiffCodeViewerTitledController()

    useEffect(() => {
        return props.subscribeChange?.((renderProps) => {
            setRenderProps(renderProps)
        })
    }, [])

    if (props.controlRef) {
        props.controlRef.current = {
            updateProps(renderProps) {
                setRenderProps(renderProps)
            },
            scrollToLine(lineNumber, opts) {
                if (controller.current) {
                    controller.current.scrollToLine(lineNumber, opts)
                }
            },
        }
    }

    return <DiffCodeViewerTitled
        title={file}
        key={file}
        // controllerRef={controllerRef}
        style={{
            marginBottom: "20px",
            border: "1px solid #dbdbdb",
            ...props.style,
        }}
        className={`${props.className || ''} ${renderProps.className || ''}`}

        titleStyle={{
            position: "sticky",
            top: "0",
            zIndex: "1",
            fontSize: 14,
            backgroundColor: "#FAFAFA",
            paddingLeft: 12,
            lineHeight: '36px'
        }}
        lineStyle={props.lineStyle}
        loadingPlaceholder={<div style={{ paddingLeft: 12 }}>Loading...</div>}
        watchLoadLines
        fullDiff={renderProps.fullDiff}
        hideOldCode={renderProps.hideOldCode}
        renderNewLineHoverElement={renderNewLineHoverElement}
        renderWithSelection={renderWithSelection}
        loadLines={loadLinesFunc}
        codeViewerStyle={renderProps.style}
        controllerRef={controller}
    />
}
