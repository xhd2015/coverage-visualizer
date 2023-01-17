import { CSSProperties, useRef } from "react"
import "./Popup.css"

export interface PopupProps {
    style?: CSSProperties
    className?: string
    children?: any

    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}
export default function (props: PopupProps) {
    return <div className="mock-editor-popup-container" style={props.style} onKeyDown={props.onKeyDown}>
        {
            props.children
        }
    </div>
}