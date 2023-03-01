import { useState } from "react"
import JSONEditorSchema from "../mock-editor/JSONEditorSchema"
import Button from "../mock-editor/support/Button"
import TextEditor from "../mock-editor/TextEditor"

export interface RpcMakerProps {
}

export default function RpcMaker(props: RpcMakerProps) {
    return <div>
        <RequestOptions />
        <RequestEditor />
        <Actions />
        <ResponseEditor />
    </div>
}

export interface RequestOptionsProps {
}

export function RequestOptions(props: RequestOptionsProps) {
    return <div style={{ display: "flex" }} className="child-margin-x-5">
        <div>
            <label>Service: </label>
            <select>
                <option>A</option>
            </select>
        </div>

        <div>
            <label>Branch: </label>
            <select>
                <option>A</option>
            </select>
        </div>

        <div>
            <label>Interface: </label>
            <select>
                <option>A</option>
            </select>
        </div>

        <div>
            <label>Method: </label>
            <select>
                <option>A</option>
            </select>
        </div>

        <div>
            <label>Endpoint: </label>
            <select>
                <option>localhost:15000</option>
            </select>
        </div>
    </div>
}


export interface RequestEditorProps {
}

export function RequestEditor(props: RequestEditorProps) {
    const [request, setRequest] = useState<string>()
    return <div>
        <JSONEditorSchema
            value={request}
            onChange={setRequest}
        />
    </div>
}

export interface ActionsProps {
}

export function Actions(props: ActionsProps) {
    return <div>
        <Button
            className="testing-editor-button"
            style={{
                marginLeft: "auto", marginRight: "auto", marginTop: "10px"
            }}
            // loading={requesting}
            onClick={() => {
                // props.onRequest?.()
            }}
        >Request</Button>
    </div>
}

export interface ResponseEditorProps {
    error?: string
    value?: string
}

export function ResponseEditor(props: ResponseEditorProps) {
    return <TextEditor
        language={props.error ? undefined : "json"}
        value={props.error || props.value}
        readonly
    />
}
