
import { editor } from "monaco-editor";
import JSONEditor, { JSONEditorProps } from "./JSONEditor";
import { SchemaResult } from "./testing";
import * as monaco from "monaco-editor";
import "./TestingEditor.css";
import { useEffect, useRef } from "react";
import { useCurrent } from "./react-hooks";


export interface JSONEditorSchemaProps extends JSONEditorProps {
    schema?: SchemaResult
}

export default function (props: JSONEditorSchemaProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor>()

    // update schema
    useEffect(() => {
        const editor = editorRef.current
        if (!editor) {
            return
        }
        const opts = buildDiagnosticOptions(true, props.schema?.schemas, editor.getModel()?.uri?.toString?.())
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(opts);
    }, [props.schema?.schemas])

    if (props.editorRef) {
        props.editorRef.current = editorRef.current
    }

    const schemaRef = useCurrent(props.schema)
    const replaceRef = useCurrent(props.schema?.replace)
    return <JSONEditor
        {...props}
        editorRef={editorRef}
        onEditorCreated={editor => {
            const opts = buildDiagnosticOptions(true, props.schema?.schemas, editor.getModel()?.uri?.toString?.())
            editor.onDidChangeModel(m => {
                // model changed so update the option to match new one
                const opts = buildDiagnosticOptions(true, schemaRef.current?.schemas, editor.getModel()?.uri?.toString?.())
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions(opts);
            })
            addReplaceFilter(editor, replaceRef)
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions(opts);
            props.onEditorCreated?.(editor)
        }}
    />
}

function buildDiagnosticOptions(validate: boolean, schemas: SchemaResult["schemas"], uriStr: string): monaco.languages.json.DiagnosticsOptions {
    if (!schemas?.length) {
        return null;
    }
    // if something goes wrong, paste the log to vscode-editor playground to check reason
    // console.log(JSON.stringify(res.schemas.slice(0)))
    return {
        validate,
        schemas: [
            {
                ...schemas[0],
                fileMatch: [uriStr],
            },
            ...(schemas?.slice?.(1) || []),
        ],
    }
}

// addReplaceFilter replace short text with long text
function addReplaceFilter(editor: editor.IStandaloneCodeEditor, editReplace: { current: (text: string) => string }) {
    editor.onDidChangeModelContent((e) => {
        if (!editReplace.current) {
            return
        }
        if (e.changes?.length !== 1) {
            return;
        }
        const ch = e.changes[0];
        if (!ch.text) {
            return;
        }
        const newText = editReplace.current?.(ch.text);
        if (!newText) {
            return;
        }
        setTimeout(() => {
            editor.getModel().applyEdits([
                {
                    forceMoveMarkers: true,
                    range: {
                        ...ch.range,
                        endColumn: ch.range.endColumn + ch.text.length,
                    },
                    text: newText,
                },
            ]);
        }, 50 /* 50ms, a moderate value */);
    });
}


export const demoSchema: SchemaResult = {
    schemas: [
        {
            uri: "json://root", // id of the first schema
            schema: {
                type: "object",
                properties: {
                    Mapping: {
                        $ref: "json://child2",
                    },
                    MappingList: {
                        $ref: "json://child1", // reference the second schema
                    },
                },
            },
        },
        {
            uri: "json://child1", // id of the second schema
            schema: {
                type: "object",
                properties: {
                    q1: {
                        enum: ["x1", "x2"],
                    },
                },
            },
        },
        {
            uri: "json://child2",
            schema: {
                type: "object",
                properties: {
                    "g.../src/bizv2/impl": {
                        default: {},
                    },
                    "g.../src/bizv2": {
                        default: {},
                    },
                    "g.../src": {
                        default: {},
                    },
                },
            },
        },
    ],
}
