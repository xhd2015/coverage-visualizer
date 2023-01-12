import { CSSProperties, useEffect, useState } from "react"
import { AiOutlineEdit, AiOutlineCheck } from "react-icons/ai"
import { useCurrent } from "../react-hooks"

export interface EditableTextProps {
    edit?: boolean

    value?: string
    onChange?: (value: string) => void

    viewStyle?: CSSProperties
    viewClassName?: string
}

export default function (props: EditableTextProps) {
    const [edit, setEdit] = useState(props.edit)
    const [value, setValue] = useState(props.value)

    const onChangeRef = useCurrent(props.onChange)
    useEffect(() => {
        onChangeRef.current?.(value)
    }, [value])

    useEffect(() => setValue(props.value), [props.value])

    return <div style={{ display: "flex", alignItems: "center" }}>{
        edit ? <input className={props.viewClassName} style={props.viewStyle} value={value} onChange={e => {
            setValue(e.target.value)
        }} /> : <div className={props.viewClassName} style={props.viewStyle}>{value}</div>
    }
        {
            edit ? <AiOutlineCheck
                style={{ cursor: "pointer" }}
                onClick={() => {
                    setEdit(!edit)
                }} /> : <AiOutlineEdit
                style={{ cursor: "pointer" }}
                onClick={() => {
                    setEdit(!edit)
                }} />
        }
    </div>
}