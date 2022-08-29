import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { createDecoration, Color } from "./decoration"
import { TreeNode } from "../monaco-tree/tree-node"

export interface FileDetailGetter {
    getDetail: (filename: string) => Promise<FileDetail | null>
}

export interface ITreeNode {
    name: string
    key: string
    path: string
    isDirectory: boolean
    children?: ITreeNode[]
    parent: ITreeNode
}

export interface FileTreeGetter {
    // get root file
    getRoot: () => Promise<ITreeNode | null>
}

// file scope statistics
export interface FileTree extends FileTreeGetter {
    // prepare data
    refresh: (label: string) => Promise<any>

    getLabels: () => Promise<string[]>
    // path decoration is shown in the tree
    getPathDecorations: (path: string) => Promise<PathDecoration>

    // content decorations is shown in the code editor
    getFileDecorations: (path: string) => Promise<monaco.editor.IModelDeltaDecoration[]>
}

export interface PathDecoration {
    total: number
    covered: number
    hit: number
}
export interface FileInfo {
    name: string
    isDir?: boolean
    children?: FileInfo[]
}

export interface FileDetail {
    content: string
    language?: string
}

export class PlainFileList {
    files: { [filename: string]: FileInfo }
    details: { [filename: string]: FileDetail }
    constructor(files, details) {
        this.files = files
        this.details = details
    }
    async listFiles(): Promise<{ [filename: string]: FileInfo } | null> {
        return this.files
    }
    async getDetail(filename: string): Promise<FileDetail | null> {
        return this.details?.[filename]
    }
}

export class LocalFileDetailGetter implements FileDetailGetter {
    contentMap: { [filename: string]: FileDetail }
    constructor(contentMap: { [filename: string]: FileDetail }) {
        this.contentMap = contentMap
    }
    getDetail(filename: string): Promise<FileDetail> {
        return Promise.resolve(this.contentMap[filename])
    }
}

export interface ApiOptions {
    request?: (param: any) => any
    response?: (resp: any) => any
}


export class RemoteFileDetailGetter {
    api: string
    dir: string
    opts?: ApiOptions

    fileContent: { [filename: string]: Promise<FileDetail | null> }
    constructor(api, dir, opts?: ApiOptions) {
        this.api = api
        this.dir = dir
        this.opts = opts
        this.fileContent = {}
    }

    async getDetail(filename: string): Promise<FileDetail | null> {
        let detail = this.fileContent[filename]
        if (!detail) {
            const paramsObj = { dir: this.dir, file: filename }
            this?.opts?.request?.(paramsObj)
            const params = new URLSearchParams(paramsObj).toString()
            detail = fetch(`${this.api}?${params}`).then(res => res.json()).then(resp => {
                const content = this.opts?.response ? this.opts.response(resp) : resp?.data
                // console.log("get data:", content)
                return {
                    content,
                }
            })
            this.fileContent[filename] = detail
        }
        return Promise.resolve(detail)
    }
}

export class RemoteFileList {
    api: string
    dir: string
    opts?: ApiOptions
    filesLoadPromise: Promise<any>
    files: { [filename: string]: FileInfo }

    constructor(api, dir, opts?: ApiOptions) {
        this.api = api
        this.dir = dir
        this.opts = opts
    }
    async listFiles(): Promise<{ [filename: string]: FileInfo } | null> {
        console.log("enter listFiles")
        if (this.files) {
            console.log("return listFiles")
            return this.files
        }
        if (!this.filesLoadPromise) {
            const paramsObj = { dir: this.dir }
            this?.opts?.request?.(paramsObj)
            const params = new URLSearchParams(paramsObj).toString()
            this.filesLoadPromise = fetch(`${this.api}?${params}`).then(res => res.json()).then(resp => {
                const fileList = this.opts?.response ? this.opts.response(resp) : resp?.data
                console.log("list:", resp)
                const fileMap = {};
                (fileList || []).forEach(k => fileMap[k] = {})
                this.files = fileMap
                return fileMap
            }).catch(e => {
                console.error("fetch err:", e)
            })
        }
        return Promise.resolve(this.filesLoadPromise)
    }
    getDecorations(filename: string, label: string): Promise<monaco.editor.IModelDeltaDecoration[]> {
        console.log("get decorations:", filename, label)
        if (filename === "main.go") {
            return Promise.resolve([createDecoration(6, 6, Color.MISSING)
            ])
        }
        return
    }
}
export interface TreeNodePair<T> {
    node: TreeNode
    info: T
}

export class NodeTree<T> implements FileTreeGetter {
    root: TreeNodePair<T>
    mapping: { [path: string]: TreeNodePair<T> }

    constructor(root: TreeNodePair<T>, mapping: { [path: string]: TreeNodePair<T> }) {
        this.root = root
        this.mapping = mapping
    }

    getRoot(): Promise<ITreeNode | null> {
        return Promise.resolve(this.root.node)
    }
}

export class NodeTreeBuilder<T> {
    name: string
    path: string
    parent: NodeTreeBuilder<T>
    children: NodeTreeBuilder<T>[]
    childrenMapping: { [name: string]: NodeTreeBuilder<T> }

    private markedAsFile: boolean

    // set & readable
    data?: T

    constructor(parent: NodeTreeBuilder<T>, name: string) {
        this.name = name
        this.path = parent && parent.path ? parent.path + "/" + name : name
        this.parent = parent
        this.children = []
        this.childrenMapping = {}
        this.markedAsFile = false
    }

    // navigate through the tree
    // as a special case: 
    //    x.navigate("") = x
    //    x.navigate("/") = x
    navigate(dir: string): NodeTreeBuilder<T> {
        const paths = dir.split("/").filter(e => !!e)
        let node: NodeTreeBuilder<T> = this
        paths.forEach(e => {
            if (node.markedAsFile) {
                throw new Error(`invalid navigation, ${node.path} of ${dir} already marked as a file,cannot navigate as a dir.`)
            }
            let child = node.childrenMapping[e]
            if (!child) {
                child = new NodeTreeBuilder(node, e)
                node.childrenMapping[e] = child
                node.children.push(child)
            }
            node = child
        })
        return node
    }

    // markFile must not duplicate
    markFile(): NodeTreeBuilder<T> {
        if (this.name == "") {
            throw new Error(`invalid navigation, found empty name.`)
        }
        if (this.markedAsFile) {
            throw new Error(`duplicate mark as file: ${this.path}`)
        }
        this.markedAsFile = true
        return this
    }


    // build the node tree
    build(): NodeTree<T> {
        const mapping: { [path: string]: TreeNodePair<T> } = {}
        function doBuild(node: NodeTreeBuilder<T>, parent: TreeNodePair<T>): TreeNodePair<T> {
            const treeNode: ITreeNode = new TreeNode(node.path, node.name, !node.markedAsFile, parent?.node)
            const pair = {
                node: treeNode,
                info: node.data,
            }
            if (!node.markedAsFile) {
                // dir
                treeNode.children = []
                node.children?.forEach?.(ch => {
                    const childBuild = doBuild(ch, pair)
                    treeNode.children.push(childBuild.node)
                })
            }

            mapping[node.path] = pair
            return pair
        }
        return new NodeTree(doBuild(this, null), mapping)
    }
}
