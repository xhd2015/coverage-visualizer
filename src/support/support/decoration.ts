import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import colors, { AnnotationKey } from "./colors";

// see here: https://www.w3schools.com/colors/colors_picker.asp?colorhex=F0FFFF
import "./cov.css"


// export type colorKey = Object.keys(Color);

export function createDecoration(startLine, endLine, color: AnnotationKey) {
    return createDecorationV2(startLine, 1, endLine, Number.MAX_SAFE_INTEGER, color)
}

export interface DecorationOptinos {
    classNames?: string[]
}
export function createDecorationV2(startLine: number, startColumn: number, endLine: number, endColumn: number, annotation: AnnotationKey, opts?: DecorationOptinos) {
    const colorConf = colors[annotation]
    const classNames = ["decoration-" + annotation]
    if (opts?.classNames?.length > 0) {
        classNames.push(...opts.classNames)
    }
    return {
        range: new monaco.Range(startLine, startColumn, endLine, endColumn),
        options: {
            className: classNames.join(" "),
            // className: "background-black",
            // zIndex: 3,
            overviewRuler: {
                color: colorConf.colorHex,
                position: 1,
            },
            minimap: { color: colorConf.colorHex, position: 1 },
        },
    };
}