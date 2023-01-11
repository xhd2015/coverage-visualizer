// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { CSSProperties, MutableRefObject, useEffect, useRef, useState } from "react";
import { FileDetailGetter, ITreeNode } from "../../support/file";

import { useCurrent } from "../../../mock-editor/react-hooks";
import { ContentDecorator, normalizeCodeContent, useMonacoModel } from "./model";

// import "../../monaco-tree/monaco-editor-v0.20.0/esm/vs/base/browser/ui/codiconLabel/codicon/codicon.css"
// import "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css"

// import loaders just not working
// import "./fix-icons.css"

let codeIconsTTFLoaded = false
function ensureCodeIconsTTFLoaded() {
    if (codeIconsTTFLoaded) {
        return
    }
    codeIconsTTFLoaded = true
    // runtime import
    const dynStyle = document.createElement("style")
    dynStyle.textContent = ` @font-face {
            font-family: "codicon";
            src: url("/build/monaco-code-icons.tff");
          }`
    document.body.appendChild(dynStyle)
}

ensureCodeIconsTTFLoaded()

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
}

export default function Code(props: IProps) {

    const modelRefreshRef = useRef<() => any>()
    const [editor, setEditor] = useState(null as monaco.editor.IStandaloneCodeEditor)
    const [version, setVersion] = useState(0)

    const model = useMonacoModel({
        editor: editor,
        uriPrefix: "code/",
        file: props.file,
        fileDetailGetter: props.fileDetailGetter,
        contentDecorator: props.contentDecorator,

        refreshDecorations: modelRefreshRef,
        readonly: props.readonly,
    })

    useEffect(() => {
        // debug
        // console.log("may file update:", props.file)
        setVersion(version + 1)
    }, [props.file, model])

    // apply model
    useEffect(() => {
        // console.log("version change:", version, oldModel?.fileKey, model?.fileKey)
        if (model && model.model && !model.model.isDisposed()) {
            editor?.setModel?.(model.model)
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
                editor.getModel().setValue(normalizeCodeContent(content))
            }
        } as Control
    }

    const containerRef = useRef<HTMLDivElement>()

    const onContentChangeRef = useCurrent(props.onContentChange)

    const onEditorCreatedRef = useCurrent(props.onEditorCreated)
    // create monaco on mount
    useEffect(() => {
        const editor = monaco.editor.create(
            containerRef.current,
            {
                readOnly: false,
            }
        );

        editor.onDidChangeModelContent(() => {
            if (onContentChangeRef.current) {
                onContentChangeRef.current?.(editor.getValue())
            }
        })

        editor.layout()
        setEditor(editor);
        const handler = (e) => {
            editor.layout()
        }

        if (props.editorRef) {
            props.editorRef.current = editor
        }
        onEditorCreatedRef.current?.(editor)

        // resize
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler)
            editor.dispose()
            if (props.editorRef) {
                props.editorRef.current = undefined
            }
        }
    }, [])

    return <div style={props.containerStyle} className={props.containerClassName}>
        <div
            ref={containerRef}
            className="code-container"
            style={{
                width: "100%",
                height: "100%"
            }}
        />
    </div>
}