// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.

import React, { useEffect, useState } from "react";
import {
    MonacoTree,
    TreeDnD,
    FileTemplate,
} from "../monaco-tree";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, ITreeNode, traverseNode } from "../support/file";

import "../assets/custom.css";
import "../assets/main.css";
import "../assets/vscode-icons.css";

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
export interface ContentDecorator {
    getFileDecorations: (path: string) => Promise<monaco.editor.IModelDeltaDecoration[]>
}


export interface Control {
    notifyFileChanged: () => Promise<void>
    notifyContentUpdated: () => Promise<void>
}

interface IState {
    rootDir: ITreeNode,
    treeConfig: any,
    activeFile: string,
}

interface IRef {
    editorWrapper: MonacoEditor;
    lastClickedTime: number;
    lastClickedFile: any;

    fileModels: FileModels;
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
    // file tree
    fileTree: CodeFileTree
    pathDecorater?: PathDecorator
    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator
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
        lastClickedTime: 0,
        lastClickedFile: "",
        fileModels: {},
    } as IRef)

    const [treeConfig, setTreeConfig] = useState(refreshTreeConfig(props.pathDecorater))

    const getEditor = () => {
        return (ref.editorWrapper as MonacoEditor)?.editor
    }

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

    // auto select first file
    useEffect(() => {
        // console.log("active file will change:", state.activeFile)
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

    const updateContent = async () => {
        // update content
        console.log("activeFile change:", state.activeFile)
        const activeFile = state.activeFile;
        if (!activeFile) {
            // no active file selected, clear content
            return
        }
        let modelOpts = ref.fileModels?.[activeFile];
        if (!modelOpts) {
            const fd = await props.fileDetailGetter?.getDetail?.(activeFile)
            // console.log("get file detail:", activeFile, fd)
            if (!fd) {
                modelOpts = {
                    model: monaco.editor.createModel(
                        `cannot show content for ${activeFile}`,
                        "plaintext",
                        monaco.Uri.file(activeFile)
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
                        monaco.Uri.file(activeFile)
                    ),
                    options: {
                        readOnly: true,
                    },
                    exists: true,
                };
                modelOpts.model.setValue(fd.content)
            }
            ref.fileModels[activeFile] = modelOpts;
        }
        if (modelOpts.exists) {
            modelOpts.decorations = (props.contentDecorator?.getFileDecorations && await props.contentDecorator?.getFileDecorations(activeFile))
        }
        // console.log("setting editor model value:", modelOpts.model.getValue());
        const editor = getEditor()
        editor.setModel(modelOpts.model);
        // modelOpts.model.setValue("hello")
        editor.updateOptions(modelOpts.options);
        modelOpts.decorationsRes?.clear?.()
        modelOpts.decorationsRes = editor.createDecorationsCollection(modelOpts.decorations);
    }
    useEffect(() => {
        updateContent()
    }, [state.activeFile, props.fileDetailGetter, props.contentDecorator])

    useEffect(() => {
        const handler = (e) => {
            if (ref.editorWrapper?.editor) {
                ref.editorWrapper.editor.layout()
            }
        }
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler)
        }
    }, [])

    useEffect(() => {
        console.log("fileDetailGetter change, clearing fileModels")
        // clear model
        Object.keys(ref.fileModels || {}).forEach(k => {
            console.log("disposing model:", k, ref.fileModels[k])
            ref.fileModels[k].model?.dispose?.()
        })
        ref.fileModels = {}
    }, [props.fileDetailGetter])

    if (props.control) {
        props.control.notifyContentUpdated = updateContent
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
        < MonacoEditor
            ref={(e: MonacoEditor) => {
                ref.editorWrapper = e;
            }}
            onChange={onChange}
        />
    </div >;
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