export namespace vs {
    const base: string;
    const inherit: boolean;
    const rules: ({
        token: string;
        foreground: string;
        background: string;
        fontStyle?: undefined;
    } | {
        token: string;
        foreground: string;
        background?: undefined;
        fontStyle?: undefined;
    } | {
        token: string;
        fontStyle: string;
        foreground?: undefined;
        background?: undefined;
    })[];
    const colors: {};
}
export namespace vs_dark {
    const base_1: string;
    export { base_1 as base };
    const inherit_1: boolean;
    export { inherit_1 as inherit };
    const rules_1: ({
        token: string;
        foreground: string;
        background: string;
        fontStyle?: undefined;
    } | {
        token: string;
        foreground: string;
        background?: undefined;
        fontStyle?: undefined;
    } | {
        token: string;
        fontStyle: string;
        foreground?: undefined;
        background?: undefined;
    })[];
    export { rules_1 as rules };
    const colors_1: {};
    export { colors_1 as colors };
}
export namespace hc_black {
    const base_2: string;
    export { base_2 as base };
    const inherit_2: boolean;
    export { inherit_2 as inherit };
    const rules_2: ({
        token: string;
        foreground: string;
        background: string;
        fontStyle?: undefined;
    } | {
        token: string;
        foreground: string;
        background?: undefined;
        fontStyle?: undefined;
    } | {
        token: string;
        fontStyle: string;
        foreground?: undefined;
        background?: undefined;
    })[];
    export { rules_2 as rules };
    const colors_2: {};
    export { colors_2 as colors };
}
