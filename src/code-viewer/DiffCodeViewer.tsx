import { CSSProperties, MutableRefObject, ReactElement, useEffect, useMemo, useRef, useState } from "react"
import { BsArrowBarDown, BsArrowBarUp } from "react-icons/bs"
import { useCurrent } from "../mock-editor/react-hooks"
import "./DiffCodeViewer.css"
import { Line, LineProps } from "./Line"
import { ChangeType } from "./diff-vscode"

import "./Line.css"
import { GroupSelection } from "./select/select"

export interface ScrollOptions {
    // to adjust with sticky siblings
    adjustX?: number
    adjustY?: number

    scrollYParent?: HTMLElement
}

export interface DiffCodeViewerControler {
    scrollToIndex: (idx: number, opts?: ScrollOptions) => void
}
export function useDiffCodeViewerController(): MutableRefObject<DiffCodeViewerControler> {
    return useRef()
}

export interface DiffCodeViewerProps {
    lines?: BlockLineProps[]
    // blocks?: DiffBlock[]
    style?: CSSProperties
    className?: string


    lineStyle?: CSSProperties

    // turn on css 'full-diff' style
    // in this style, old line deleted is fully marked red(by default on header is marked red)
    fullDiff?: boolean

    // 
    hideOldCode?: boolean
    renderNewLineHoverElement?: (blockLine: BlockLineProps) => LineRenderOptions
    renderWithSelection?: (selection: CodeSelection, line: BlockLineProps) => ReactElement

    onClickExpandUp?: (block: BlockLineProps, index: number) => void
    onClickExpandDown?: (block: BlockLineProps, index: number) => void
    controlRef?: MutableRefObject<DiffCodeViewerControler>

    onSelectionChange?: (selection: CodeSelection) => void
}

function getID(block: BlockLineProps): string {
    return `${getLineID(block.line)}:${getLineID(block.collapsedLines?.at?.(0))}:${getLineID(block.collapsedLines?.at(-1))}`
}

function getLineID(block: BlockLine): string {
    return `${block?.newLine?.lineNumber || 0}:${block?.oldLine?.lineNumber || 0}`
}

const OLD_LINE_CONTENT = ".code-viewer-line-old-container .code-viewer-line-content"
const OLD_LINE_NUM = ".code-viewer-line-old-container .code-viewer-line-number"
const NEW_LINE_CONTENT = ".code-viewer-line-new-container .code-viewer-line-content"
const NEW_LINE_NUM = ".code-viewer-line-new-container .code-viewer-line-number"

export enum SelectionType {
    OLD_LINE_CONTENT = "old_line_content",
    OLD_LINE_NUM = "old_line_num",
    NEW_LINE_CONTENT = "new_line_content",
    NEW_LINE_NUM = "new_line_num",
}
export interface CodeSelection {
    selectionType: SelectionType
    lines?: number[]
}

const groups = [OLD_LINE_CONTENT, OLD_LINE_NUM, NEW_LINE_CONTENT, NEW_LINE_NUM]

export default function DiffCodeViewer(props: DiffCodeViewerProps) {
    const codeViewerRef = useRef<HTMLDivElement>()
    if (props.controlRef) {
        props.controlRef.current = {
            scrollToIndex(idx, opts?: ScrollOptions) {
                // console.log("DEBUG scrollToIndex:", idx, opts)
                if (codeViewerRef.current) {
                    // console.log("DEBUG scroll target:", codeViewerRef.current.children[idx])
                    const needAdjust = opts?.scrollYParent && (opts?.adjustY > 0 || opts?.adjustY < 0)
                    codeViewerRef.current.children[idx]?.scrollIntoView?.({ behavior: !needAdjust ? "smooth" : undefined })
                    if (needAdjust) {
                        //set timeout so that smooth behavior applies
                        opts.scrollYParent.scrollBy({ top: opts?.adjustY, /* behavior: "smooth" */ })
                        // setTimeout(() => opts.scrollYParent.scrollBy({ top: opts?.adjustY, behavior: "smooth" }), 450)
                    }
                }
            },
        }
    }

    const [selection, setSelection] = useState<CodeSelection>()

    const selectionHandlerRef = useRef<GroupSelection>()

    const linesRef = useCurrent(props.lines)
    useEffect(() => {
        const handler = new GroupSelection(() => codeViewerRef.current, groups, {
            nonSelectGroup: ".code-viewer-line-selection-ignore",
            onSelect: (group, start, end) => {
                const getRootLine = (node: Node) => {
                    while (node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if ((node as HTMLElement).classList?.contains?.("block-line")) {
                                return node
                            }
                        }
                        node = node.parentNode
                    }
                }
                const getIndex = (node: Node) => {
                    node = getRootLine(node)
                    let i = -1
                    while (node) {
                        i++
                        node = node.previousSibling
                    }
                    return i
                }
                const startIdx = getIndex(start)
                const endIdx = getIndex(end)
                // console.log("DEBUG select root:", codeViewerRef.current)
                // console.log("DEBUG select:", group, start, end)
                // console.log("DEBUG select:", group, startIdx, endIdx)
                if (!group) {
                    setSelection(undefined)
                    return
                }
                let selectionType
                let newLine = true
                if (group === NEW_LINE_CONTENT || group === NEW_LINE_NUM) {
                    if (group === NEW_LINE_CONTENT) {
                        selectionType = SelectionType.NEW_LINE_CONTENT
                    } else {
                        selectionType = SelectionType.NEW_LINE_NUM
                    }
                } else if (group === OLD_LINE_CONTENT || group === OLD_LINE_NUM) {
                    newLine = false
                    if (group === OLD_LINE_CONTENT) {
                        selectionType = SelectionType.OLD_LINE_CONTENT
                    } else {
                        selectionType = SelectionType.OLD_LINE_NUM
                    }
                } else {
                    throw new Error(`unknown group: ${group}`)
                }

                const lines = getSelectedLines(linesRef.current, startIdx, endIdx, newLine)
                setSelection({ selectionType: selectionType, lines })
            }
        })
        selectionHandlerRef.current = handler
        return () => handler.dispose()
    }, [])

    const onSelectionChangeRef = useCurrent(props.onSelectionChange)
    useEffect(() => {
        // console.log("selection change:", selection)
        // props.onchange
        if (onSelectionChangeRef.current) {
            onSelectionChangeRef.current(selection)
        }
    }, [selection])

    return <div ref={codeViewerRef} className={`code-viewer ${props.fullDiff ? "full-diff" : ""} ${props.className || ''}`} style={props.style}
        onClick={(e) => {
            // console.log("click:", e)
            if (selectionHandlerRef.current) {
                // NOTE: this is buggy
                // if we reset on click, we find that
                // every time we finish selecting, onClick gets called, so reset is called
                // making the selection ineffective
                // selectionHandlerRef.current.resetGroup()
            }
        }}
    >
        {
            props.lines?.map?.((block, i) => {
                return <RenderBlockLine
                    style={props.lineStyle}
                    key={getID(block)}
                    hideOldCode={props.hideOldCode}
                    renderNewLineHoverElement={props.renderNewLineHoverElement}
                    {...block}
                    onClickExpandDown={() => {
                        props.onClickExpandUp?.(block, i)
                    }}
                    onClickExpandUp={() => {
                        props.onClickExpandDown?.(block, i)
                    }}
                    line={{
                        ...block?.line,
                        newLine: {
                            ...block?.line?.newLine,
                            trailingElement: <>
                                {block.line?.newLine?.trailingElement}
                                {
                                    props?.renderWithSelection?.(selection, block)
                                }
                            </>
                        }
                    }}
                />
            })
        }
    </div >
}

function getSelectedLines(lines: BlockLineProps[], startIdx: number, endIdx: number, newLine: boolean): number[] {
    const list = lines.slice?.(startIdx, endIdx + 1)
    const lineNums: number[] = []
    list?.forEach?.(line => {
        if (line?.collapsed) {
            return
        }
        let num: number
        if (newLine) {
            num = line?.line?.newLine?.lineNumber
        } else {
            num = line?.line?.oldLine?.lineNumber
        }
        if (num > 0) {
            lineNums.push(num)
        }
    })
    return lineNums
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

export interface RenderBlockLineControler {
}

export function useRenderBlockLineController(): MutableRefObject<RenderBlockLineControler> {
    return useRef()
}

export interface LineRenderOptions {
    style?: CSSProperties
    // hover
    element: ReactElement
    headElement?: ReactElement
    shouldShow?: boolean

    extra?: ReactElement

    showLineThrough?: boolean
}

export interface BlockLineWithListenersProps extends BlockLineProps {
    style?: CSSProperties
    onClickExpandUp?: () => void
    onClickExpandDown?: () => void

    // watched
    renderNewLineHoverElement?: (blockLine: BlockLineProps) => LineRenderOptions

    hideOldCode?: boolean

    controlRef?: MutableRefObject<RenderBlockLineControler>
}

export function RenderBlockLine(props: BlockLineWithListenersProps) {
    const { line, collapsedLines, collapsed } = props
    const blockLineProps = useMemo(() => ({ line, collapsedLines, collapsed }), [line, collapsedLines, collapsed])

    const hoverElements = useMemo(() => {
        return props.renderNewLineHoverElement?.(blockLineProps)
    }, [props.renderNewLineHoverElement, blockLineProps])
    const { element: newLineHoverElement, shouldShow, extra, showLineThrough, headElement, style } = hoverElements || {}

    if (props.controlRef) {
        props.controlRef.current = {

        }
    }

    return <div
        className={`block-line ${props.collapsed ? "collapsed" : ""}`}
        style={{ ...props.style, ...style }}
    >
        {
            props.collapsed ? <div
                className="code-viewer-line-selection-ignore"
                style={{
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
                        }}
                        className={`code-viewer-line-old-container ${props.line?.oldLine?.className ?? ""}`}
                    />
                }
                <Line hideNumber={props.line?.newLine === undefined}
                    {...props.line?.newLine}
                    hoverElement={newLineHoverElement}
                    extraElement={extra}
                    showHoverElement={shouldShow}
                    showLineThrough={showLineThrough}
                    headElement={headElement}
                    style={{
                        // flexGrow: 1
                        width: !props.hideOldCode && "50%",
                        position: "relative",
                        ...props.line.newLine?.style,
                    }}
                    className={`code-viewer-line-new-container ${props.line?.newLine?.className ?? ""}`}
                />
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
    reloadLines: () => Promise<void>

    scrollToLine: (lineNumber: number, opts?: ScrollOptions) => void
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

    // style applied to all lines
    lineStyle?: CSSProperties

    controllerRef?: MutableRefObject<DiffCodeViewerTitledController>

    loadingPlaceholder?: any

    // watched
    loadLines?: () => Promise<BlockLineProps[]>
    watchLoadLines?: boolean

    // for code viewer
    codeViewerStyle?: CSSProperties
    codeViewerClassName?: string
    fullDiff?: boolean
    hideOldCode?: boolean
    renderNewLineHoverElement?: (blockLine: BlockLineProps) => LineRenderOptions
    renderWithSelection?: (selection: CodeSelection, line: BlockLineProps) => ReactElement
}
export function DiffCodeViewerTitled(props: DiffCodeViewerTitledProps) {
    const [loaded, setLoaded] = useState(false)
    const [lines, setLines] = useState<BlockLineProps[]>([])

    const titleRef = useRef<HTMLDivElement>()

    const codeViewController = useDiffCodeViewerController()

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
            },
            scrollToLine(lineNumber, opts?: ScrollOptions) {
                // console.log("shit scrollToLine:", lineNumber)
                if (!(lineNumber >= 0)) {
                    return
                }
                const { newLines, index } = ensureLineVisible(lines, lineNumber, false)
                if (newLines) {
                    setLines(newLines)
                }
                // TODO: add splash
                if (index >= 0) {
                    if (codeViewController.current) {
                        setTimeout(() => {
                            let height = titleRef.current?.getClientRects?.()?.[0].height
                            // adjust the sticky title
                            const titleAdjustY = height > 0 ? -height : 0
                            // if scrollable is parent, titleAdjustY should be set
                            // const titleAdjustY = 0

                            // console.log("titleAdjustY:", titleAdjustY)
                            // console.log("scrollYParent:", opts?.scrollYParent)
                            const optsAdjustY = opts?.adjustY > 0 || opts?.adjustY < 0 ? opts.adjustY : 0
                            const nextOpts = { scrollYParent: opts?.scrollYParent, adjustY: titleAdjustY + optsAdjustY }
                            codeViewController.current.scrollToIndex(index, nextOpts)
                        }, 10)
                    }
                }
            },
        }
    }

    return <div style={props.style} className={props.className}>
        {/* title */}
        <div style={props.titleStyle} className={props.titleClassName} ref={titleRef}>
            <span style={{ fontWeight: "bold" }}>{props.title}</span>
        </div>
        {
            !loaded && props.loadingPlaceholder
        }
        <DiffCodeViewer
            controlRef={codeViewController}
            style={{
                // fontSize: "13px", // like gitlab
                fontSize: "85%",
                ...props.codeViewerStyle
            }}
            className={props.className}
            lines={lines}
            lineStyle={props.lineStyle}
            fullDiff={props.fullDiff}
            hideOldCode={props.hideOldCode}
            renderNewLineHoverElement={props.renderNewLineHoverElement}
            renderWithSelection={props.renderWithSelection}
            onClickExpandUp={(block, i) => {
                setLines(expandLinesByIndex(lines, block, i, true))
            }}
            onClickExpandDown={(block, i) => {
                setLines(expandLinesByIndex(lines, block, i, false))
            }}
        />
    </div>
}

// findLineIndex returns i as primary index, j as secondary index to where the line actual 
// collapsed. if j==-1, the line is not collapsed
function findLineIndex(lines: BlockLineProps[], lineNumber: number): [i: number, j: number] {
    const n = lines?.length || 0
    for (let i = 0; i < n; i++) {
        const line = lines[i]
        if (line.line?.newLine?.lineNumber === lineNumber) {
            return [i, -1]
        }
        const m = line.collapsedLines?.length || 0
        for (let j = 0; j < m; j++) {
            const subLine = line.collapsedLines[j]
            if (subLine.newLine?.lineNumber === lineNumber) {
                return [i, j]
            }
        }
    }
    return [-1, -1]
}

function ensureLineVisible(lines: BlockLineProps[], lineNumber: number, up: boolean): { newLines?: BlockLineProps[], index: number } {
    // debugger
    const [i, j] = findLineIndex(lines, lineNumber)
    // console.log("find index:", i, j)
    if (!(i >= 0)) {
        return { index: -1 }
    }
    // if already expanded, don't expand again
    if (!(j >= 0)) {
        return { index: i }
    }

    // i>=0 && j>=0, meaning collapsed lines
    // collapsed lines are slots

    const cpLines = [...lines]
    const line = lines[i]

    const before = line.collapsedLines.slice(0, j)
    const after = makeCollapsedLines(line.collapsedLines.slice(j), 3)
    let nextIndex: number = -1
    if (before.length === 0) {
        cpLines.splice(i, 1, ...after)
        nextIndex = i
    } else if (before.length === 1) {
        cpLines[i] = { line: before[0] }
        cpLines.splice(i + 1, 0, ...after)
        nextIndex = i + 1
    } else {
        cpLines[i] = { ...cpLines[i], collapsedLines: before }
        cpLines.splice(i + 1, 0, ...after)
        nextIndex = i + 1
    }

    return { newLines: cpLines, index: nextIndex }
}

function makeCollapsedLines(lines: BlockLine[], visibleCount: number): BlockLineProps[] {
    if (!lines?.length) {
        return []
    }
    if (!(lines?.length > visibleCount)) {
        return lines.map(e => ({ line: e }))
    }
    const list: BlockLineProps[] = lines.slice(0, visibleCount).map(e => ({ line: e }))
    // last one collapsed
    list.push({ collapsedLines: lines.slice(visibleCount), collapsed: true })
    return list
}

const collapseLineCount = 20
// const collapseLineCount = 1
// `idx` represents index, not line number
function expandLinesByIndex(lines: BlockLineProps[], block: BlockLineProps, idx: number, up: boolean): BlockLineProps[] {
    // debugger
    const cpLines = [...lines]
    const keepSome = block.collapsedLines?.length > collapseLineCount
    let expandedLines: BlockLine[]
    let stillCollapsedLines: BlockLine[]
    let insertBeforeIdx = idx
    if (!keepSome) {
        // totally removed
        expandedLines = block.collapsedLines
        stillCollapsedLines = []
    } else if (up) {
        expandedLines = block.collapsedLines.slice(block.collapsedLines.length - collapseLineCount)
        stillCollapsedLines = block.collapsedLines.slice(0, block.collapsedLines.length - collapseLineCount)
        // don't mess line orders
        insertBeforeIdx = idx + 1
    } else {
        expandedLines = block.collapsedLines.slice(0, collapseLineCount)
        stillCollapsedLines = block.collapsedLines.slice(collapseLineCount)
    }

    if (stillCollapsedLines.length) {
        // replace with new block
        cpLines.splice(idx, 1, { ...block, collapsedLines: [...stillCollapsedLines] })
    } else {
        // when no lines left, remove the collapse info
        cpLines.splice(idx, 1)
    }

    // insert new lines
    // splice insertion is insertion before, not after
    // > a=[1,2,3,4]
    // [ 1, 2, 3, 4 ]
    // > a.splice(1,0,4)
    // []
    // > a
    // [ 1, 4, 2, 3, 4 ]
    cpLines.splice(insertBeforeIdx, 0, ...expandedLines?.map?.(e => ({ line: e })))
    return cpLines
}