import { debounce } from "lodash";
import React, { useEffect, useState } from "react";
import { useCurrent } from "../../../react-hooks";
import Button from "../../../support/Button";
import Checkbox from "../../../support/Checkbox";
import { ConfirmDialog } from "../../../support/Dialog";
import EditView from "../../../support/EditView";
import TextEditor from "../../../TextEditor";
import "./TestingEditor.css";

export interface TestingCaseConfig {
    name: string
    skip?: boolean
    comment?: string
    expectErr?: boolean
    expectResponse?: string
    expectErrStr?: string
    request?: string

}

type ResultStatus = "pass" | "fail" | "warning"

// the readonly part
export interface TestingCaseResult {
    responseError?: string
    response?: string

    status?: ResultStatus
    msg?: string
}

const debouncedCheckModified = debounce((initialConfig: TestingCaseConfig, curConfig: TestingCaseConfig, callback: (v: boolean) => void) => {
    callback(checkConfigModified(initialConfig, curConfig))
}, 200)

function checkConfigModified(initialConfig: TestingCaseConfig, curConfig: TestingCaseConfig) {
    const keys = {}
    Object.keys(initialConfig || {}).forEach(e => keys[e] = true)
    Object.keys(curConfig || {}).forEach(e => keys[e] = true)
    for (let key in keys) {
        if (!checkKeySame(key, initialConfig?.[key], curConfig?.[key])) {
            // console.log("changed:", key, initialConfig?.[key], curConfig?.[key])
            return true
        }
    }
    return false
}
function checkKeySame(key: string, initValue: string, curValue: string): boolean {
    if (key === "name" && curValue === "TODO" && !initValue) {
        return true
    }
    if (!initValue) {
        return !curValue
    }
    if (!curValue) {
        return !initValue
    }
    return initValue === curValue
}

export interface TestingEditorControl {
    readonly config: TestingCaseConfig

    readonly saving: boolean
    setSaving: (saving: boolean) => void

    readonly requesting: boolean
    setRequesting: (requesting: boolean) => void

    confirmOrDo: (action: () => Promise<void>) => void
}

export interface TestingEditorProps {
    config?: TestingCaseConfig
    result?: TestingCaseResult

    controllerRef?: React.MutableRefObject<TestingEditorControl>

    // header element
    header?: any
    mockEditor?: any

    onChange?: (conf: TestingCaseConfig) => void
    saveHandler?: () => Promise<void>
    onRequest?: () => void
}

function getResultHint(resultStatus: ResultStatus) {
    let color = ""
    let title = ""
    if (resultStatus === "fail") {
        color = "red"
        title = "FAIL"
    } else if (resultStatus === "pass") {
        color = "green"
        title = "PASS"
    } else if (resultStatus === "warning") {
        color = "orange"
        title = "WARN"
    }
    return { color, title }
}
export default function (props: TestingEditorProps) {
    const { config, result } = props

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    const [name, setName] = useState<string>(config?.name ?? "TODO")
    const [skip, setSkip] = useState<boolean>(config?.skip)
    const [comment, setComment] = useState<string>(config?.comment)
    const [expectErr, setExpectErr] = useState<boolean>(config?.expectErr)
    const [expectErrStr, setExpectErrStr] = useState(config?.expectErrStr)
    const [expectResponse, setExpectResponse] = useState(config?.expectResponse)
    const [request, setRequest] = useState(config?.request)

    const { response, responseError, status: resultStatus, msg: resultMsg } = result || {}
    const { color: hintColor, title: hintTitle } = getResultHint(resultStatus)

    const [saving, setSaving] = useState(false)
    const [requesting, setRequesting] = useState(false)

    // compare value's to get modified status
    const initialVal = useCurrent(props.config)

    // const getConfig = ()=>

    // compute modified
    const onChangeRef = useCurrent(props.onChange)
    const [modified, setModified] = useState(false)
    useEffect(() => {
        const conf: TestingCaseConfig = { name, skip, comment, expectErr, expectErrStr, expectResponse, request }
        debouncedCheckModified(initialVal.current, conf, (modified) => {
            setModified(modified)
            if (modified) {
                onChangeRef.current?.(conf)
            }
        })
    }, [name, skip, comment, expectErr, expectErrStr, expectResponse, request])

    // watch input config
    useEffect(() => {
        setName(config?.name ?? "TODO")
        setSkip(config?.skip)
        setComment(config?.comment)
        setExpectErr(config?.expectErr)
        setExpectErrStr(config?.expectErrStr)
        setExpectResponse(config?.expectResponse)
        setRequest(config?.request)
    }, [config])

    const doSave = async () => {
        if (!props.saveHandler) {
            return
        }
        setSaving(true)
        await (async () => props.saveHandler?.())().finally(() => setSaving(false))
        setModified(false)
    }
    // reset
    // useEffect(() => {
    //     setModified(false)
    // }, [props.initialValue])

    const [action, setAction] = useState<() => Promise<void>>()
    if (props.controllerRef) {
        props.controllerRef.current = {
            saving,
            setSaving,
            requesting,
            setRequesting,
            config: {
                name, skip, comment, expectErr, expectErrStr, expectResponse, request
            },
            confirmOrDo(action) {
                if (!modified) {
                    return action()
                }
                setAction(() => action)
                setShowConfirmDialog(true)
            },
        }
    }

    return <div>
        {props.header}
        <div className="flex-center">
            <div style={{ display: "flex", alignItems: "baseline" }}>
                <div className="testing-editor-title" >Name:</div>
                <EditView
                    value={name}
                    onChange={(value) => {
                        setName(value)
                    }}
                />
                <Checkbox label="Skip" value={skip} onChange={(value) => {
                    setSkip(value)
                }} style={{ marginLeft: "12px", alignSelf: "end" }} />
            </div>
            <div style={{ marginLeft: "auto" }}>
                <Button
                    className="testing-editor-button"
                    loading={saving}
                    onClick={doSave}
                > <span>{saving ? "Saving" : "Save"}{modified && "*"}</span></Button></div>
        </div>
        <div >
            <div className="testing-editor-title">Comment</div>
            <CommentEditor value={comment} onChange={setComment} />
        </div>

        <div style={{ display: "flex", width: "100%", flexWrap: "wrap" }}>
            <div style={{ width: "50%" }}>
                <div className="testing-editor-title">Request</div>
                <RequestEditor value={request} onChange={setRequest} />
            </div>

            <div style={{ width: "49%", marginLeft: "4px" }}>
                <div className="flex-center">
                    <div className="testing-editor-title">Expect</div>
                    <Checkbox label="Error" value={expectErr} onChange={setExpectErr} style={{ marginLeft: "12px", alignSelf: "end" }} />
                </div>
                <ExpectEditor
                    expectErr={expectErr}
                    expectErrStr={expectErrStr}
                    onChangeExpectErrStr={setExpectErrStr}
                    expectResponse={expectResponse}
                    onChangeExpectResponse={setExpectResponse}
                />
            </div>
        </div>

        {result &&
            <div style={{ width: "100%" }}>
                <div style={{ width: "100%", height: "1px", backgroundColor: hintColor }}></div>
                {resultStatus !== "pass" && <div style={{ color: hintColor }}>
                    <span>{hintTitle}:</span>
                    <span>{resultMsg}</span>
                </div>
                }
            </div>
        }

        <div >
            <Button
                className="testing-editor-button"
                style={{
                    marginLeft: "auto", marginRight: "auto", marginTop: "10px"
                }}
                loading={requesting}
                onClick={() => {
                    props.onRequest?.()
                }}
            >Request</Button>
        </div>

        <div>
            <div className="testing-editor-title">Response</div>
            <ResponseEditor value={response} error={responseError} />
        </div>

        <div>
            <div className="testing-editor-title">{"Mock & Trace"}</div>
            {props.mockEditor}
        </div>


        <ConfirmDialog
            title="Unsaved*"
            msg="You have made changes, save or discard?"
            confirmText="Save"
            onDiscard={() => action?.()}
            onConfirm={() => {
                doSave().then(action)
            }}
            show={showConfirmDialog}
            onShow={setShowConfirmDialog}
        />

    </div>
}

interface CommentEditorProps {
    value?: string
    onChange?: (value: string) => void
}
export function CommentEditor(props: CommentEditorProps) {
    return <textarea
        style={{ borderColor: "#e1e0e0", width: "100%", }}
        value={props.value || ""} // value can be undefined, in which case it is not passed to textarea
        onChange={e => {
            props.onChange?.(e.target.value)
        }}
    />
}

interface RequestEditorProps {
    value?: string
    onChange?: (value: string) => void
}

export function RequestEditor(props: RequestEditorProps) {
    return <TextEditor
        value={props.value}
        onChange={props.onChange}
        language="json"
    />
}

interface ExpectEditorProps {
    expectErr?: boolean

    expectResponse?: string
    onChangeExpectResponse?: (value: string) => void

    expectErrStr?: string
    onChangeExpectErrStr?: (value: string) => void
}
export function ExpectEditor(props: ExpectEditorProps) {
    return <>{
        props.expectErr ? <TextEditor
            value={props.expectErrStr}
            onChange={props.onChangeExpectErrStr}
        /> : <TextEditor
            value={props.expectResponse}
            onChange={props.onChangeExpectResponse}
            language="json"
        />
    }
    </>
}

interface ResponseEditorProps {
    error?: string
    value?: string
    // onChange?: (value: string) => void
}
export function ResponseEditor(props: ResponseEditorProps) {
    return <>{props.error ?
        <TextEditor
            value={props.error}
            readonly={true}
        /> : <TextEditor
            value={props.value}
            language="json"
            readonly={true}
        />}</>
}