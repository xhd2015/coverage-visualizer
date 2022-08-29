import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// see here: https://www.w3schools.com/colors/colors_picker.asp?colorhex=F0FFFF
export enum Color {
    MISSING = "#ffccc7",
    // GREEN = "green",
    // GREEN = "#85e085",
    GREEN = "#c6ecc6",
    CHANGED = "#ffe7ba",
    EXCLUDED = "#d9f7be",
    CALLEE_COLOR = "#bae7ff",
    C_COLOR = "#fff566",
    UNCOVER_CHANGED = "#ff85c0",
    KEY = "#f0f0f0",
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


export function createDecoration(startLine, endLine, color: Color) {
    const colorName = Object.keys(Color).filter(k => Color[k] === color)[0]
    return {
        range: new monaco.Range(startLine, 1, endLine, Number.MAX_SAFE_INTEGER),
        options: {
            className: "decoration-" + colorName,
            zIndex: 3,
            overviewRuler: {
                color: color,
                position: 1,
            },
            minimap: { color: color, position: 1 },
        },
    };
}