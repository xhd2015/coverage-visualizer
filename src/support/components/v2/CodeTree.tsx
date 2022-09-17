import { useState } from "react"
import { FileDetailGetter, ITreeNode } from "../../support/file"
import Code from "./Code"
import DiffCode from "./DiffCode"
import DirTree, { CodeFileTree, PathDecorator } from "./DirTree"
import { ContentDecorator } from "./model"


export interface Control {
    refreshFile: () => void
}
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

    hideDecoratorWhenDiff?: boolean

    control?: Control
    onTreeUpdate?: (root: ITreeNode) => void

    height?: string // default 400px
}

export default function CodeTree(props: IProps) {
    const [selectFile, setSelectFile] = useState("")

    if (props.control) {
        props.control.refreshFile = () => {
            console.log("refresh file")
        }
    }

    return <DirTree
        fileTree={props.fileTree}
        onSelectFile={setSelectFile}
        height={props.height}
        onTreeUpdate={props.onTreeUpdate}
        pathDecorater={props.pathDecorater}
    >
        {
            !props.showDiff && <Code
                file={selectFile}
                fileDetailGetter={props.fileDetailGetter}
                contentDecorator={props.contentDecorator}
            />
        }
        {
            props.showDiff && <DiffCode
                file={selectFile}
                fileDetailGetter={props.fileDetailGetter}
                contentDecorator={props.contentDecorator}
                oldFileDetailGetter={props.diffFileDetailGetter}
                oldContentDecorator={props.diffContentDecorator}
                hideDecoratorWhenDiff={props.hideDecoratorWhenDiff}
            />
        }
    </DirTree>
}