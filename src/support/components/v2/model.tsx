
import { FileDetail, FileDetailGetter, ITreeNode, traverseNode } from "../../support/file";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState } from "react";

export interface ContentDecorator {
    getFileDecorations: (path: string) => Promise<monaco.editor.IModelDeltaDecoration[]>
}

export interface FileModels {
    [key: string]: FileOptions
}
export interface FileOptions {

    content?: string
    model: monaco.editor.ITextModel
    attachedToEditor: boolean

    file: string
    fileKey: string

    options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions
    decorations?: monaco.editor.IModelDeltaDecoration[]
    // memo

    decorationsRes?: monaco.editor.IEditorDecorationsCollection

    exists: boolean

    // for concurrent control
    resolving?: Promise<any>
}

export async function updateEditorFile(editor: monaco.editor.IStandaloneCodeEditor, file: string, fileModels: { [file: string]: FileOptions }, fileDetailGetter: FileDetailGetter, contentDecorator: ContentDecorator, uriPrefix: string): Promise<FileOptions | null> {
    if (!file) {
        return
    }
    const fileOpts = await getEditorModel(file, fileModels, fileDetailGetter, contentDecorator, uriPrefix)
    if (!fileOpts) {
        return
    }
    editor.setModel(fileOpts.model);
    fileOpts.attachedToEditor = true
    await applyDecoration(editor, fileOpts)

    return fileOpts
}
export async function applyDecoration(editor: monaco.editor.IStandaloneCodeEditor, fileOpts: FileOptions) {
    if (!fileOpts) {
        return
    }
    // console.log("setting editor model value:", modelOpts.model.getValue());
    if (fileOpts.resolving) {
        await fileOpts.resolving
    }
    // modelOpts.model.setValue("hello")
    editor.updateOptions(fileOpts.options);
    fileOpts.decorationsRes?.clear?.()
    fileOpts.decorationsRes = editor.createDecorationsCollection(fileOpts.decorations);
}

export interface Options {
    readonly?: boolean
}
export async function getEditorModel(file: string, fileModels: { [file: string]: FileOptions }, fileDetailGetter: FileDetailGetter, contentDecorator: ContentDecorator, uriPrefix: string, opts?: Options): Promise<FileOptions | null> {
    // console.log("getEditorModel file:", file)

    if (!file) {
        // no active file selected, clear content
        return
    }

    const fileKey = `${uriPrefix || ''}${file}`

    // update content
    let modelOpts = fileModels[fileKey];
    if (!modelOpts) {
        modelOpts = {} as FileOptions
        fileModels[fileKey] = modelOpts
        // console.log("fileKey creating:", fileKey)

        const resolving = new Promise(async (resolve, reject) => {
            const fd = await fileDetailGetter?.getDetail?.(file)
            // console.log("get file detail:", file, fd)
            try {
                let model: monaco.editor.ITextModel
                if (!fd) {
                    model = monaco.editor.createModel(
                        `cannot show content for ${file}`,
                        "plaintext",
                        monaco.Uri.file(fileKey)
                    )
                } else {
                    const normContent = normalizeCodeContent(fd.content)
                    model = monaco.editor.createModel(
                        normContent,
                        fd.language,
                        monaco.Uri.file(fileKey)
                    )
                    model.setValue(normContent)
                }
                Object.assign(modelOpts, {
                    file: file,
                    fileKey: fileKey,
                    attachedToEditor: false,
                    options: {
                        readOnly: opts?.readonly === undefined ? true : opts?.readonly,
                    },
                    exists: !!fd,
                    model,
                })
            } catch (e) {
                console.error("create model error:", file, fileKey, e)
                reject(e)
                return
            }

            if (modelOpts.exists) {
                modelOpts.decorations = (contentDecorator?.getFileDecorations && await contentDecorator?.getFileDecorations(file))
                // console.log("update decoration:", fileKey, modelOpts.decorations)
            }
            resolve(null)
        })

        modelOpts.resolving = resolving
        try {
            await resolving
            // console.log("fileKey resolved:", fileKey)
        } finally {
            modelOpts.resolving = null
        }
    } else if (modelOpts.resolving) {
        // console.log("fileKey resolving:", fileKey)
        // wait it resolve
        await modelOpts.resolving
    } else {
        // not resolving, so update decorations
        if (modelOpts.exists) {
            modelOpts.decorations = (contentDecorator?.getFileDecorations && await contentDecorator?.getFileDecorations(file))
            // console.log("update decoration:", fileKey, modelOpts.decorations)
        }
    }
    return modelOpts
}

export interface modelProps {
    editor: monaco.editor.IStandaloneCodeEditor
    uriPrefix: string
    file: string
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator

    refresh?: any
    refreshDecorations?: any

    onWillDisposeModel?: () => void

    readonly?: boolean

    // by default content is auto updated, unless
    // the external controller needs to sync between multiple models
    // disableAutoUpdateContent?: boolean
}

export function useMonacoModel(props: modelProps): FileOptions | null {
    const [model, setModel] = useState(null as FileOptions)
    const [cache, setCache] = useState({} as FileModels)
    const [fileGetterVersion, setFileGetterVersion] = useState(0)

    // version of updateContent
    const [modelVersion, setModelVersion] = useState(0)

    // associate content
    const updateContent = async (): Promise<void> => {
        if (!props.file || !props.fileDetailGetter) {
            console.log("INFO file or fileDetailGetter not prepared, will clear model", props.uriPrefix, props.file)
            setModel(null)
            return
        }

        const opts = await getEditorModel(props.file, cache, props.fileDetailGetter, props.contentDecorator, `${props.uriPrefix || ''}_v${fileGetterVersion}/`,
            { readonly: props.readonly }
        )
        // console.log("updating model:", props.uriPrefix, props.file, opts)
        setModel(opts)
        setModelVersion(modelVersion + 1)
        return
    }
    useEffect(() => {
        updateContent()
    }, [props.file, fileGetterVersion, props.contentDecorator])

    const refreshDecorations = () => {
        if (!props.file || !props.editor || !model) {
            return
        }
        const decorations = cache[`${props.uriPrefix || ''}_v${fileGetterVersion}/` + props.file]
        // console.log("update decorations:", props.uriPrefix, fileGetterVersion, decorations)
        if (decorations) {
            applyDecoration(props.editor, decorations)
        }
    }
    // associate decorations
    // apply each files' decoration
    useEffect(() => {
        refreshDecorations()
    },
        [props.file, props.editor, fileGetterVersion, model, modelVersion] // note: must wait diffModel
    )
    // props.file,

    if (props.refresh) {
        props.refresh.current = updateContent
    }
    if (props.refreshDecorations) {
        props.refreshDecorations.current = refreshDecorations
    }

    useEffect(() => {
        // clean initial cache
        return () => Object.keys(cache).forEach(k => {
            cache[k].model?.dispose?.()
            // console.log("fileKey clean up at end initial:", k)
        })
    }, [])
    // clearing caches
    useEffect(() => {
        // console.log("fileDetailGetter change to:", fileGetterVersion + 1)
        props.onWillDisposeModel?.()
        const newCache = {}
        setCache(newCache)
        setFileGetterVersion(fileGetterVersion + 1)
        setModel(null)

        return () => {
            // console.log("fileKey clean up at end:", fileGetterVersion + 1)
            Object.keys(newCache).forEach(k => {
                newCache[k].model?.dispose?.()
                // console.log("fileKey clean up at end:", k)
            })
        }
    }, [props.fileDetailGetter])

    return model
}

// vscode's editor.getModel().setValue(value)
// these cases will cause vscode to throw "'factory.create' is not a function"
//  1. undefined or null
//  2. a plain object
// so we here make a compitable value that will make vscode more stable
export function normalizeCodeContent(content: string | Object | undefined): string {
    if (content === null) {
        return "null"
    }
    if (content === undefined) {
        return "undefined"
    }
    if (typeof content === 'object') {
        // TODO: this may not be safe
        return JSON.stringify(content, null, "    ")
    }
    if (typeof content !== 'string') {
        return String(content)
    }
    return content
}