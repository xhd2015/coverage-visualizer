import { useEffect, useMemo, useState } from "react"
import { createDecorationV2 } from "../../support/decoration"
import { FileDetail, FileDetailGetter, ITreeNode, NodeTreeBuilder } from "../../support/file"
import Code from "./Code"
import CodeTree from "./CodeTree"
import DiffCode from "./DiffCode"
import DirTree, { CodeFileTree, DirTreeControl, PathDecorator, RenderFile, RenderTarget } from "./DirTree"
import { ContentDecorator } from "./model"


import "./code.css"

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
}

export default function CodeTreeSelectDemo(props: IProps) {

    const [files, setFiles] = useState({
        "main.go": {
            content: `just some text
abcz
zzzzefgh
Some more text.
This line is removed on the left.

This is what we've done.
`,
            oldContent: `This line is removed on the right.
just some text
abcd
efgh
Some more text

This is what we've done.
`,
        },
        "a/b.go": {
            content: "package hello",
            oldContent: "package what"
        },
        "a/c/d.go": {
            content: "package hello",
            oldContent: "package what"
        },
    })



    const [fileTree, setFileTree] = useState(null as any)
    const [state, setState] = useState({} as any)

    const [dirControl] = useState({} as DirTreeControl)


    useEffect(() => {
        const nodeBuilder = new NodeTreeBuilder<void>(null, "")
        Object.keys(files).forEach(file => nodeBuilder.navigate(file).markFile())
        const root = nodeBuilder.build()

        const fileTree = {
            getRoot(): Promise<ITreeNode> {
                return root.getRoot()
            },
        }
        setFileTree(fileTree)

        const fileDetailGetter = {
            async getDetail(filename: string): Promise<FileDetail | null> {
                await new Promise(resolve => setTimeout(resolve, 1000))
                return await Promise.resolve({ content: files[filename].content })
            },
        }
        const contentDecorator = {
            getFileDecorations(path): Promise<monaco.editor.IModelDeltaDecoration[]> {
                return Promise.resolve([createDecorationV2(7, 2, 7, 10, 'NO_COV')])
            },
        }

        setState({ fileDetailGetter, contentDecorator })

    }, [files])

    const [checkedMap] = useState({
        "main.go": true,
    })

    return <CodeTree
        fileTree={fileTree}
        fileDetailGetter={state.fileDetailGetter}
        contentDecorator={state.contentDecorator}
        dirControl={dirControl}
        checkedMap={checkedMap}
        showCheckbox={true}
        onFileCheck={(file: string, checked: boolean) => {
            console.log("file checked:", file, checked)
            checkedMap[file] = checked

            const c = dirControl.getCheckbox(file)
            // may not be expanded yet
            c?.setCheckedAllDescendents?.(checked)

            console.log("current checkedMap:", checkedMap)
        }}
    />
}