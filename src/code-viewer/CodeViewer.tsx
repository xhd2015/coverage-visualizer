import { CSSProperties, useEffect, useMemo, useRef } from 'react';
import "./CodeViewer.css"
import { Line, LineProps } from './Line';

export interface CodeViewerProps {
    value?: string
    style?: CSSProperties
    className?: string

    renderLineProps?: (value: string, lineNumber: number) => (LineProps | undefined | void)
}

export default function (props: CodeViewerProps) {
    const lines = useMemo(() => props.value?.split?.("\n")?.map?.(line => line + "\n"), [props.value])
    return <div
        className={`code-viewer ${props.className ?? ""}`}
        style={props.style}
    >
        {lines?.map?.((line, i) => <Line
            value={line}
            lineNumber={i + 1}
            key={i + 1}
            {...props.renderLineProps?.(line, i + 1)}
        />)}
    </div>
}