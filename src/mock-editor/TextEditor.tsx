import { editor } from "monaco-editor"
import { CSSProperties, useEffect, useMemo, useState } from "react"
import Code, { useCodeControl } from "../support/components/v2/Code"
import { FileDetailGetter } from "../support/support/file"
import { useCurrent } from "./react-hooks"
import Popup from "./support/Popup"
import { AiOutlineCloseCircle } from "react-icons/ai"


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
    const [expanded, setExpanded] = useState(false)

    const valueRef = useCurrent(value)
    const controlRef = useCodeControl()

    // just return the initial value
    const fd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                return { content: valueRef.current || "", language: props.language }
            },
        }
    }, [])

    useEffect(() => {
        if (props.value !== valueRef.current) {
            controlRef.current?.setContent?.(props.value || "")
        }
    }, [props.value])

    return <div id="debug">
        <Code
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
            showExpandIcon
            onClickExpand={() => {
                setExpanded(!expanded)
            }}
        />{
            expanded && <Popup>
                <Code
                    containerStyle={{
                        width: "80%",
                        marginTop: "100px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        height: "600px",
                    }}
                    file={`${codeID}_popup`}
                    // initContent={value}
                    fileDetailGetter={fd}
                    readonly={!!props.readonly}
                    onContentChange={(value) => {
                        setValue(value)

                        // propagate the value to the other side
                        controlRef.current?.setContent?.(value)
                        props.onChange?.(value)
                    }}
                    top={
                        <div style={{
                            backgroundColor: "black",
                            display: "flex",
                            justifyContent: "flex-end"
                        }}>
                            <AiOutlineCloseCircle style={{ cursor: "pointer", marginLeft: "auto", backgroundColor: "white" }} onClick={() =>
                                setExpanded(false)
                            } />
                        </div>
                    }
                />
            </Popup>
        }
    </div>
}