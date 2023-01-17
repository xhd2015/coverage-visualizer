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

    // when ever changed, we will call it
    // on all editors
    editorConfigurer?: (editor: editor.IStandaloneCodeEditor, created: boolean) => void

    containerStyle?: CSSProperties
    children?: any
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

    const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>()
    const [popupEditor, setPopupEditor] = useState<editor.IStandaloneCodeEditor>()

    // just return the initial value
    const fd = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                return { content: valueRef.current || "", language: props.language }
            },
        }
    }, [])
    const fdPopup = useMemo((): FileDetailGetter => {
        return {
            async getDetail(filename) {
                return { content: valueRef.current || "", language: props.language }
            },
        }
    }, [])

    useEffect(() => {
        if (props.value !== valueRef.current && controlRef.current) {
            controlRef.current?.setContent?.(props.value || "")
        }
    }, [props.value])

    const editorConfigurerRef = useCurrent(props.editorConfigurer)
    const editorRef = useCurrent(editor)
    const popupEditorRef = useCurrent(popupEditor)
    useEffect(() => {
        if (!props.editorConfigurer) {
            return
        }
        if (editorRef.current) {
            props.editorConfigurer(editorRef.current, false)
        }
        if (popupEditorRef.current) {
            props.editorConfigurer(popupEditorRef.current, false)
        }
    }, [props.editorConfigurer])

    return <div style={props.containerStyle}>
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
            onEditorCreated={e => {
                props.onEditorCreated?.(e)
                setEditor(e)

                editorConfigurerRef.current?.(e, true)
                e.onDidFocusEditorWidget(() => editorConfigurerRef.current?.(e, false))
            }}
            editorRef={props.editorRef}
            showExpandIcon
            onClickExpand={() => {
                setExpanded(!expanded)
            }}
        />{
            expanded && <Popup onKeyDown={e => {
                console.log("keydown:", e)
                if (e.key === 'Escape') {
                    setExpanded(false)
                }
            }}>
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
                    fileDetailGetter={fdPopup}
                    readonly={!!props.readonly}
                    onEditorCreated={e => {
                        // editorConfigurerRef.current?.(editor, true)
                        setPopupEditor(e)

                        editorConfigurerRef.current?.(e, true)
                        e.onDidFocusEditorWidget(() => editorConfigurerRef.current?.(e, false))
                    }}
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
                            <AiOutlineCloseCircle style={{ cursor: "pointer", marginLeft: "auto", backgroundColor: "white" }} onClick={() => {
                                // (window as any).DebugEditor = editorRef.current
                                setExpanded(false)
                            }} />
                        </div>
                    }
                />
            </Popup>
        }
        {
            props.children
        }

    </div>
}