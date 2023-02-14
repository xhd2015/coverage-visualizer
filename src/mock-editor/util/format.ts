
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

// TODO: make this bigint safe
export function objectifyData(s: string) {
    if (s === undefined) {
        return
    }
    if (s === null) {
        return null
    }
    if (!s) {
        return undefined
    }
    try {
        return JSON.parse(s)
    } catch (e) {
        return s
    }
}