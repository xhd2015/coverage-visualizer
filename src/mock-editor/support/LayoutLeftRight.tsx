import { CSSProperties, useEffect, useRef, MutableRefObject } from "react"
import { onRootResize } from "../context"
import { useCurrent } from "../react-hooks"

export interface LayoutLeftRightController {
    resizeLeft: (width: number) => void
}
export function useLayoutLeftRightController(): MutableRefObject<LayoutLeftRightController> {
    return useRef()
}

export interface LayoutLeftRightProps {
    debugName?: string

    rootStyle?: CSSProperties
    rootClassName?: string

    leftStyle?: CSSProperties
    leftClassName?: string

    rightStyle?: CSSProperties
    rightClassName?: string

    leftChild?: any
    rightChild?: any

    controllerRef?: MutableRefObject<LayoutLeftRightController>

    leftHeightMatchRight?: boolean

    leftRef?: MutableRefObject<HTMLDivElement>
    rightRef?: MutableRefObject<HTMLDivElement>

    // layoutRef?: MutableRefObject<(() => void) | undefined>
    watchLeftResize?: boolean // default true
    watchRootResize?: boolean
    onLeftResize?: () => void
    // onRightResize?: () => void
}

function paddingDiff(e: HTMLElement): number {
    if (getStyleVal(e, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padLeft = getStyleVal(e, 'padding-left');
    var padRight = getStyleVal(e, 'padding-right');
    return (parseInt(padLeft) + parseInt(padRight));
}

function getStyleVal(elm, css) {
    return (window.getComputedStyle(elm, null).getPropertyValue(css))
}

export default function (props: LayoutLeftRightProps) {
    const rootRef = useRef<HTMLDivElement>()
    const leftDivRef = useRef<HTMLDivElement>()
    const rightDivRef = useRef<HTMLDivElement>()

    const autoSizeRight = (width?: number) => {
        const rootWidth = rootRef.current.getBoundingClientRect().width
        const leftWidth = width > 0 ? width : leftDivRef.current.getBoundingClientRect().width

        const leftPadding = paddingDiff(leftDivRef.current)
        const rightPadding = paddingDiff(rightDivRef.current)
        // const leftPadding = 0
        // const rightPadding = 0
        leftDivRef.current.style.width = width + "px"
        rightDivRef.current.style.width = (rootWidth - leftWidth - leftPadding - rightPadding) + "px"
    }

    // const onInitRef = useCurrent(props.onInit)
    const onLeftResize = useCurrent(props.onLeftResize)
    useEffect(() => {
        if (props.watchLeftResize === false) {
            return
        }
        const adjust = () => {
            // why window.requestAnimationFrame?
            // see https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
            window.requestAnimationFrame(() => {
                autoSizeRight()
                // const rootWidth = rootRef.current.getBoundingClientRect().width
                // const leftWidth = leftDivRef.current.getBoundingClientRect().width
                // // const leftPadding = paddingDiff(leftDivRef.current)
                // // const rightPadding = paddingDiff(rightDivRef.current)
                // const leftPadding = 0
                // const rightPadding = 0

                // console.log("DEBUG setting right: ", props.debugName, (rootWidth - leftWidth - leftPadding - rightPadding) + "px")
                // rightDivRef.current.style.width = (rootWidth - leftWidth - leftPadding - rightPadding) + "px"
                onLeftResize.current?.()
            })
        }
        let close = () => { }
        if (props.watchRootResize) {
            close = onRootResize(adjust)
        }

        // adjust immeidately on load
        // adjust()

        const observer = new ResizeObserver(adjust)
        observer.observe(leftDivRef.current)
        return () => {
            observer.disconnect() // unobserve all
            close?.()
        }
    }, [props.watchLeftResize])

    // useEffect(() => {
    //     autoSizeRight()
    // }, [])

    // left height match right
    useEffect(() => {
        if (!props.leftHeightMatchRight) {
            return
        }
        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                if (rightDivRef.current) {
                    const rightHeight = rightDivRef.current.getBoundingClientRect().height
                    leftDivRef.current.style.height = rightHeight + "px"
                }
            })
        })
        observer.observe(rightDivRef.current)
        return () => observer.disconnect() // unobserve all
    }, [props.leftHeightMatchRight])

    if (props.controllerRef) {
        props.controllerRef.current = {
            resizeLeft(width) {
                leftDivRef.current.style.width = width + "px"
                autoSizeRight(width)
            },
        }
    }
    useEffect(() => {
        if (props.leftRef) {
            props.leftRef.current = leftDivRef.current
        }
        if (props.rightRef) {
            props.rightRef.current = rightDivRef.current
        }
    })

    return <div style={{
        display: "flex",
        ...props.rootStyle
        // justifyContent: 'center'
    }}
        className={props.rootClassName}
        ref={rootRef}
    >
        <div style={props.leftStyle} className={props.leftClassName} ref={leftDivRef}>
            {props.leftChild}
        </div>
        <div style={{
            // width: "600px" 
            flexGrow: "1",
            ...props.rightStyle,
        }}
            className={props.rightClassName}
            ref={rightDivRef}
        >
            {props.rightChild}
        </div>
    </div>
}