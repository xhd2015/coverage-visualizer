// CoverageVisualizer is not only a coverage visualizer, the coverage feature is opt-in.
// you can also disable it to get a code viewer.
import React, { useEffect, useState } from "react";
import { ITreeNode, NodeTreeBuilder } from "../../support/file";

import DirTree, { CodeFileTree } from "./DirTree";

export default function DirTreeDemo() {

    const [fileTree, setFileTree] = useState(null as CodeFileTree)
    const [selectFile, setSelectFile] = useState("")

    // ensure the file models change only when data source change
    useEffect(() => {
        const files = [
            "main.go",
            "a/b.go",
            "a/c/d.go",
        ]
        const nodeBuilder = new NodeTreeBuilder<void>(null, "")
        files.forEach(file => nodeBuilder.navigate(file).markFile())

        const root = nodeBuilder.build()

        setFileTree({
            getRoot(): Promise<ITreeNode> {
                return root.getRoot()
            },
        })
    }, [])

    return <DirTree
        fileTree={fileTree}
        onSelectFile={setSelectFile}
    >Selected:<div>{selectFile}</div></DirTree>
}