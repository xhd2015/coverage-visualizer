import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Color, createDecoration } from "./decoration";
import { FileDetail, FileInfo as XFileInfo, FileTree, NodeTreeBuilder, ITreeNode, NodeTree, PathDecoration } from "./file";
import { Promised } from "./promised";

export interface Config {
    labelConfig: { [label: string]: LabelConfig }
}
export interface LabelConfig {
    unrelatedColor?: string
    uncoveredColor: string
    coveredColor: string
}

export interface Stat {
    enable: boolean
    count: number
}

// CoverageProfile the root coverage profile 
export interface CoverageProfile {
    modPath: string
    pkgs: CoveragePkgs
}
export interface CoveragePkgs {
    [pkgPath: string]: Package
}
export interface Package {
    name: string
    fileMapping: { [shortFilename: string]: FuncStmtsMap }
}
export interface FuncStmtsMap {
    [funcName: string]: Func
}

export interface Func {
    range: Block
    labels: string[]
    blocks: BlockStats[]
}

export interface Block {
    startLine: number
    startCol: number
    endLine: number
    endCol: number
}

export interface BlockStats extends Block {
    count: { [label: string]: number }
}

interface covVisitor {
    visitPackage?: (pkgPath: string) => any
    visitPackagePost?: (pkgPath: string) => any
    visitFile?: (pkgPath: string, shortFilename: string) => any
    visitFilePost?: (pkgPath: string, shortFilename: string) => any
    visitFunc?: (pkgPath: string, shortFilename: string, funcName: string, fn: Func) => any
    visitFuncPost?: (pkgPath: string, shortFilename: string, funcName: string, fn: Func) => any
    visitBlock?: (pkgPath: string, shortFilename: string, funcName: string, fn: Func, block: BlockStats) => any
}
function traverseCovBlocks(covProfile: CoveragePkgs, visitor: covVisitor) {
    Object.keys(covProfile || {}).forEach(pkgPath => {
        if (visitor.visitPackage && !visitor.visitPackage(pkgPath)) {
            return
        }

        const fileMap = covProfile[pkgPath]?.fileMapping || {}
        Object.keys(fileMap).forEach(shortFilename => {

            if (visitor.visitFile && !visitor.visitFile(pkgPath, shortFilename)) {
                return
            }

            const funcMap = fileMap[shortFilename]
            Object.keys(funcMap).forEach(funcName => {
                const fn = funcMap[funcName] as Func
                if (visitor.visitFunc && !visitor.visitFunc(pkgPath, shortFilename, funcName, fn)) {
                    return
                }
                if (visitor.visitBlock) {
                    (fn.blocks || []).forEach(block => {
                        visitor.visitBlock(pkgPath, shortFilename, funcName, fn, block)
                    })
                }
                visitor.visitFuncPost?.(pkgPath, shortFilename, funcName, fn)
            })

            visitor.visitFilePost?.(pkgPath, shortFilename)
        })

        visitor.visitPackagePost?.(pkgPath)
    })
}

export interface CoverageProfileGetter {
    get: () => Promise<CoverageProfile | null>
}

export interface CoverageFileInfo {
    pathDecorations: PathDecoration
    fileDecorations?: monaco.editor.IModelDeltaDecoration[]
}

// implements FileList
export class CoverageProfileFiles implements FileTree {

    covProfile: CoverageProfile | Promised<CoverageProfile>

    nodeTree: NodeTree<CoverageFileInfo>
    labels: string[]

    constructor(covProfile: CoverageProfile | CoverageProfileGetter) {
        this.covProfile = 'get' in covProfile ? new Promised((covProfile as CoverageProfileGetter).get) : covProfile
    }
    get _profile(): Promise<CoverageProfile | null> {
        return this.covProfile instanceof Promised ? this.covProfile.value : Promise.resolve(this.covProfile)
    }


    async refresh(label: string): Promise<any> {
        const profile = await this._profile
        const labels = {}
        labels[""] = true // empty label always available

        const trimPkgPath = (s) => {
            if (profile.modPath && s.startsWith(profile.modPath)) {
                s = s.slice(profile.modPath.length)
            }
            return s
        }

        const builder = new NodeTreeBuilder<CoverageFileInfo>(null, "")
        // collect all files
        traverseCovBlocks(profile.pkgs, {

            visitPackage(pkgPath) {
                builder.navigate(trimPkgPath(pkgPath)).data = {
                    pathDecorations: {
                        total: 0,
                        covered: 0,
                        hit: 0,
                    }
                }
                return true
            },
            visitFile(pkgPath, shortFilename) {
                const fileBuilder = builder.navigate(trimPkgPath(pkgPath)).navigate(shortFilename)
                fileBuilder.markFile()
                fileBuilder.data = {
                    pathDecorations: {
                        total: 0,
                        covered: 0,
                        hit: 0,
                    },
                    fileDecorations: []
                }
                return true
            },
            visitFilePost(pkgPath, shortFilename) {
                const fileNode = builder.navigate(trimPkgPath(pkgPath)).navigate(shortFilename)

                // recursively add to all parent
                let node = fileNode
                while (node.parent) {
                    node.parent.data.pathDecorations.total += fileNode.data.pathDecorations.total
                    node.parent.data.pathDecorations.covered += fileNode.data.pathDecorations.covered
                    node.parent.data.pathDecorations.hit += fileNode.data.pathDecorations.hit
                    node = node.parent
                }
            },
            visitFunc(pkgPath, shortFilename, funcName, fn) {
                fn.labels?.forEach(e => labels[e] = true)
                // console.log("traversing fn:", pkgPath, shortFilename, funcName, fn.labels)
                // let canDo = !label || fn.labels?.includes?.(label)
                // console.log("canDO fn:", pkgPath, shortFilename, funcName, canDo)
                return !label || fn.labels?.includes?.(label)
            },
            visitBlock(pkgPath, shortFilename, funcName, fn, block) {

                const fb = builder.navigate(trimPkgPath(pkgPath)).navigate(shortFilename)

                // add pkg stat, file stat


                const pathStat = fb.data.pathDecorations
                const decorations = fb.data.fileDecorations

                const count = block.count[label || ''] || 0

                pathStat.total++
                if (count > 0) {
                    pathStat.covered++
                }
                pathStat.hit += count


                // const pkgFile = `${pkgPath}/${shortFilename}`
                // console.log("traversing:", label, funcName, fn, block, pkgFile, count)
                decorations.push(createDecoration(
                    block.startLine,
                    block.endLine,
                    count > 0 ? Color.GREEN : Color.MISSING,
                ))
                return true
            },
        })

        this.nodeTree = builder.build()
        console.log("root:", this.nodeTree)
        console.log("range labels:", labels)
        this.labels = Object.keys(labels)
        return
    }

    async getRoot(): Promise<ITreeNode | null> {
        return this.nodeTree.getRoot()
    }


    getLabels(): Promise<string[]> {
        return Promise.resolve(this.labels)
    }

    async getPathDecorations(path: string): Promise<any> {
        // console.log("getPathDecorations:", path, this.nodeTree.mapping[path])
        return this.nodeTree.mapping[path]?.info?.pathDecorations
    }

    async getFileDecorations(path: string): Promise<monaco.editor.IModelDeltaDecoration[]> {
        return this.nodeTree.mapping[path]?.info?.fileDecorations
    }
}

function div(a, b) {
    if (b > 0 && a >= 0) {
        return a / b
    }
    return 1
}

export function renderPathDecoration(decoration: PathDecoration, okThreshold: number) {
    if (decoration && decoration.total > 0) {
        return renderCover(decoration.covered, decoration.total, okThreshold)
    }
    return {
        color: "",
        ratioText: "",
    }
}


export function renderCover(covered, total, okThreshold) {
    const coverRatio = div(covered, total)
    const color = coverRatio >= okThreshold ? "green" : "red"
    return {
        color,
        ratioText: `${(coverRatio * 100).toFixed(2)}%`
    }
}
