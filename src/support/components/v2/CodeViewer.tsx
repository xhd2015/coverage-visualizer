import { CSSProperties, useEffect, useRef, useState } from "react"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export interface CodeViewerProps {
    content?: string
    language?: string
    style?: CSSProperties
    className?: string
}

export default function (props: CodeViewerProps) {
    const containerRef = useRef<HTMLDivElement>()

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

    const content = props.content ?? ""
    const language = props.language ?? ""

    useEffect(() => {
        const container = containerRef.current
        const editor = monaco.editor.create(
            container,
            {
                value: content,
                language: language,
                readOnly: true,
                scrollBeyondLastLine: false,
                wrappingStrategy: 'advanced',
                minimap: {
                    enabled: false
                },
                // automaticLayout: false, // not needed for readonly editor
                overviewRulerLanes: 0,
                scrollbar: {
                    // see this, make scroll propagate to
                    // parent possible:
                    // https://github.com/microsoft/monaco-editor/issues/1853#issuecomment-593484147
                    alwaysConsumeMouseWheel: false,
                }
            }
        );

        const updateHeight = () => {
            // console.log("height:", editor.getContentHeight())
            // const contentHeight = Math.min(1000, editor.getContentHeight());
            const contentHeight = editor.getContentHeight()
            container.style.height = `${contentHeight}px`;
            editor.layout();
        };
        editor.onDidContentSizeChange(updateHeight);
        updateHeight();

        editorRef.current = editor
    })

    useEditorOption(editorRef, content, (editor, content) => editor.setValue(content))
    // see: https://github.com/microsoft/monaco-editor/issues/539
    useEditorOption(editorRef, language, (editor, language) => {
        const model = editorRef.current.getModel()
        monaco.editor.setModelLanguage(model, language)
    })

    return <div ref={containerRef} className={props.className} style={props.style}>{ }</div>
}

function useEditorOption<T>(editor: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor>, opt: T, apply: (editor: monaco.editor.IStandaloneCodeEditor, opt: T) => void) {
    useEffect(() => {
        if (!editor.current) {
            return
        }
        apply(editor.current, opt)
    }, [opt])
}