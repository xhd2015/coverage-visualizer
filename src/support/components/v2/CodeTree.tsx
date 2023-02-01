import { useState } from "react"
import { FileDetailGetter, ITreeNode } from "../../support/file"
import Code from "./Code"
import DiffCode from "./DiffCode"
import DirTree, { CodeFileTree, DirTreeControl, FileExtraOptions, PathDecorator } from "./DirTree"
import { ContentDecorator } from "./model"


export interface Control {
    refreshFile: () => void
}
export interface IProps {
    // file tree
    fileTree: CodeFileTree
    extraOptions?: { [path: string]: FileExtraOptions }
    pathDecorater?: PathDecorator
    onFileCheck?: (file: string, dir: boolean, checked: boolean) => void

    checkedMap?: { [file: string]: boolean }
    showCheckbox?: boolean

    // conent
    fileDetailGetter?: FileDetailGetter
    contentDecorator?: ContentDecorator

    //  diff
    showDiff?: boolean
    diffFileDetailGetter?: FileDetailGetter
    diffContentDecorator?: ContentDecorator

    hideDecoratorWhenDiff?: boolean

    dirControl?: DirTreeControl

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
        extraOptions={props.extraOptions}
        onSelectFile={setSelectFile}
        height={props.height}
        onTreeUpdate={props.onTreeUpdate}
        pathDecorater={props.pathDecorater}
        onFileCheck={props.onFileCheck}
        checkedMap={props.checkedMap}
        showCheckbox={props.showCheckbox}
        control={props.dirControl}
    >
        {
            !props.showDiff && <Code
                file={selectFile}
                fileDetailGetter={props.fileDetailGetter}
                contentDecorator={props.contentDecorator}
                containerStyle={{
                    flexGrow: 1
                }}
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