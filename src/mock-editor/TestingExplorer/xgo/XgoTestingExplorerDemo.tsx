import { UrlXgoTestingExplorer, XgoTestingExplorerProps } from "./XgoTestingExplorer"

export interface XgoTestingExplorerDemoProps extends XgoTestingExplorerProps {
}

export function XgoTestingExplorerDemo(props: XgoTestingExplorerDemoProps) {
    return <UrlXgoTestingExplorer {...props}
        style={{
            ...props.style,
            height: "80vh",
        }}
        apiPrefix="http://localhost:7070"
    />
}