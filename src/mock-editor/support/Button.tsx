import { CSSProperties, useState } from "react"
import "./Button.css"

export interface ButtonProps {
    disabled?: boolean
    loading?: boolean
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void> | void

    autoDisable?: boolean

    style?: CSSProperties
    className?: string
    children?: any
}

export default function (props: ButtonProps) {
    const [disabled, setDisabled] = useState(props.disabled)
    return <button
        className={`${props.className || ""} ${props.loading ? "button--loading" : ""}`}
        style={props.style}
        disabled={props.loading || disabled}
        onClick={e => {
            if (!props.onClick) {
                return
            }
            if (!props.autoDisable) {
                props.onClick?.(e)
                return
            }
            setDisabled(true);
            ; (async () => props.onClick(e))().finally(() => {
                setDisabled(false)
            })
        }}
    >{props.children}</button>
}