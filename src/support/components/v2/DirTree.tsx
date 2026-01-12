// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    TreeDnD,
    FileTemplate,
} from "../../monaco-tree";

import { MonacoTree } from "../../monaco-tree/monaco-tree";
import { MTreeNode } from "../../monaco-tree/tree-node";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { deepClone, FileDetailGetter, ITreeNode, traverseNode } from "../../support/file";
import ColResizeBar from "./ColResizeBar";

import "../../assets/custom.css";
import "../../assets/main.css";
import "../../assets/vscode-icons.css";
import "./code.css"
import { debounce } from "lodash"

export interface RenderTarget {
    monacoIconLabel: HTMLElement
    label: HTMLElement
    description: HTMLElement
    options?: RenderTargetOptions
}

export interface RenderTargetOptions {
    render?: (target: RenderTarget, file: RenderFile) => void
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

export interface DirTreeControl {
    refresh: () => Promise<void>
    refreshTreeRender: () => void
    setChecked: (file: string, checked: boolean, allDescendent: boolean) => void
    updateInitialCheckedMap: (checkedMap?: { [file: string]: boolean }) => void
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

export interface FileExtraOptions {
    hide?: boolean
}

export interface IProps {
    // file tree
    fileTree: CodeFileTree
    extraOptions?: { [path: string]: FileExtraOptions }
    pathDecorater?: PathDecorator

    // default: true
    // 
    divideFilesAndDirs?: boolean

    height?: string // default 400px
    control?: DirTreeControl

    // on tree update
    onTreeUpdate?: (root: ITreeNode) => void
    onSelectFile?: (file: string) => void
    onFileCheck?: (file: string, dir: boolean, checked: boolean) => void

    checkedMap?: { [file: string]: boolean }

    // check box
    showCheckbox?: boolean

    children?: any
}


export default function DirTree(props: IProps) {
    const [activeFile, setActiveFile] = useState("")
    const [origRootDir, setOrigRootDir] = useState<ITreeNode>() // the unmodified origRootDir
    const [rootDir, setRootDir] = useState<ITreeNode>()

    const nodeMap = useMemo<{ [path: string]: ITreeNode }>(() => {
        const m = {}
        traverseNode(rootDir, n => {
            m[n.path] = n
            return true
        })
        return m
    }, [rootDir])

    // checkbox
    const fileCheckRef = useRef(props.onFileCheck)
    fileCheckRef.current = props.onFileCheck

    const [treeConfigVersion, setTreeConfigVersion] = useState(0)
    const initialCheckedMapRef = useRef(props.checkedMap)

    // tree config
    const [treeConfig, setChecked] = useMemo(() => {
        // clear checkboxMap
        return refreshTreeConfig(props.pathDecorater, props.showCheckbox, fileCheckRef, nodeMap, initialCheckedMapRef)
    }, [props.pathDecorater, props.showCheckbox, nodeMap, treeConfigVersion])

    const [lastClickedTime, setLastClickedTime] = useState(0)
    const [lastClickedFile, setLastClickedFile] = useState("")

    const divideFilesAndDirs = props.divideFilesAndDirs === undefined || !!props.divideFilesAndDirs

    const hideMap = useMemo(() => {
        const res = {}
        let hasRes = false
        Object.keys(props.extraOptions || {}).forEach(k => {
            if (props.extraOptions[k]?.hide) {
                hasRes = true
                res[k] = true
            }
        })
        return hasRes ? res : undefined
    }, [props.extraOptions])


    const updateRootDir = useCallback((origRootDir: ITreeNode, hideMap: { [path: string]: boolean }, divideFilesAndDirs: boolean) => {
        const { node: newDir } = deepFilterNode(origRootDir, (e) => !hideMap?.[e.path], divideFilesAndDirs)
        setRootDir(newDir)
    }, [])
    // update root
    const refresh = async (): Promise<void> => {
        const refreshed = Promise.resolve(props.fileTree?.refresh?.())
        return refreshed.then(async () => {
            const root = await props.fileTree?.getRoot?.()
            setOrigRootDir(root)
            updateRootDir(root, hideMap, divideFilesAndDirs)
        })
    }
    if (props.control) {
        props.control.refresh = refresh
        props.control.setChecked = setChecked as any
        props.control.refreshTreeRender = () => setTreeConfigVersion(treeConfigVersion + 1)
        props.control.updateInitialCheckedMap = (checkedMap?: { [file: string]: boolean }) => {
            initialCheckedMapRef.current = checkedMap
            setTreeConfigVersion(treeConfigVersion + 1)
        }
    }
    // initial trigger refresh
    useEffect(() => {
        refresh()
    }, [props.fileTree])

    // process hide
    // why not including watch origRootDir?
    useEffect(() => {
        updateRootDir(origRootDir, hideMap, divideFilesAndDirs)
    }, [origRootDir, hideMap, divideFilesAndDirs])

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
        props.onTreeUpdate?.(origRootDir)
    }, [origRootDir])

    useEffect(() => {
        props.onSelectFile?.(activeFile)
    }, [activeFile])


    const onClickFile = useCallback((file: MTreeNode) => {
        if (file.isDirectory) {
            return;
        }

        const names = []
        let p = file
        while (p.parent) { // ignore root
            names.push(p.name)
            p = p.parent
        }
        setActiveFile(names.reverse().join("/"));

        if (
            Date.now() - lastClickedTime < 500 &&
            lastClickedFile === file.key
        ) {
            // this.onDoubleClickFile(file);
        } else {
            console.log(file.name + " clicked");
        }

        setLastClickedTime(Date.now())
        setLastClickedFile(file.key)
    }, [])

    // make DirTree resizeable
    // https://brainbell.com/javascript/making-resizable-table-js.html
    return <div
        style={{ display: "flex", height: props.height || "400px" }} className="coverage-visualizer">
        <div
            className="show-file-icons show-folder-icons"
            style={{
                // width: "300px",
                height: "100%",
            }}
        >
            <div className="workspaceContainer" style={{ minWidth: "200px" }}>
                {!rootDir ? null : (
                    <div style={{ position: "relative", height: "100%" }}>
                        <MonacoTree
                            directory={rootDir}
                            treeConfig={treeConfig}
                            onClickFile={onClickFile}
                        />
                        <ColResizeBar />
                    </div>
                )}
            </div>
        </div>
        {
            props.children
        }
    </div >
}

// return a should hide flag
export function deepFilterNode(node: ITreeNode, filter: (node: ITreeNode) => boolean, divideFilesAndDirs: boolean, parent?: ITreeNode): { hide?: boolean, node?: ITreeNode } {
    if (!node) {
        return { hide: true }
    }
    const newNode = { ...node, parent }
    if (!node.isDirectory) {
        return { node: newNode }
    }

    // copy children, and apply hide filter
    const newChildren = []
    const files = []
    node.children?.forEach?.(e => {
        if (filter && !filter(e)) {
            return
        }
        const { hide, node } = deepFilterNode(e, filter, divideFilesAndDirs, newNode)
        if (!hide) {
            if (divideFilesAndDirs && !node.isDirectory) {
                files.push(node)
            } else {
                newChildren.push(node)
            }
        }
    })
    if (divideFilesAndDirs && files.length > 0) {
        newChildren.push(...files)
    }

    newNode.children = newChildren
    if (newChildren.length === 0 && node.children?.length > 0) {
        // hide if all children hide
        return { hide: true }
    }
    return { node: newNode }
}
export interface CheckControl {
    checked: () => boolean
    setChecked: (v: boolean) => void
    setCheckedAllDescendents: (v: boolean) => void
}

const uniqRoleMarkerCheckbox = "file-checkbox-role-uniq-marker"
const classHasChildrenChecked = "has-children-checked"
function createCheckbox(): HTMLInputElement {
    const e = document.createElement("input")
    e.type = "checkbox"
    e.classList.add("file-checkbox")
    e.classList.add(uniqRoleMarkerCheckbox)
    return e
}

export function refreshTreeConfig(opts: PathDecorator, showCheckbox: boolean,
    onCheckedRef: React.MutableRefObject<(file: string, dir: boolean, checked: boolean) => void>,
    nodeMap: { [path: string]: ITreeNode },
    initalCheckedMapRef: React.MutableRefObject<{
        [file: string]: boolean;
    }>
) {

    let id = 1
    const associatedCheckbox: {
        [templateID: number]: {
            path: string
            // element: HTMLInputElement
            // listener: any
        }
    } = {}

    // TODO: since we haved fixed the checkedMap issue, can we now turn back to template memo?
    const checkedMap: { [file: string]: boolean; } = { ...initalCheckedMapRef.current }

    // children counter
    let checkedChildrenCount: Record<string, number> = {}
    let countNeedUpdate = true
    const getChildrenCount = (path: string) => {
        if (countNeedUpdate) {
            checkedChildrenCount = {}
            const rootNode = nodeMap[""]
            if (!rootNode) {
                throw new Error("root node does not exists")
            }
            traverseNode(rootNode, node => {
                checkedChildrenCount[node.path] = 0
                return true
            }, node => {
                const checked = checkedMap[node.path]
                const val = checked === undefined || checked ? 1 : 0
                checkedChildrenCount[node.path] += val
                if (node.parent) {
                    const ppath = node.parent.path
                    checkedChildrenCount[ppath] += checkedChildrenCount[node.path]
                }
            })
            countNeedUpdate = false
        }
        return checkedChildrenCount[path]
    }

    const templateDataMapping: Record<number, FileTemplate> = {}
    const templateFileMapping: Record<number, string> = {}
    const updateCheckedColors = debounce(() => {
        Object.keys(templateFileMapping).forEach(templateID => {
            const template = templateDataMapping[templateID]
            const path = templateFileMapping[templateID]

            template.monacoIconLabel.classList.remove(classHasChildrenChecked)
            if (getChildrenCount(path) > 0) {
                template.monacoIconLabel.classList.add(classHasChildrenChecked)
            }
        })
    }, 500)


    // create checkbox for each file, avoid reusing them.(template sometimes has bug when reusing checkbox)
    const fileCheckbox: { [path: string]: HTMLInputElement } = {}

    const setChecked = (file: string, checked: boolean, allDescendent: boolean) => {
        countNeedUpdate = true
        updateCheckedColors()
        // console.log("DEBUG setChecked:", file, checked, fileMap[file])
        const prevChecked = checkedMap[file]
        checkedMap[file] = checked
        if (prevChecked !== checked) {
            onCheckedRef.current?.(file, nodeMap[file].isDirectory, checked)
        }
        if (allDescendent) {
            traverseNode(nodeMap[file], n => {
                setChecked(n.path, checked, false)
                return true
            })
        }
        // render visible checkbox
        // const templateID = fileMap[file]
        // if (!templateID) {
        //     // console.log("setChecked no template file:", file, templateID)
        // }
        // if (templateID) { // ^-^, templateID=0 is a humor case.
        //     associatedCheckbox[templateID].element.checked = checked
        // }
        const fCheckbox = fileCheckbox[file]
        if (fCheckbox && fCheckbox.checked !== checked) {
            fCheckbox.checked = checked
        }

        // modify parent's stat
    }
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
                const template = new FileTemplate(container, {
                    render: (target: RenderTarget, file: RenderFile) => {
                        // render only gets executed after expanded
                        // default render
                        target.label.innerText = file.name;
                        target.monacoIconLabel.title = file.path;

                        // custom render
                        opts?.renderPath?.(target, file)
                    }
                })
                template.id = id++
                templateDataMapping[template.id] = template
                return template
            },

            // file template may be reused, so renderElement maybe called multiple times for the same templateData
            renderElement: function (tree, file: RenderFile, templateId, templateDataRaw: RenderTarget & any) {
                const templateData = templateDataRaw as FileTemplate
                templateId = templateData.id
                templateFileMapping[templateId] = file.path
                templateData.set(file);
                if (showCheckbox) {
                    templateData.monacoIconLabel.classList.remove(classHasChildrenChecked)
                    if (getChildrenCount(file.path) > 0) {
                        templateData.monacoIconLabel.classList.add(classHasChildrenChecked)
                    }
                    let checkbox = fileCheckbox[file.path]
                    if (!checkbox) {
                        checkbox = createCheckbox()

                        // set initial value
                        const checked = checkedMap[file.path]
                        checkbox.checked = checked === undefined || checked // default checked
                        checkbox.addEventListener('change', (e) => {
                            countNeedUpdate = true
                            updateCheckedColors()
                            const targetChecked = (e.target as any).checked
                            if (checkedMap[file.path] !== targetChecked) {
                                onCheckedRef?.current?.(file.path, nodeMap[file.path].isDirectory, targetChecked)
                                checkedMap[file.path] = targetChecked
                            }
                        })
                        fileCheckbox[file.path] = checkbox
                    }
                    const p: HTMLElement = templateData.monacoIconLabel.parentElement
                    let data = associatedCheckbox[templateId]
                    if (!data) {
                        data = {
                            path: "" // unrelated
                        }
                        associatedCheckbox[templateId] = data
                    } else {
                        // console.log("render reset el file:", templateId, file.path)
                        // data.element.removeEventListener('change', data.listener)
                        // data.element.remove()

                        // remove element with checkbox role
                        for (let child = p.firstElementChild; child; child = child.nextElementSibling) {
                            if (child.classList.contains(uniqRoleMarkerCheckbox)) {
                                child.remove()
                                break
                            }
                        }
                    }

                    p.prepend(checkbox)
                }
            },
            disposeTemplate: function (tree, templateId, templateData: RenderTarget & any) {
                // console.log("dispose:", templateData)
                templateData.dispose();
            },
        },

        //tree config requires a controller property but we would defer its initialisation
        //to be done by the MonacoTree component
        //controller: createController(this, this.getActions.bind(this), true),
        // dnd: new TreeDnD(),
    };
    return [treeConfig, setChecked]
}