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
  zeroAsGood?: boolean
}

export function div(a: number, b: number): number {
  if (b > 0 && a >= 0) {
    return a / b
  }
  return 1
}
export function renderPathCovHTML(filename: string, cov: FileCoverage | undefined): string {
  if (!cov) {
    return `<div>${filename}<div>`;
  }

  const color = cov.good ? "green" : "red"
  return `<div>${filename} <span style="color: ${color}"><small>${cov.percent}</samll></span><div>`
}

export interface FileCoverage {
  percent: string
  good?: boolean
}
export interface FileCoverages {
  before?: FileCoverage
  coverage: FileCoverage
}

export function getFileCoverage(total: number, covered: number, opts?: renderCovPathOptions): (FileCoverage | undefined) {
  if (!(total > 0)) {
    if (opts?.zeroAsGood) {
      return { percent: opts?.coverageMode === 'line' ? "0 / 0" : "100%", good: true }
    }
    return
  }
  const ratioBase = opts?.ratioBase > 0 ? opts.ratioBase : 0.5
  const coverRatio = div(covered, total)
  const showValue = opts?.coverageMode === 'line' ? `${covered} / ${total}` : divPercentFloor(covered, total)

  return { percent: showValue, good: coverRatio >= ratioBase }
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
    return `${floorWithoutPoints(r)}%`
  }
  return ''
}
export function floorWithTwoPoints(x: number): number {
  return Math.floor(Number(x * 10000)) / 100
}
export function floorWithoutPoints(x: number): number {
  return Math.floor(Number(x * 100))
}