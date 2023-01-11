import { editor } from "monaco-editor"
import { CSSProperties, useEffect, useMemo, useState } from "react"
import Code, { useCodeControl } from "../support/components/v2/Code"
import { FileDetailGetter } from "../support/support/file"
import { useCurrent } from "./react-hooks"


export interface TextEditorProps {
    value?: string
    onChange?: (value: string) => void
    language?: string
    style?: CSSProperties
    readonly?: boolean
    onEditorCreated?: (editor: editor.IStandaloneCodeEditor) => void
    editorRef?: React.MutableRefObject<editor.IStandaloneCodeEditor>
}

let codeId = 1
export default function (props: TextEditorProps) {
    const codeID = useMemo(() => {
        return `code_editor_${codeId++}`
    }, [])

    const [value, setValue] = useState(props.value)

    const controlRef = useCodeControl()

    // just return the initial value
    const fd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                return { content: props.value || "", language: props.language }
            },
        }
    }, [])

    const valueRef = useCurrent(value)
    useEffect(() => {
        if (props.value !== valueRef.current) {
            controlRef.current?.setContent?.(props.value || "")
        }
    }, [props.value])


    return <Code
        containerStyle={{
            height: "200px",
            width: "100%",
            ...props.style,
        }}
        file={codeID}
        fileDetailGetter={fd}
        onContentChange={(value) => {
            setValue(value)
            props.onChange?.(value)
        }}
        controlRef={controlRef}
        readonly={!!props.readonly}
        onEditorCreated={props.onEditorCreated}
        editorRef={props.editorRef}
    />
}