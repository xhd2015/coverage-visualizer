import { CSSProperties, useRef, useEffect } from "react"
import { attachMouseEvents } from "./mouse"
import { useCurrent } from "../../../mock-editor/react-hooks"


interface DragBarProps {
    style?: CSSProperties
    className?: string
    onRef?: (e: HTMLDivElement) => void

    selfIndex?: number
    getSiblings?: () => HTMLDivElement[]

    resizeHeight?: boolean // default horizontal
    setSiblingsWidth?: (widths: number[]) => void
    setSiblingsHeight?: (heights: number[]) => void
}
export function DragBar(props: DragBarProps) {
    const ref = useRef<HTMLDivElement>()

    const propsRef = useCurrent(props)
    useEffect(() => {
        if (props.onRef) {
            props.onRef(ref.current)
        }
        let pageX: number
        let widths: number[]

        let pageY: number
        let heights: number[]

        let savedUserSelect

        const getWidth = (e: HTMLElement): number => {
            return e.getBoundingClientRect().width
        }
        const getHeight = (e: HTMLElement): number => {
            return e.getBoundingClientRect().height
        }
        return attachMouseEvents(ref.current, {
            onMouseOver(e) {
                if (props.resizeHeight) {
                    e.target.style.borderTop = "2px solid #40a9ff"
                } else {
                    e.target.style.borderRight = "2px solid #40a9ff"
                }
            },
            onMouseOut(e) {
                if (props.resizeHeight) {
                    e.target.style.borderTop = ""
                } else {
                    e.target.style.borderRight = ""
                }
            },
            onMouseDown(e) {
                pageX = e.pageX
                pageY = e.pageY
                document.body.style.userSelect = savedUserSelect
                document.body.style.userSelect = "none"

                const siblings = propsRef.current?.getSiblings?.()
                widths = siblings.map(e => getWidth(e))
                heights = siblings.map(e => getHeight(e))
            },
            onMouseMove(e) {
                const diffX = e.pageX - pageX
                const diffY = e.pageY - pageY
                let newWidths = [...widths]
                let newHeights = [...heights]

                const selfIndex = propsRef.current.selfIndex
                if (selfIndex > 0) {
                    newWidths[selfIndex - 1] += diffX
                    newHeights[selfIndex - 1] += diffY
                }
                if (selfIndex + 1 < newWidths.length) {
                    newWidths[selfIndex + 1] -= diffX
                    newHeights[selfIndex + 1] -= diffY
                }
                function makePositive(arr: number[]) {
                    return arr.map(e => {
                        if (!(e > 0)) {
                            return 10
                        }
                        return e
                    })
                }
                newWidths = makePositive(newWidths)
                newHeights = makePositive(newHeights)
                if (props.resizeHeight) {
                    propsRef.current.setSiblingsHeight?.(newHeights)
                } else {
                    propsRef.current.setSiblingsWidth?.(newWidths)
                }
            },
            onMouseUp(e) {
                let val = savedUserSelect
                if (val === undefined) {
                    val = "initial"
                }
                document.body.style.userSelect = val
            },
        })
    }, [])

    return <div
        style={props.style}
        className={props.className}
        ref={ref}
    >
    </div>
}