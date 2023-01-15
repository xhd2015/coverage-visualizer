import { CSSProperties, useRef } from "react"
import "./Popup.css"

export interface PopupProps {
    style?: CSSProperties
    className?: string
    children?: any
}
export default function (props: PopupProps) {
    return <div className="mock-editor-popup-container">
        {
            props.children
        }
    </div>
}