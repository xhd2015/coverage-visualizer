import { useEffect, useState } from "react";
import { Color, createDecorationV2 } from "../support/decoration";
import { FileDetail, ITreeNode, NodeTreeBuilder } from "../support/file";
import CodeTree from "./CodeTree";


export default function CodeTreeDiffDemo() {
    const files = {
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
    }

    const nodeBuilder = new NodeTreeBuilder<void>(null, "")
    Object.keys(files).forEach(file => nodeBuilder.navigate(file).markFile())
    const root = nodeBuilder.build()

    const [showDiff, setShowDiff] = useState(true)
    // const [showDiff, setShowDiff] = useState(false)
    useEffect(() => {
        (window as any).setShowDiff = setShowDiff
    }, [])

    return <CodeTree
        showDiff={showDiff}
        fileTree={{
            getRoot(): Promise<ITreeNode> {
                return root.getRoot()
            },
        }}
        fileDetailGetter={{
            async getDetail(filename: string): Promise<FileDetail | null> {
                await new Promise(resolve => setTimeout(resolve, 1000))
                return await Promise.resolve({ content: files[filename].content })
            },
        }}
        contentDecorator={{
            getFileDecorations(path): Promise<monaco.editor.IModelDeltaDecoration[]> {
                return Promise.resolve([createDecorationV2(7, 2, 7, 10, Color.GREY)])
            },
        }}
        diffFileDetailGetter={{
            getDetail(filename: string): Promise<FileDetail | null> {
                return Promise.resolve({ content: files[filename].oldContent })
            },
        }}
    />
}