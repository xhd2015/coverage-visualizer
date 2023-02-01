import CodeViewer from "./CodeViewer";



export interface CodeViewerDemoProps {
}

export default function (props: CodeViewerDemoProps) {
    return <CodeViewer
        content={`console.log("hello world")\n`.repeat(100)}
        language={'javascript'}
        style={{
            width: "50%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
    />
}