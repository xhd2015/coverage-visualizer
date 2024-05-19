export class FileFilter {
    includePatterns: Pattern[]
    excludePatterns: Pattern[]
    constructor(include: string[], exclude: string[]) {
        this.includePatterns = compilePatterns(include);
        this.excludePatterns = compilePatterns(exclude);
    }

    match(file: string) {
        const paths = splitPath(file);
        const hasInclude = this.includePatterns?.length > 0;
        if (hasInclude) {
            if (!matchAnyPattern(this.includePatterns, paths)) {
                return false;
            }
        }
        const hasExclude = this.excludePatterns?.length > 0;
        if (hasExclude) {
            if (matchAnyPattern(this.excludePatterns, paths)) {
                return false;
            }
        }
        return true;
    }
}

export class Pattern {
    exprs: Expr[]
    constructor(exprs: Expr[]) {
        this.exprs = exprs
    }
    matchPrefix(s: string) {
        return matchSegsPrefix(this.exprs, splitPath(s));
    }
    matchPrefixPaths(paths: string[]) {
        return matchSegsPrefix(this.exprs, paths);
    }
}


class Expr {
    doubleStar: boolean
    elements: Element[]
    constructor(doubleStar: boolean, elements: Element[]) {
        this.doubleStar = doubleStar;
        this.elements = elements;
    }
    matchNoDoubleStar(name: string): boolean {
        return this.matchRunesFrom(0, name);
    };
    matchEmpty() {
        for (let i = 0; i < this.elements.length; i++) {
            const part = this.elements[i];
            if (part.kind !== ElemKind.Star) {
                return false;
            }
        }
        return true;
    };
    matchRunesFrom(i: number, s: string) {
        if (i >= this.elements.length) {
            return false;
        }
        const elem = this.elements[i];
        switch (elem.kind) {
            case ElemKind.Star:
                if (this.matchRunesFrom(i + 1, s)) {
                    return true;
                }
                if (s.length > 0) {
                    return this.matchRunesFrom(i, s.slice(1));
                }
                return false;
            case ElemKind.PlainStr:
                const n = elem.chars?.length || 0;
                if (n > s.length) {
                    return false;
                }
                for (let j = 0; j < n; j++) {
                    if (s[j] !== elem.chars?.[j]) {
                        return false;
                    }
                }
                return true;
            default:
                throw new Error("unknown expr kind: " + elem.kind);
        }
    };
}

class Element {
    kind: ElemKind
    chars?: string
    constructor(kind: ElemKind, chars?: string) {
        this.kind = kind
        this.chars = chars
    }
}

export function compilePatterns(patterns: string[]): Pattern[] {
    if (!patterns?.length) {
        return []
    }
    const list: Pattern[] = [];
    for (const p of patterns) {
        const ptn = compilePattern(p);
        list.push(ptn);
    }
    return list;
}

export function compilePattern(s: string): Pattern {
    const segments = splitPath(s);
    const exprs: Expr[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const expr = compileExpr(seg);
        exprs.push(expr);
    }
    const pattern = new Pattern(exprs);
    pattern.exprs = exprs;
    return pattern;
}

export function matchAnyPattern(patterns: Pattern[], paths: string[]) {
    for (const pattern of patterns) {
        if (pattern.matchPrefixPaths(paths)) {
            return true;
        }
    }
    return false;
}

function matchSegsPrefix(exprs, segments: string[]): boolean {
    if (exprs.length === 0) {
        return true;
    }
    const expr = exprs[0];
    if (expr.doubleStar) {
        if (segments.length > 0 && matchSegsPrefix(exprs, segments.slice(1))) {
            return true;
        }
        return matchSegsPrefix(exprs.slice(1), segments);
    }
    if (segments.length === 0) {
        return expr.matchEmpty();
    }

    if (!expr.matchNoDoubleStar(segments[0])) {
        return false;
    }
    return matchSegsPrefix(exprs.slice(1), segments.slice(1));
}

enum ElemKind {
    PlainStr,
    Star
}

function compileExpr(s: string): Expr {
    if (s === "") {
        return new Expr(false, []);
    }
    if (s === "**") {
        return new Expr(true, []);
    }
    const elems: Element[] = [];

    let lastIdx = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch !== "*") {
            continue;
        }
        if (i > lastIdx) {
            elems.push(new Element(ElemKind.PlainStr, s.slice(lastIdx, i)));
        }
        lastIdx = i + 1;
        if (i > 0 && s[i - 1] === "*") {
            continue;
        }
        elems.push(new Element(ElemKind.Star));
    }
    if (lastIdx < s.length) {
        elems.push(new Element(ElemKind.PlainStr, s.slice(lastIdx)));
    }
    return new Expr(false, elems);
}

function splitPath(path) {
    const segments = path.split("/");
    const filtered: string[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg !== "") {
            filtered.push(seg);
        }
    }
    return filtered;
}
