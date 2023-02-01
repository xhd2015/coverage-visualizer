import CodeViewer from "./CodeViewer";
import Prism from 'prismjs';

import "./lang"

export interface CodeViewerDemoProps {
}

export default function CodeViewerDemo(props: CodeViewerDemoProps) {
    console.log("langes:", Prism.languages)
    return <CodeViewer
        style={{
            width: "30%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        renderLineProps={(value, line) => {
            return {
                className: line === 3 || line === 5 ? "code-viewer-line-new" : "",
                grammar: Prism.languages.go,
                language: "go"
            }
        }}
        value={`
}
if len(info.CaseList) > 0 {
    endpointNum++
    matchEndpointList = append(matchEndpointList, info)
}
}
`}
    />
}