import { CSSProperties, useEffect, useRef, useState } from "react"
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

    useEffect(() => {
        inputRef.current.checked = !!props.value
    }, [props.value])

    const inputRef = useRef<HTMLInputElement>()
    const checkedRef = useCurrent(checked)

    useEffect(() => {
        inputRef.current.checked = !!checkedRef.current
    }, [])

    return <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        ...props.style
    }} className={props.className} >
        <input type="checkbox" onChange={e => {
            setChecked(e.target.checked)
        }} ref={inputRef} />
        <label
            style={{ marginLeft: "2px" }}
            onClick={() => {
                setChecked(!checked)
            }}>{props.label}</label>
    </div >
}