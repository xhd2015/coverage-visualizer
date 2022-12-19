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
import { FileDetailGetter, FileTree, ITreeNode } from "../support/file";
import CodeTree, { Control, refreshTreeConfig as refreshCodeTreeConfig } from "./CodeTree";

interface IProps {
  fileList: FileTree
  fileDetailGetter: FileDetailGetter
  height?: string // default 400px
  codeOnly?: boolean
}

interface IState {
  rootDir: ITreeNode,
  treeConfig: any,
  activeFile: string,
  label?: string
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

export default function CoverageVisualizer(props: IProps) {
  const [label, setLabel] = useState("")
  const ctrl = {} as Control

  const pathDecorator = {
    renderPath(target, file) {
      return renderPath(props.fileList, props.codeOnly, target, file)
    }
  }
  const fileTree = {
    getRoot(): Promise<ITreeNode> {
      return props.fileList.getRoot()
    },
    refresh(): Promise<void> {
      return props.fileList.refresh(label)
    }
  }

  return <CodeTree control={ctrl} fileTree={fileTree} fileDetailGetter={props.fileDetailGetter} pathDecorater={pathDecorator} />
}

async function renderPath(fileList: FileTree, codeOnly: boolean, target: any, file: any) {
  const decoration = await fileList.getPathDecorations(file.path)
  const renderCov = !codeOnly && decoration && decoration.total > 0

  console.log("render file:", file, renderCov, codeOnly)

  if (renderCov) {
    target.label.innerHTML = renderPathCovHTML(file.name, decoration.total, decoration.covered)
  } else {
    target.label.innerHTML = `<div>${file.name}<div>`;
  }
  target.monacoIconLabel.title = file.path;
}


export type CoverageMode = 'percentage' | 'line'

export interface renderCovPathOptions {
  ratioBase?: number // 0.5
  coverageMode?: CoverageMode
}

export function div(a: number, b: number): number {
  if (b > 0 && a >= 0) {
    return a / b
  }
  return 1
}
export function renderPathCovHTML(filename: string, total: number, covered: number, opts?: renderCovPathOptions): string {
  if (total > 0) {
    const ratioBase = opts?.ratioBase > 0 ? opts.ratioBase : 0.5
    const coverRatio = div(covered, total)
    const color = coverRatio >= ratioBase ? "green" : "red"
    const { coverageMode } = opts || {}
    const showValue = coverageMode === 'line' ? `${covered} / ${total}` : divPercentFloor(covered, total)
    return `<div>${filename} <span style="color: ${color}"><small>${showValue}</samll></span><div>`
  } else {
    return `<div>${filename}<div>`;
  }
}

export function divPercentFloor(a, b): string {
  if (b > 0) {
    return percentFloor(a / b)
  }
  return ''
}
export function divPercentFloorInt(a, b): string {
  if (b > 0) {
    const r = a / b
    return `${Math.floor(Number(r * 100))}%`
  }
  return ''
}

export function percentFloor(r): string {
  if (r >= 0) {
    return `${floorWithTwoPoints(r)}%`
  }
  return ''
}
export function floorWithTwoPoints(x: number): number {
  return Math.floor(Number(x * 10000)) / 100
}