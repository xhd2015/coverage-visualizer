export function toIntPercent(s: string, defaultNum?: number): number {
    const n = Number.parseFloat(s)
    if (isNaN(n)) {
        return defaultNum === undefined ? 0 : defaultNum
    }
    return Number((n * 100).toFixed(0))
}

export function toPercent(s: string, defaultStr?: string): string {
    const n = toIntPercent(s, -1)
    if (n === -1) {
        return defaultStr
    }
    return `${n}%`
}

export function getColor(percent: string, variant: "pass" | "fail"): string {
    if (!percent) {
        return ''
    }
    switch (variant) {
        case 'pass':
            return "green"
        case 'fail':
            return 'red'
    }
    return ''
}

export interface CoverageDetail {
    total: LabelDetail
    incrimental: LabelDetail
}

export interface LabelDetail {
    pass: boolean
    value: string // percent in float, e.g. 0.65
}