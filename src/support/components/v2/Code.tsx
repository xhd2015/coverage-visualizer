// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, ITreeNode } from "../../support/file";

import { applyDecoration, ContentDecorator, useMonacoModel } from "./model";

export interface RenderTarget {
    monacoIconLabel: { title: string }
    label: HTMLElement
}
export interface RenderFile {
    path: string
    name: string
}

export interface PathDecorator {
    // optional
    renderPath?: (target: RenderTarget, file: RenderFile) => Promise<void>
}

export interface CodeFileTree {
    getRoot(): Promise<ITreeNode>
    // optional refresh
    refresh?: () => Promise<void>
}

export interface Control {
    notifyFileChanged: () => Promise<void>
    updateContent: () => Promise<void>
    updateOldContent: () => Promise<void>
}

export interface IProps {
    file?: string
    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator
    control?: Control
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
    })

    useEffect(() => {
        console.log("may file update:", props.file)
        setVersion(version + 1)
    }, [props.file, model])

    // apply model
    useEffect(() => {
        // console.log("version change:", version, oldModel?.fileKey, model?.fileKey)
        if (model) {
            editor?.setModel?.(model.model)
            // apply diff model
            console.log("refresh models:", version)

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
    }

    const containerRef = useRef<HTMLDivElement>()

    // create monaco on mount
    useEffect(() => {
        const editor = monaco.editor.create(
            containerRef.current
        );
        editor.layout()
        setEditor(editor);

        (window as any).X3 = editor;

        const handler = (e) => {
            editor.layout()
        }

        // resize
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler)
            editor.dispose()
        }
    }, [])

    return <div
        ref={containerRef}
        className="code-container"
        style={{
            width: "100%",
            height: "100%"
        }}
    />
}