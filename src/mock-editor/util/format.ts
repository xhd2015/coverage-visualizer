
export function stringifyData(r: any, indent?: boolean): string {
    if (!r) {
        return ""
    }
    if (typeof r === 'string') {
        return r
    }
    return JSON.stringify(r, null, indent ? "    " : "")
}

export function stringifyDataIndent(r: any) {
    return stringifyData(r, true)
}