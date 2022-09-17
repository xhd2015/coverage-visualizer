// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, ITreeNode } from "../../support/file";

import { ContentDecorator, useMonacoModel } from "./model";

export interface Control {
    notifyFileChanged: () => Promise<void>
    updateContent: () => Promise<void>
    updateOldContent: () => Promise<void>
}

interface FileModels {
    [key: string]: FileOptions
}
interface FileOptions {
    content?: string
    model: monaco.editor.ITextModel
    options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions
    decorations?: monaco.editor.IModelDeltaDecoration[]
    // memo

    decorationsRes?: monaco.editor.IEditorDecorationsCollection

    exists: boolean
}

export interface IProps {
    file?: string
    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator
    control?: Control

    // old diff 
    oldFileDetailGetter?: FileDetailGetter
    oldContentDecorator?: ContentDecorator

    hideDecoratorWhenDiff?: boolean
}


export default function DiffCode(props: IProps) {
    const modelRefreshRef = useRef<() => any>()
    const oldModelRefreshRef = useRef<() => any>()

    const [diffEditor, setDiffEditor] = useState(null as monaco.editor.IStandaloneDiffEditor)

    const [version, setVersion] = useState(0)

    const model = useMonacoModel({
        editor: diffEditor?.getModifiedEditor?.(),
        uriPrefix: "diff-new/",
        file: props.file,
        fileDetailGetter: props.fileDetailGetter,
        contentDecorator: props.contentDecorator,

        refreshDecorations: modelRefreshRef,
    })

    const oldModel = useMonacoModel({
        editor: diffEditor?.getOriginalEditor?.(),
        uriPrefix: "diff-old/",
        file: props.file,
        fileDetailGetter: props.oldFileDetailGetter,
        contentDecorator: props.oldContentDecorator,

        refreshDecorations: oldModelRefreshRef,
    })

    useEffect(() => {
        setVersion(version + 1)
    }, [props.file, model, oldModel])

    useEffect(() => {
        // console.log("version change:", version, oldModel?.fileKey, model?.fileKey)
        if (oldModel && model && oldModel.file === model.file) {
            diffEditor?.setModel?.({
                original: oldModel.model,
                modified: model.model,
            })
            // apply diff model
            console.log("refresh models:", version)

            if (!props.hideDecoratorWhenDiff) {
                modelRefreshRef?.current?.()
                oldModelRefreshRef?.current?.()
            }
            // don't set null, we want remain when loading
            // return () => diffEditor?.setModel?.(null)
        }
        // comment the following code,remain still
        // else {
        //     diffEditor?.setModel?.(null)
        // }
    }, [version, props.hideDecoratorWhenDiff])

    if (props.control) {
        // props.control.updateContent = updateContent
        // props.control.updateOldContent = updateOldContent
    }

    const containerRef = useRef<HTMLDivElement>()

    // create monaco on mount
    useEffect(() => {
        const editor = monaco.editor.createDiffEditor(
            containerRef.current
        );
        // resize
        editor.layout()
        setDiffEditor(editor)
        const handler = (e) => {
            editor.layout()
        }
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler)
            editor.dispose()
        }
    }, [])
    return (
        <div
            ref={containerRef}
            className="diff-code-container"
            style={{
                width: "100%",
                height: "100%"
            }}
        />
    );
}