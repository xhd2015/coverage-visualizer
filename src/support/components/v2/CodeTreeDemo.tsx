import { useEffect, useState } from "react"
import { Color, createDecorationV2 } from "../../support/decoration"
import { FileDetail, FileDetailGetter, ITreeNode, NodeTreeBuilder } from "../../support/file"
import Code from "./Code"
import CodeTree from "./CodeTree"
import DiffCode from "./DiffCode"
import DirTree, { CodeFileTree, PathDecorator } from "./DirTree"
import { ContentDecorator } from "./model"


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

export default function CodeTreeDemo(props: IProps) {

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
    })
    const [fileTree, setFileTree] = useState(null as any)
    const [state, setState] = useState({} as any)
    // const [showDiff, setShowDiff] = useState(true)
    const [showDiff, setShowDiff] = useState(false)

    useEffect(() => {
        (window as any).setShowDiff = setShowDiff
    }, [])


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
                return Promise.resolve([createDecorationV2(7, 2, 7, 10, Color.GREY)])
            },
        }
        const oldFileDetailGetter = {
            getDetail(filename: string): Promise<FileDetail | null> {
                return Promise.resolve({ content: files[filename].oldContent })
            },
        }

        setState({ fileDetailGetter, contentDecorator, oldFileDetailGetter })

    }, [files])

    return <CodeTree
        fileTree={fileTree}
        showDiff={showDiff}
        fileDetailGetter={state.fileDetailGetter}
        contentDecorator={state.contentDecorator}
        diffFileDetailGetter={state.oldFileDetailGetter}
    />
}