
export interface ColorConfig {
    colorHex: string
}

export type AnnotationKey = 'HAS_COV' | 'NO_COV' | 'CHANGE' | 'DELETE'

const colors: Record<AnnotationKey, ColorConfig> = {
    "HAS_COV": {
        colorHex: "#d0fffb", // light green
    },
    "NO_COV": {
        colorHex: "#ffa50038" // orange lighten
    },
    "CHANGE": {
        colorHex: "#10bb1078" // green
    },
    "DELETE": {
        colorHex: "#ff000040" // red
    }
}

export default colors;