import { CSSProperties, useEffect, useState } from "react"
import { useCurrent } from "../react-hooks"


export interface CheckboxProps {
    value?: boolean
    onChange?: (valeu: boolean) => void
    label?: string
    style?: CSSProperties
    className?: string
}

export default function (props: CheckboxProps) {
    const [checked, setChecked] = useState(props.value)

    useEffect(() => {
        setChecked(props.value)
    }, [props.value])

    const changeRef = useCurrent(props.onChange)
    useEffect(() => {
        changeRef.current?.(checked)
    }, [checked])

    return <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        ...props.style
    }} className={props.className} >
        <input type="checkbox" checked={checked} onChange={e => {
            setChecked(e.target.checked)
        }} />
        <label
            style={{ marginLeft: "2px" }}
            onClick={() => {
                setChecked(!checked)
            }}>{props.label}</label>
    </div >
}