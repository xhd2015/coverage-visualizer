import { CSSProperties, useEffect, useRef } from "react"
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

    onLeftResize?: () => void
    // onRightResize?: () => void
}
export default function (props: LayoutLeftRightProps) {
    const rootRef = useRef<HTMLDivElement>()
    const leftDivRef = useRef<HTMLDivElement>()
    const rightDivRef = useRef<HTMLDivElement>()

    const onLeftResize = useCurrent(props.onLeftResize)
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            // why window.requestAnimationFrame?
            // see https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
            window.requestAnimationFrame(() => {
                const rootWidth = rootRef.current.getBoundingClientRect().width
                const traceListWidth = leftDivRef.current.getBoundingClientRect().width

                rightDivRef.current.style.width = (rootWidth - traceListWidth) + "px"
                onLeftResize.current?.()
            })
        })
        observer.observe(leftDivRef.current)
        return () => observer.disconnect() // unobserve all
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