import { useCurrent } from "../mock-editor/react-hooks"
import { CSSProperties, useState, useEffect, MutableRefObject, useRef } from "react"
import { DiffBlock } from "./diff"
import { Line, LineProps } from "./Line"
import { ChangeType } from "./diff-vscode"
import { BsArrowBarDown, BsArrowBarUp } from "react-icons/bs"

import "./Line.css"

export interface DiffCodeViewerProps {
    lines?: BlockLineProps[]
    // blocks?: DiffBlock[]
    style?: CSSProperties

    hideOldCode?: boolean

    onClickExpandUp?: (block: BlockLineProps, index: number) => void
    onClickExpandDown?: (block: BlockLineProps, index: number) => void
}

export default function DiffCodeViewer(props: DiffCodeViewerProps) {
    return <div className="code-viewer" style={props.style}>{
        props.lines?.map?.((block, i) => <RenderBlockLine
            key={block.collapsed ? `collapse_${i}` : block.line?.index}
            hideOldCode={props.hideOldCode}
            {...block}
            onClickExpandDown={() => {
                props.onClickExpandUp?.(block, i)
            }}
            onClickExpandUp={() => {
                props.onClickExpandDown?.(block, i)
            }}
        />)
    }</div>
}

export interface BlockLine {
    index: number // index in the original line list, the index can be used as a key, 0-based
    changeType: ChangeType
    oldLine?: LineProps
    newLine?: LineProps
}

// exactly one line from old, one line from new
export interface BlockLineProps {
    line?: BlockLine
    // render this BlockLineProps
    // as a load prompt
    collapsedLines?: BlockLine[]
    collapsed?: boolean
}

export interface BlockLineWithListenersProps extends BlockLineProps {
    onClickExpandUp?: () => void
    onClickExpandDown?: () => void

    hideOldCode?: boolean
}

export function RenderBlockLine(props: BlockLineWithListenersProps) {
    return <div
        className={`block-line ${props.collapsed ? "collapsed" : ""}`}>
        {
            props.collapsed ? <div style={{
            }}>
                <LinkButton icon={<BsArrowBarDown />} style={{ marginRight: "10px" }} onClick={props.onClickExpandUp} />
                <LinkButton icon={<BsArrowBarUp />} onClick={props.onClickExpandDown} />
            </div> : <>
                {!props.hideOldCode &&
                    <Line
                        hideNumber={props.line?.oldLine === undefined}
                        {...props.line?.oldLine}
                        style={{
                            //  flexGrow: 1,
                            width: "50%",
                            ...props.line.oldLine?.style,
                        }} />
                }
                <Line hideNumber={props.line?.newLine === undefined}
                    {...props.line?.newLine}
                    style={{
                        // flexGrow: 1
                        width: !props.hideOldCode && "50%",
                        ...props.line.newLine?.style,
                    }} />
            </>
        }
    </div>
}

function LinkButton(props: { icon?: any, style?: CSSProperties, onClick?: any }) {
    return <a
        href={undefined}
        style={{
            "textDecoration": "none",
            fontSize: "0.875rem",
            ...props.style,
        }}
        onClick={props.onClick} > {props.icon}<span style={{ marginLeft: "2px" }}>Show 20 Lines</span></a>
}

export interface DiffCodeViewerTitledController {
    reloadLines?: () => Promise<void>
}

export function useDiffCodeViewerTitledController(): MutableRefObject<DiffCodeViewerTitledController> {
    return useRef<DiffCodeViewerTitledController>()
}

export interface DiffCodeViewerTitledProps {
    style?: CSSProperties
    className?: string
    title?: string

    titleStyle?: CSSProperties
    titleClassName?: string

    controllerRef?: MutableRefObject<DiffCodeViewerTitledController>

    loadingPlaceholder?: any

    // watched
    loadLines?: () => Promise<BlockLineProps[]>
    watchLoadLines?: boolean

    hideOldCode?: boolean
}
export function DiffCodeViewerTitled(props: DiffCodeViewerTitledProps) {
    const [loaded, setLoaded] = useState(false)
    const [lines, setLines] = useState<BlockLineProps[]>([])

    const loadLinesRef = useCurrent(props.loadLines)
    useEffect(() => {
        if (props.watchLoadLines) {
            // already loaded
            return
        }
        // will be loaded at least once
        Promise.resolve(loadLinesRef.current?.()).then(lines => {
            setLines(lines)
            setLoaded(true)
        })
    }, [])

    useEffect(() => {
        if (props.watchLoadLines) {
            Promise.resolve(props.loadLines?.()).then(lines => {
                setLines(lines)
                setLoaded(true)
            })
        }
    }, [props.watchLoadLines, props.loadLines])

    if (props.controllerRef) {
        props.controllerRef.current = {
            reloadLines(): Promise<void> {
                Promise.resolve(loadLinesRef.current?.()).then(lines => {
                    setLines(lines)
                    setLoaded(true)
                })
                return
            }
        }
    }

    return <div style={props.style} className={props.className}>
        {/* title */}
        <div style={props.titleStyle} className={props.titleClassName}>
            <span style={{ fontWeight: "bold" }}>{props.title}</span>
        </div>
        {
            !loaded && props.loadingPlaceholder
        }
        <DiffCodeViewer
            lines={lines}
            hideOldCode={props.hideOldCode}
            onClickExpandUp={(block, i) => {
                setLines(expandLines(lines, block, i, true))
            }}
            onClickExpandDown={(block, i) => {
                setLines(expandLines(lines, block, i, false))
            }}
        />
    </div>
}
const collapseLineCount = 20
// const collapseLineCount = 1
function expandLines(lines: BlockLineProps[], block: BlockLineProps, i: number, up: boolean): BlockLineProps[] {
    // debugger
    const cpLines = [...lines]
    const keepSome = block.collapsedLines?.length > collapseLineCount
    let outLines: BlockLine[]
    let leftLines: BlockLine[]
    let insertBeforeIdx = i
    if (!keepSome) {
        // totally removed
        outLines = block.collapsedLines
        leftLines = []
    } else if (up) {
        outLines = block.collapsedLines.slice(block.collapsedLines.length - collapseLineCount)
        leftLines = block.collapsedLines.slice(0, block.collapsedLines.length - collapseLineCount)
        // don't mess line orders
        insertBeforeIdx = i + 1
    } else {
        outLines = block.collapsedLines.slice(0, collapseLineCount)
        leftLines = block.collapsedLines.slice(collapseLineCount)
    }

    if (leftLines.length) {
        // replace with new block
        cpLines.splice(i, 1, { ...block, collapsedLines: [...leftLines] })
    } else {
        // when no lines left, remove the collapse info
        cpLines.splice(i, 1)
    }

    // insert new lines
    // splice insertion is insertion before, not after
    // > a=[1,2,3,4]
    // [ 1, 2, 3, 4 ]
    // > a.splice(1,0,4)
    // []
    // > a
    // [ 1, 4, 2, 3, 4 ]
    cpLines.splice(insertBeforeIdx, 0, ...outLines?.map?.(e => ({ line: e })))
    return cpLines
}