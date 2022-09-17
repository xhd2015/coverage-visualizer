import { useEffect, useState } from "react";
import { Color, createDecorationV2 } from "../../support/decoration";
import { FileDetail, ITreeNode, NodeTreeBuilder } from "../../support/file";
import DiffCode from "./DiffCode";
import DirTree from "./DirTree";

export default function DiffCodeTreeDemo() {

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
    const [selectFile, setSelectFile] = useState("")
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

    return <DirTree
        fileTree={fileTree}
        onSelectFile={setSelectFile}
    >
        <DiffCode
            file={selectFile}
            fileDetailGetter={state.fileDetailGetter}
            contentDecorator={state.contentDecorator}
            oldFileDetailGetter={state.oldFileDetailGetter}
        />
    </DirTree>
}