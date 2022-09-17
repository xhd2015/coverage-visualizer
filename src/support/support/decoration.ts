import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// see here: https://www.w3schools.com/colors/colors_picker.asp?colorhex=F0FFFF
// export enum Color {
//     MISSING = "#ffccc7",
//     // GREEN = "green",
//     // GREEN = "#85e085",
//     GREEN = "#c6ecc6",
//     GOOD = "#c6ecc6",
//     CHANGED = "#ffe7ba",
//     EXCLUDED = "#d9f7be",
//     CALLEE_COLOR = "#bae7ff",
//     C_COLOR = "#fff566",
//     UNCOVER_CHANGED = "#ff85c0",
//     KEY = "#f0f0f0",
//     BLACK = "black",
//     GREY = "grey",
// }

export type AnnotationKey = 'HAS_COV' | 'NO_COV'

export const Color: { [key: string]: string } = {
    HAS_COV: "#c6ecc6",
    NO_COV: "#ffccc7",

    // MISSING: "#ffccc7",
    // // GREEN = "green",
    // // GREEN = "#85e085",
    // GREEN: "#c6ecc6",
    // CHANGED: "#ffe7ba",
    // EXCLUDED: "#d9f7be",
    // CALLEE_COLOR: "#bae7ff",
    // C_COLOR: "#fff566",
    // UNCOVER_CHANGED: "#ff85c0",
    // KEY: "#f0f0f0",
    // BLACK: "black",
    // GREY: "grey",
}

// create classes dynamically
export function createClass(name: string, rules: any) {
    var style = document.createElement("style");
    document.getElementsByTagName("head")[0].appendChild(style);
    if (style.sheet?.insertRule) {
        style.sheet.insertRule(name + "{" + rules + "}", 0);
    } else if (style.sheet?.addRule) {
        style.sheet.addRule(name, rules);
    } else {
        throw `cannot create class:${name}`
    }
}

Object.keys(Color).forEach((k) => {
    createClass(".decoration-" + k, `background-color: ${Color[k]};`);
});

// export type colorKey = Object.keys(Color);

export function createDecoration(startLine, endLine, color: AnnotationKey) {
    return createDecorationV2(startLine, 1, endLine, Number.MAX_SAFE_INTEGER, color)
}

export interface DecorationOptinos {
    classNames?: string[]
}
export function createDecorationV2(startLine: number, startColumn: number, endLine: number, endColumn: number, annotation: AnnotationKey, opts?: DecorationOptinos) {
    const color = Color[annotation]
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
                color: color,
                // color: "black",
                position: 1,
            },
            minimap: { color: color, position: 1 },
        },
    };
}