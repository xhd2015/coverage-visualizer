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

    onLeftResize?: () => void
}
export default function (props: LayoutLeftRightProps) {
    const rootRef = useRef<HTMLDivElement>()
    const traceListRootDivRef = useRef<HTMLDivElement>()
    const mockContentRootDivRef = useRef<HTMLDivElement>()

    const onLeftResize = useCurrent(props.onLeftResize)
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            const rootWidth = rootRef.current.getBoundingClientRect().width
            const traceListWidth = traceListRootDivRef.current.getBoundingClientRect().width

            mockContentRootDivRef.current.style.width = (rootWidth - traceListWidth) + "px"
            onLeftResize.current?.()
        })
        observer.observe(traceListRootDivRef.current)
        return () => observer.disconnect() // unobserve all
    }, [])

    return <div style={{
        display: "flex",
        ...props.rootStyle
        // justifyContent: 'center'
    }}
        className={props.rootClassName}
        ref={rootRef}
    >
        <div style={props.leftStyle} className={props.leftClassName} ref={traceListRootDivRef}>
            {props.leftChild}
        </div>
        <div style={{
            // width: "600px" 
            flexGrow: "1",
            ...props.rightStyle,
        }}
            className={props.rightClassName}
            ref={mockContentRootDivRef}
        >
            {props.rightChild}
        </div>
    </div>
}