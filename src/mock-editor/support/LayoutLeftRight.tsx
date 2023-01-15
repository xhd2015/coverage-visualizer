import { CSSProperties, useEffect, useRef, MutableRefObject } from "react"
import { onRootResize } from "../context"
import { useCurrent } from "../react-hooks"

export interface LayoutLeftRightProps {
    rootStyle?: CSSProperties
    rootClassName?: string

    leftStyle?: CSSProperties
    leftClassName?: string

    rightStyle?: CSSProperties
    rightClassName?: string

    leftChild?: any
    rightChild?: any

    leftHeightMatchRight?: boolean

    // layoutRef?: MutableRefObject<(() => void) | undefined>
    watchRootResize?: boolean
    onLeftResize?: () => void
    // onRightResize?: () => void
}
export default function (props: LayoutLeftRightProps) {
    const rootRef = useRef<HTMLDivElement>()
    const leftDivRef = useRef<HTMLDivElement>()
    const rightDivRef = useRef<HTMLDivElement>()

    const onInitRef = useCurrent(props.onInit)


    const onLeftResize = useCurrent(props.onLeftResize)
    useEffect(() => {
        const adjust = () => {
            // why window.requestAnimationFrame?
            // see https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
            window.requestAnimationFrame(() => {
                const rootWidth = rootRef.current.getBoundingClientRect().width
                const traceListWidth = leftDivRef.current.getBoundingClientRect().width

                rightDivRef.current.style.width = (rootWidth - traceListWidth) + "px"
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
    }, [])

    useEffect(() => {
        if (!props.leftHeightMatchRight) {
            return
        }
        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                const rightHeight = rightDivRef.current.getBoundingClientRect().height
                leftDivRef.current.style.height = rightHeight + "px"
            })
        })
        observer.observe(rightDivRef.current)
        return () => observer.disconnect() // unobserve all
    }, [props.leftHeightMatchRight])

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