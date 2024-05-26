// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from "react";
import { FileDetailGetter, ITreeNode } from "../../support/file";
import { BiExpandAlt } from "react-icons/bi"

import { CurrentRef, useCurrent } from "../../../mock-editor/react-hooks";
import { ContentDecorator, normalizeCodeContent, useMonacoModel } from "./model";

import "./code.css"
// import "../../monaco-tree/monaco-editor-v0.20.0/esm/vs/base/browser/ui/codiconLabel/codicon/codicon.css"
// import "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css"

// import loaders just not working
// import "./fix-icons.css"

// however import tff via ts works
import "./load-monaco-tff"

export interface RenderTarget {
    monacoIconLabel: { title: string }
    label: HTMLElement
}
export interface RenderFile {
    path: string
    name: string
}

// export interface PathDecorator {
//     // optional
//     renderPath?: (target: RenderTarget, file: RenderFile) => Promise<void>
// }

export interface CodeFileTree {
    getRoot(): Promise<ITreeNode>
    // optional refresh
    refresh?: () => Promise<void>
}

export interface Control {
    notifyFileChanged: () => Promise<void>
    updateContent: () => Promise<void>
    updateOldContent: () => Promise<void>

    setContent: (content: string) => void
}

export function useCodeControl(): MutableRefObject<Control> {
    return useRef<Control>()
}

export interface IProps {
    file?: string
    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator

    // deprecated use controlRef
    control?: Control
    controlRef?: MutableRefObject<Control>

    containerStyle?: CSSProperties
    containerClassName?: string
    readonly?: boolean

    editorRef?: MutableRefObject<monaco.editor.IStandaloneCodeEditor>

    onEditorCreated?: (editor: monaco.editor.IStandaloneCodeEditor) => void
    onContentChange?: (content: string) => void

    showExpandIcon?: boolean // true=>show expand,false=> show collapse, undefined don't show
    onClickExpand?: () => void
    top?: any // element on top

    initContent?: string
}

// a global map: editor => config
// if one is put on top, its value gets applied
// editor does not interfere with others
// put who on top
function setEditorDiagnose(editor: monaco.editor.IStandaloneCodeEditor,) {

}
function setOnTop(editor: monaco.editor.IStandaloneCodeEditor) {

}
// Code will automatically resize based on container dynamic size:
// a typical usage is to use Code inside a flex-column container, where declare flexBasis as 50%, then set
// flex-shrink and flex-grow to 1, and set Code's height to 100% to flow the flex container:
// 
//  <Code  containerStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%" }} style={{ height: "100%" }}/>
//  <Code  containerStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: "50%" }} style={{ height: "100%" }}/>

// Code as a central registry
export default function Code(props: IProps) {
    const modelRefreshRef = useRef<() => any>()
    const [editor, setEditor] = useState(null as monaco.editor.IStandaloneCodeEditor)
    const [version, setVersion] = useState(0)

    const editorRef = useCurrent(editor)
    const model = useMonacoModel({
        editor: editor,
        uriPrefix: "code/",
        file: props.file,
        fileDetailGetter: props.fileDetailGetter,
        contentDecorator: props.contentDecorator,

        refreshDecorations: modelRefreshRef,
        readonly: props.readonly,
    })

    // for debug
    // useEffect(() => {
    //     console.log("file change:", props.file)
    // }, [props.file])

    const versionRef = useCurrent(version)
    useEffect(() => {
        // debug
        // console.log("may file update:", props.file)
        setVersion(versionRef.current + 1)
    }, [props.file, model])

    // apply model
    useEffect(() => {
        // console.log("DEBUG version change:", version, model?.fileKey, model, editorRef.current)
        if (model && model.model && !model.model.isDisposed()) {
            editorRef.current.setModel?.(model.model)
            // apply diff model

            // debug
            // console.log("refresh models:", version)

            modelRefreshRef?.current?.()
            // don't set null, we want remain when loading
            // return () => diffEditor?.setModel?.(null)
        }
        // comment the following code,remain still
        // else {
        //     diffEditor?.setModel?.(null)
        // }
    }, [version])

    if (props.control) {
        // props.control.updateContent = updateContent
        // props.control.updateOldContent = updateOldContent
        props.control.setContent = (content) => {
            editor.getModel().setValue(normalizeCodeContent(content))
        }

    }
    if (props.controlRef) {
        props.controlRef.current = {
            setContent: (content) => {
                const c = normalizeCodeContent(content)
                editor.setValue(c)
                // setTimeout(() => editor.setValue(c), 20)
                // editor.getModel().setValue(normalizeCodeContent(content))
            }
        } as Control
    }

    const containerRef = useRef<HTMLDivElement>()

    const onContentChangeRef = useCurrent(props.onContentChange)

    const onEditorCreatedRef = useCurrent(props.onEditorCreated)
    // create monaco on mount
    useEffect(() => {
        const editor = createAutoLayoutEditor(containerRef.current, props.initContent, {
            onContentChangeRef: onContentChangeRef,
            editorRef: props.editorRef,
            onEditorCreatedRef: onEditorCreatedRef,
        })
        setEditor(editor)
        setupEditorAutoLayout(editor, () => {
            if (props.editorRef != null) {
                props.editorRef.current = undefined
            }
        })
    }, [])

    return <div
        // id="debug" // NOTE: the editor will auto layout based on parent height
        style={{
            position: "relative",
            ...props.containerStyle,
            // height: undefined,
            // width: "500px",
        }} className={`code-container ${props.containerClassName || ""}`} >
        {
            props.showExpandIcon && <div className="code-container-zoom">
                <BiExpandAlt style={{ cursor: "pointer" }} onClick={() => {
                    props.onClickExpand?.()
                }} />
            </div>
        }
        {
            props.top
        }

        <div
            ref={containerRef}
            className="code-container"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        />
    </ div>
}

function createAutoLayoutEditor(containerEl: HTMLElement, value: string | undefined, opts?: {
    onContentChangeRef?: CurrentRef<(value: string) => void>
    editorRef?: MutableRefObject<monaco.editor.IStandaloneCodeEditor>
    onEditorCreatedRef?: MutableRefObject<(editor: monaco.editor.IStandaloneCodeEditor) => void>
}): monaco.editor.IStandaloneCodeEditor {
    const editor = monaco.editor.create(
        containerEl,
        {
            readOnly: false,
            scrollbar: {
                // see this, make scroll propagate to
                // parent possible:
                // https://github.com/microsoft/monaco-editor/issues/1853#issuecomment-593484147
                alwaysConsumeMouseWheel: false,
            },
            automaticLayout: true,
        }
    );
    if (value !== undefined) {
        editor.setValue(value)
    }

    editor.onDidChangeModelContent(() => {
        if (opts?.onContentChangeRef?.current != null) {
            opts.onContentChangeRef.current?.(editor.getValue())
        }
    })

    editor.layout()

    if (opts?.editorRef != null) {
        opts.editorRef.current = editor
    }
    if (opts?.onEditorCreatedRef?.current != null) {
        opts.onEditorCreatedRef.current?.(editor)
    }

    return editor
}

function setupEditorAutoLayout(editor: monaco.editor.IStandaloneCodeEditor, onDispose: () => void) {
    const handler = (e) => {
        editor.layout()
    }
    // resize
    window.addEventListener('resize', handler);
    return () => {
        window.removeEventListener('resize', handler)
        editor.dispose()
        if (onDispose != null) {
            onDispose()
        }
    }
}