import { CSSProperties, useEffect, useMemo, useRef, useState } from "react"
// import { useLineCodeViewerController } from "../../../code-viewer/LineCodeViewer"
import Checkbox from "../../support/Checkbox"
import { get, postJSON } from "../../support/http"
import { TestingExplorerEditorProps } from "../TestingExplorerEditor"
import { FuncInfo, TestingCase, TestingRequestBase, getFuncFullName } from "../testing"
import { CodeTabProps } from "./CodeTab"
import { TestingSourceExplorer } from "./TestingSourceExplorer"
import { TreeItem } from "./TreeList"
import { buildFileTree } from "./util"
import { useLineCodeViewerController } from "../../../code-viewer/LineCodeViewer"

export interface LocalGitTestingSourceExplorerProps {
    style?: CSSProperties
    className?: string

    codeTabProps?: CodeTabProps
}

async function listFiles(opts?: { compareRef?: string, changedOnly?: boolean }): Promise<string[]> {
    return await postJSON(`http://localhost:16000/api/repo/listFile`, opts, { mapResp: data => data?.files })
}
async function getFile(ref: string, file: string): Promise<string> {
    return await get(`http://localhost:16000/api/repo/file`, { file, commitID: ref, try: true }, { mapResp: data => data?.content })
}

async function getFuncs(file: string): Promise<FuncInfo[]> {
    return await get(`http://localhost:16000/api/ast/getFuncs`, { file }, { mapResp: data => data?.funcs })
}

async function listCase(file: string, func: string): Promise<string[]> {
    return await get(`http://localhost:16000/api/case/v2/list`, { file, func }, { mapResp: data => data?.names })
}

async function runCase<T>(file: string, func: string, request: TestingRequestBase, opts?: { mockData: any }): Promise<RunResult<T>> {
    return await postJSON(`http://localhost:16000/api/case/v2/run`, { file, func, request, mockData: opts?.mockData })
}

export interface RunResult<T> {
    response?: any
    requestID?: any
    error?: string
    extension?: any
}

// why it is so hard to reuse part of logic in React?
// the useState and useEffect can be groupd together, but hard to recognize the boundary
const compareRef = "origin/master"
export function LocalGitTestingSourceExplorer(props: LocalGitTestingSourceExplorerProps) {
    const rootRef = useRef<HTMLDivElement>()
    const [files, setFiles] = useState<string[]>([])

    const fileTree = useMemo(() => buildFileTree(files), [files])

    const [selectedFileItem, setSelectedFileItem] = useState<TreeItem>()
    const [selectedFile, setSelectedFile] = useState('')

    const [funcs, setFuncs] = useState<FuncInfo[]>([])
    const [selectedFunc, setSelectedFunc] = useState('')

    const [caseNames, setCaseNames] = useState<string[]>([])
    const [selectedCaseName, setSelectedCaseName] = useState('')

    const [changedOnly, setChangedOnly] = useState(true)

    const codeController = useLineCodeViewerController()

    const testingEditorProps = useTestingEditorProps({ selectedFile, selectedFunc, selectedCaseName })

    useEffect(() => {
        if (selectedFileItem && selectedFileItem.leaf) {
            setSelectedFile(selectedFileItem.path)
            setSelectedFunc('')
            setSelectedCaseName('')
        }
    }, [selectedFileItem])

    const [oldCode, setOldCode] = useState('')
    const [newCode, setNewCode] = useState('')

    // load files
    useEffect(() => {
        listFiles({ changedOnly: changedOnly, compareRef: compareRef }).then(files => setFiles(files))
    }, [changedOnly])

    // file trigger code loading
    useEffect(() => {
        if (!selectedFile) {
            setOldCode('')
            setNewCode('')
            return
        }
        Promise.all(
            [
                getFile(compareRef, selectedFile),
                getFile("WORKING", selectedFile)
            ]
        ).then(([oldCode, newCode]) => {
            // get oldCode & newCode together to avoid changed diff
            setOldCode(oldCode)
            setNewCode(newCode)
        })
    }, [selectedFile])

    // file trigger func loads
    useEffect(() => {
        setSelectedFunc('')
        if (!selectedFile) {
            setFuncs([])
            return
        }
        getFuncs(selectedFile).then(e => setFuncs(e))
    }, [selectedFile])

    useEffect(() => {
        setSelectedCaseName('')
        if (!selectedFile || !selectedFunc) {
            setCaseNames([])
            return
        }
        listCase(selectedFile, selectedFunc).then(names => {
            setCaseNames(names)
        })
    }, [selectedFile, selectedFunc])

    const [funcNames, funcMapping] = useMemo<[string[], { [key: string]: FuncInfo }]>(() => {
        const m = {}
        funcs?.forEach?.(f => {
            m[getFuncFullName(f)] = f
        })
        return [Object.keys(m), m]
    }, [funcs])

    return <div style={{ border: "1px solid grey" }} ref={rootRef}>
        {/* toolbar */}
        <div style={{ borderBottom: "1px solid grey", paddingLeft: "2px" }}>
            <Checkbox label="Changed Only" value={changedOnly} onChange={e => setChangedOnly(e)}></Checkbox>
        </div>

        <TestingSourceExplorer
            style={{ border: "none" }}
            files={fileTree}
            filesProps={{
                selectedNode: selectedFile,
                onClickItem: item => {
                    setSelectedFileItem(item)
                }
            }}

            funcs={funcNames}
            funcsProps={{
                selectedNode: selectedFunc,
                onClickItem(e) {
                    setSelectedFunc(e.path)
                    const line = Number(funcMapping?.[e.path]?.Line)
                    let scrollYParent: HTMLElement
                    if (rootRef.current) {
                        scrollYParent = rootRef.current.querySelector(".ant-tabs-content-holder") as HTMLElement
                    }
                    codeController.current?.scrollToLine?.(line, {
                        scrollYParent: scrollYParent,
                    })
                },
            }}

            cases={caseNames}
            casesProps={{
                selectedNode: selectedCaseName,
                onClickItem(e) {
                    setSelectedCaseName(e.path)
                }
            }}

            codeTabProps={{
                style: {
                    paddingLeft: "2px"
                },
                file: selectedFile,
                oldCode: oldCode,
                newCode: newCode,
                hideOldCode: !changedOnly,
                lineCodeViewerController: codeController,
                testingEditorProps: testingEditorProps,
            }}
        />
    </div>
}

interface TestingEditorOpts {
    selectedFile: string
    selectedFunc: string
    selectedCaseName: string
}
function useTestingEditorProps(opts: TestingEditorOpts): TestingExplorerEditorProps {
    const { selectedFile, selectedFunc, selectedCaseName } = opts
    // code tabs
    const [testData, setTestData] = useState<TestingCase>()

    useEffect(() => {
        if (!(selectedFile && selectedFunc && selectedCaseName)) {
            setTestData(undefined)
            return
        }
        const dd: Partial<TestingCase> = {
            Comment: "shit",
        }
        setTestData(dd as TestingCase)
    }, [selectedFile, selectedFunc, selectedCaseName])

    return {
        caseName: selectedCaseName,
        caseData: testData,
        async request(req) {
            console.log("req:", req)
            const resp = await runCase(selectedFile, selectedFunc, req)
            console.log("resp:", resp)
            return null
        },
    }
}