import { useEffect, useMemo, useState } from "react";
import { useCurrent } from "../react-hooks";


export interface RadioGroupProps<T> {
    options?: T[]
    value?: T
    onChange?: (option: T) => void
    // defaultValue?: T // if value not found

    // initialIndex?: number
    // onChangeIndex?: (idx: number) => void
}
export default function RadioGroup<T extends string>(props: RadioGroupProps<T>) {
    const valueIndex = useMemo(() => {
        // if (props.initialIndex !== undefined) {
        //     return props.initialIndex
        // }
        if (props.value === undefined) {
            return -1
        }
        for (let i = 0; i < props.options?.length; i++) {
            if (props.options[i] === props.value) {
                return i
            }
        }
    }, [props.options, props.value, /* props.initialIndex */])
    const [idx, setIdx] = useState(valueIndex)

    const optionsRef = useCurrent(props.options)
    const onChangeRef = useCurrent(props.onChange)
    // const onChangeIdxRef = useCurrent(props.onChangeIndex)

    useEffect(() => {
        onChangeRef.current?.(optionsRef.current?.[idx])
        // onChangeIdxRef.current?.(idx)
    }, [idx])

    useEffect(() => setIdx(valueIndex), [valueIndex])

    return <>{props.options?.map?.((opt, i) => <div key={`${opt}_${i}`}>
        <input
            type="radio"
            // key={`${opt}_${i}_input`}
            checked={idx === i}
            onChange={e => {
                if (e.target.checked) {
                    setIdx(i)
                }
            }}
            style={{ marginLeft: "4px" }}
        />
        <label
            // key={`${opt}_${i}_label`}
            style={{ marginLeft: "2px" }}
            onClick={e => {
                setIdx(i)
            }}>{opt}</label>
    </div>)}</>
}