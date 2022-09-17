// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useCallback, useEffect, useState } from "react";
import {
    MonacoTree,
    TreeDnD,
    FileTemplate,
} from "../../monaco-tree";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, ITreeNode, traverseNode } from "../../support/file";

import "../../assets/custom.css";
import "../../assets/main.css";
import "../../assets/vscode-icons.css";

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
    refresh: () => Promise<void>
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

    height?: string // default 400px
    control?: Control

    // on tree update
    onTreeUpdate?: (root: ITreeNode) => void
    onSelectFile?: (file: string) => void

    children?: any
}

export default function DirTree(props: IProps) {
    const [activeFile, setActiveFile] = useState("")
    const [rootDir, setRootDir] = useState(null as ITreeNode)
    const [treeConfig, setTreeConfig] = useState(refreshTreeConfig(props.pathDecorater))

    const [lastClickedTime, setLastClickedTime] = useState(0)
    const [lastClickedFile, setLastClickedFile] = useState("")

    // update tree config
    useEffect(() => {
        setTreeConfig(refreshTreeConfig(props.pathDecorater))
    }, [props.pathDecorater])

    // update root
    const refresh = async (): Promise<void> => {
        const refreshed = Promise.resolve(props.fileTree?.refresh?.())
        return refreshed.then(async () => {
            const root = await props.fileTree?.getRoot?.()
            setRootDir(root)
        })
    }
    if (props.control) {
        props.control.refresh = refresh
    }
    // initial trigger refresh
    useEffect(() => {
        refresh()
    }, [props.fileTree])

    // auto select first file
    useEffect(() => {
        // console.log("active file change detected:", activeFile)
        let firstActiveFile = ''
        let foundExisting
        if (rootDir) {
            traverseNode(rootDir, (node) => {
                if (!node.isDirectory) {
                    // console.log("traversing:", node.key)
                    if (!firstActiveFile) {
                        // first node
                        firstActiveFile = node.key
                    }
                    if (!activeFile) {
                        return false
                    }
                    if (activeFile && node.key === activeFile) {
                        foundExisting = true
                        return false
                    }
                }
                return true
            })
        }
        if (!foundExisting) {
            // console.log("active file will change:", activeFile, "->", firstActiveFile)
            setActiveFile(firstActiveFile)
        }
    }, [rootDir])

    // event dispatchers
    useEffect(() => {
        props.onTreeUpdate?.(rootDir)
    }, [rootDir])

    useEffect(() => {
        // console.log("onSelectFile:", activeFile)
        props.onSelectFile?.(activeFile)
    }, [activeFile])


    const onClickFile = useCallback((file) => {
        console.log("onclick file1:", file)
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
        setActiveFile(names.reverse().join("/"));

        if (
            Date.now() - lastClickedTime < 500 &&
            lastClickedFile === file
        ) {
            // this.onDoubleClickFile(file);
        } else {
            console.log(file.name + " clicked");
        }

        setLastClickedTime(Date.now())
        setLastClickedFile(file)
    }, [])

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
                {!rootDir ? null : (
                    <MonacoTree
                        directory={rootDir}
                        treeConfig={treeConfig}
                        onClickFile={onClickFile}
                    />
                )}
            </div>
        </div>
        {
            props.children
        }
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