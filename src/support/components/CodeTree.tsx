// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useEffect, useState } from "react";
import {
    MonacoTree,
    TreeDnD,
    FileTemplate,
} from "../monaco-tree";
import MonacoEditor, { MonacoDiffEditor } from "react-monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, ITreeNode, traverseNode } from "../support/file";

import "../assets/custom.css";
import "../assets/main.css";
import "../assets/vscode-icons.css";
import usePrevious from "./usePrev";
import { ContentDecorator } from "./v2/model";

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
    notifyContentUpdated: () => Promise<void>


    updateContent: () => Promise<void>
    updateDiffContent: () => Promise<void>
}

interface IState {
    rootDir: ITreeNode,
    treeConfig: any,
    activeFile: string,
}

interface IRef {
    editorWrapper: MonacoEditor;
    diffEditorWrapper: MonacoDiffEditor;
    lastClickedTime: number;
    lastClickedFile: any;

    // fileModels: FileModels;
    // diffFileModels: FileModels;
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

    decorationsRes?: monaco.editor.IEditorDecorationsCollection // used to clear old decorations

    exists: boolean
}

export interface IProps {
    // file tree
    fileTree: CodeFileTree
    pathDecorater?: PathDecorator
    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator

    //  diff
    showDiff?: boolean
    diffFileDetailGetter?: FileDetailGetter
    diffContentDecorator?: ContentDecorator


    height?: string // default 400px
    control?: Control

    // on tree update
    onTreeUpdate?: (root: ITreeNode) => void
}

export default function CodeTree(props: IProps) {
    const [state, setState] = useState({
        rootDir: null,
        activeFile: "",
    } as IState)
    const [ref] = useState({
        editorWrapper: null,
        diffEditorWrapper: null,
        lastClickedTime: 0,
        lastClickedFile: "",
        // fileModels: {},
        // diffFileModels: {},
    } as IRef)

    const [treeConfig, setTreeConfig] = useState(refreshTreeConfig(props.pathDecorater))

    // const prevShowDiff = usePrevious(props.showDiff)

    const [model, setModel] = useState(null as monaco.editor.ITextModel)
    const [oldModel, setOldModel] = useState(null as monaco.editor.ITextModel)
    const [diffModel, setDiffModel] = useState(null as monaco.editor.IDiffEditorModel)
    const [fileModels, setFileModels] = useState({} as FileModels)
    const [diffFileModels, setDiffFileModels] = useState({} as FileModels)


    useEffect(() => {
        console.log("showDiff update:", props.showDiff)
        console.log("diffModel:", diffModel)
    }, [props.showDiff])

    // update tree config
    useEffect(() => {
        setTreeConfig(refreshTreeConfig(props.pathDecorater))
    }, [props.pathDecorater])

    // update root
    const refresh = async (): Promise<void> => {
        if (!props.fileTree?.refresh) {
            const root = await props.fileTree.getRoot?.()
            setState({
                ...state,
                rootDir: root,
            })
            return
        }
        props.fileTree.refresh().then(async () => {
            const root = await props.fileTree.getRoot?.()
            setState({
                ...state,
                rootDir: root,
            })
        })
    }
    if (props.control) {
        props.control.notifyFileChanged = refresh
    }
    // initial trigger refresh
    useEffect(() => {
        refresh()
    }, [props.fileTree])

    const disposeOutdated = () => {
        // console.log("fileDetailGetter change, clearing fileModels")
        // clear model
        const keys = Object.keys(fileModels)
        keys.forEach(k => {
            // console.log("disposing:", k)
            fileModels[k].model?.dispose?.()
        })
        // keys.forEach(k => delete (ref.fileModels[k]))

        setFileModels({}) // new

        // NOTE: not immeidately effective
        // console.log("before setModel:", model)
        setModel(null)
        // console.log("after setModel:", model)
    }
    const disposeOutdatedDiff = () => {
        console.log("disposing diff")
        const keys = Object.keys(diffFileModels)
        keys.forEach(k => {
            // console.log("disposing diff:", k)
            diffFileModels[k].model?.dispose?.()
        })
        setDiffFileModels({})
        // keys.forEach(k => delete ref.diffFileModels[k])
        setOldModel(null)
    }

    // set diff
    useEffect(() => {
        // if (!props.showDiff) {
        //     setDiffModel(null)
        //     return
        // }
        if (props.showDiff && oldModel && !oldModel.isDisposed() && model && !model.isDisposed()) {
            console.log("setting diff:", oldModel, model)
            setDiffModel({
                original: oldModel,
                modified: model,
            })
            return () => {
                console.log("shutdown diff")
                setDiffModel(null)
            }
        }
    }, [props.showDiff, oldModel, model])

    // auto select first file
    useEffect(() => {
        console.log("active file will change:", state.activeFile)
        let firstNode: ITreeNode
        if (state.rootDir && props.fileTree && props.fileDetailGetter) {
            traverseNode(state.rootDir, (node) => {
                if (!node.isDirectory) {
                    firstNode = node
                    return false
                }
                return true
            })
        }
        setState({ ...state, activeFile: firstNode?.key || '' });
    }, [props.fileTree, props.fileDetailGetter, state.rootDir])

    // update model
    const updateModel = async (): Promise<void> => {
        const opts = await getEditorModel(state.activeFile, fileModels, props.fileDetailGetter, props.contentDecorator, 'new/')
        setModel(opts?.model)
        return
    }
    useEffect(() => {
        updateModel()
        return () => setModel(null)
    }, [state.activeFile, props.fileDetailGetter, props.contentDecorator, fileModels])

    // handle switch from showDiff
    // Bad pattern: (TODO: document this)
    // useEffect(() => {
    //     if (!props.showDiff) {
    //         if (model) {
    //             // console.log("setting model:", model.getValue())
    //             if (ref.editorWrapper.editor.getModel() != model) {
    //                 console.log("setting model:")
    //                 ref.editorWrapper.editor.setModel(null)
    //             }
    //         } else {
    //             console.log("unset model:")
    //             ref.editorWrapper.editor.setModel(null)
    //         }
    //     }
    // }, [props.showDiff, model])

    // make showDiff the only thing to trigger
    useEffect(() => {
        // trigger once
        // bad parts of react:
        //   does not get the most updated value of model,
        //   even setModel(null) is called, here we don't get the immediate value
        //   
        if (!props.showDiff && model) {
            console.log("setting non-diff model:", model)
            ref.editorWrapper.editor.setModel(model)
            return () => setModel(null)
        }
    }, [props.showDiff, model])
    // useEffect(() => {
    //     if (!props.showDiff) {
    //         ref.editorWrapper.editor.setModel(model)
    //     }
    // }, [model])

    const updateOldModel = async (): Promise<void> => {
        if (!props.showDiff) {
            setOldModel(null)
            return
        }
        console.log("creating old")
        const opts = await getEditorModel(state.activeFile, diffFileModels, props.diffFileDetailGetter, props.diffContentDecorator, 'old/')
        setOldModel(opts?.model)
        return
    }
    useEffect(() => {
        updateOldModel()
        return () => setOldModel(null)
    }, [props.showDiff, state.activeFile, props.diffFileDetailGetter, diffFileModels, props.diffContentDecorator])

    // apply diff model
    useEffect(() => {
        if (props.showDiff && diffModel) {
            ref.diffEditorWrapper.editor.setModel(diffModel)
        }
    }, [props.showDiff, diffModel])

    // apply each files' decoration
    // update content decoration
    const updateContent = (): Promise<void> => {
        if (!state.activeFile || !model) {
            return
        }
        let editor: monaco.editor.IStandaloneCodeEditor
        if (!props.showDiff) {
            editor = ref.editorWrapper.editor
        } else {
            if (!diffModel) {
                return
            }
            editor = ref.diffEditorWrapper.editor.getModifiedEditor?.()
        }
        if (editor && model) {
            // editor.setModel(model)
            applyDecoration(editor, fileModels["new/" + state.activeFile])
        }
    }
    useEffect(() => {
        updateContent()
    },
        [props.showDiff, state.activeFile, model, diffModel, props.contentDecorator, fileModels] // note: must wait diffModel
    )

    const updateDiffContent = (): Promise<void> => {
        if (!props.showDiff || !state.activeFile || !diffModel) {
            return
        }
        const editor = ref.diffEditorWrapper?.editor?.getOriginalEditor?.()
        if (editor && oldModel) {
            editor.setModel(oldModel)
            applyDecoration(editor, diffFileModels["old/" + state.activeFile])
        }
    }
    useEffect(() => {
        updateDiffContent()
    }, [props.showDiff, state.activeFile, oldModel, diffModel, diffFileModels, props.diffContentDecorator])

    // resize
    useEffect(() => {
        const handler = (e) => {
            if (ref.editorWrapper?.editor) {
                ref.editorWrapper.editor.layout()
            }
            if (ref.diffEditorWrapper?.editor) {
                ref.diffEditorWrapper.editor.layout()
            }
        }
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler)
        }
    }, [])

    if (props.control) {
        props.control.notifyContentUpdated = updateModel
        props.control.updateContent = updateModel
        props.control.updateDiffContent = updateOldModel
    }

    // event dispatchers
    useEffect(() => {
        props.onTreeUpdate?.(state.rootDir)
    }, [state.rootDir])

    const onClickFile = (file) => {
        if (file.isDirectory) {
            return;
        }
        console.log("onclick file:", file)

        const names = []
        let p = file
        while (p.parent) { // ignore root
            names.push(p.name)
            p = p.parent
        }
        setState({ ...state, activeFile: names.reverse().join("/") });

        if (
            Date.now() - ref.lastClickedTime < 500 &&
            ref.lastClickedFile === file
        ) {
            // this.onDoubleClickFile(file);
        } else {
            console.log(file.name + " clicked");
        }

        ref.lastClickedTime = Date.now();
        ref.lastClickedFile = file;
    }

    // resource shutdown at the end, so that 
    // we can reference old value freely.
    // disposing must be the last to execute, because  first
    // dispose changed models
    useEffect(disposeOutdated, [props.fileDetailGetter])
    useEffect(disposeOutdatedDiff, [props.showDiff, props.diffFileDetailGetter])

    const onChange = () => {
        const { activeFile } = state;
        console.log("change:", activeFile);
    }

    return <div
        style={{ display: "flex", height: props.height || "400px" }} className="coverage-visualizer">
        <div
            className="show-file-icons show-folder-icons"
            style={{
                width: "300px",
                height: "100%",
                minWidth: "200px",
            }}
        >
            <div className="workspaceContainer" >
                {!state.rootDir ? null : (
                    <MonacoTree
                        directory={state.rootDir}
                        treeConfig={treeConfig}
                        onClickFile={onClickFile}
                    />
                )}
            </div>
        </div>
        {
            !props.showDiff && < MonacoEditor
                ref={(e: MonacoEditor) => {
                    ref.editorWrapper = e;
                }}
                onChange={onChange}
            />
        }
        {
            props.showDiff &&
            <MonacoDiffEditor
                ref={(e: MonacoDiffEditor) => {
                    ref.diffEditorWrapper = e
                }}
                onChange={onChange}
            ></MonacoDiffEditor>
        }

    </div >;
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
    applyDecoration(editor, fileOpts)

    return fileOpts
}
export function applyDecoration(editor: monaco.editor.IStandaloneCodeEditor, fileOpts: FileOptions) {
    if (!fileOpts) {
        return
    }
    // console.log("setting editor model value:", modelOpts.model.getValue());

    // modelOpts.model.setValue("hello")
    editor.updateOptions(fileOpts.options);
    fileOpts.decorationsRes?.clear?.()
    fileOpts.decorationsRes = editor.createDecorationsCollection(fileOpts.decorations);
}
export async function getEditorModel(file: string, fileModels: { [file: string]: FileOptions }, fileDetailGetter: FileDetailGetter, contentDecorator: ContentDecorator, uriPrefix: string): Promise<FileOptions | null> {
    // console.log("getEditorModel file:", file)

    if (!file) {
        // no active file selected, clear content
        return
    }

    const fileKey = `${uriPrefix || ''}${file}`

    // update content
    let modelOpts = fileModels[fileKey];
    if (!modelOpts) {
        const fd = await fileDetailGetter?.getDetail?.(file)
        // console.log("DEBUG get file detail:", file, fd)
        if (!fd) {
            modelOpts = {
                model: monaco.editor.createModel(
                    `cannot show content for ${file}`,
                    "plaintext",
                    monaco.Uri.file(fileKey)
                ),
                options: {
                    readOnly: true,
                },
                exists: false
            };
        } else {
            modelOpts = {
                model: monaco.editor.createModel(
                    fd.content,
                    fd.language,
                    monaco.Uri.file(fileKey)
                ),
                options: {
                    readOnly: true,
                },
                exists: true,
            };
            modelOpts.model.setValue(fd.content)
        }
        fileModels[fileKey] = modelOpts;
    }
    if (modelOpts.exists) {
        modelOpts.decorations = (contentDecorator?.getFileDecorations && await contentDecorator?.getFileDecorations(file))
        console.log("update decoration:", fileKey, modelOpts.decorations)
    }
    return modelOpts
}

export function refreshTreeConfig(opts?: PathDecorator) {
    const treeConfig = {
        dataSource: {
            /**
             * Returns the unique identifier of the given element.
             * No more than one element may use a given identifier.
             */
            getId: function (tree, element) {
                return element.key;
            },

            /**
             * Returns a boolean value indicating whether the element has children.
             */
            hasChildren: function (tree, element) {
                return element.isDirectory;
            },

            /**
             * Returns the element's children as an array in a promise.
             */
            getChildren: function (tree, element) {
                return Promise.resolve(element.children);
            },

            /**
             * Returns the element's parent in a promise.
             */
            getParent: function (tree, element) {
                return Promise.resolve(element.parent);
            },
        },
        renderer: {
            getHeight: function (tree, element) {
                return 24;
            },
            renderTemplate: function (tree, templateId, container) {
                // options
                return new FileTemplate(container, { render: opts?.renderPath })
            },
            renderElement: function (tree, element, templateId, templateData) {
                templateData.set(element);
            },
            disposeTemplate: function (tree, templateId, templateData) {
                console.log("dispose:", templateData)
                // FileTemplate.dispose();
            },
        },

        //tree config requires a controller property but we would defer its initialisation
        //to be done by the MonacoTree component
        //controller: createController(this, this.getActions.bind(this), true),
        dnd: new TreeDnD(),
    };
    return treeConfig
}