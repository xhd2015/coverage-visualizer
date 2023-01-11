
// core tree algorithms

export interface TraverseOptions<T extends { children?: T[] }, C> {
    after?: (e: T, ctx: C, parentCtx: C, idx: number, path: string[]) => void
    root?: C
}

export function traverse<T extends { children?: T[] }, C>(items: T[], before: (e: T, ctx: C, idx: number, path: string[]) => (boolean | [ctx: C, ok: boolean] | [ctx: C] | void), opts?: TraverseOptions<T, C>) {
    let itemPath: string[] = []
    const doTraverse = (item: T, p: C, idx: number) => {
        const res = before(item, p, idx, itemPath)
        let ctx: C
        let ok: boolean
        if (Array.isArray(res)) {
            [ctx, ok] = res
        } else {
            ok = res as boolean
        }
        if (ok === false) {
            return
        }
        item?.children?.forEach?.((e, idx) => {
            itemPath.push((e as any)?.key)
            doTraverse(e, ctx, idx)
            itemPath.pop()
        })
        if (opts?.after) {
            opts?.after(item, ctx, p, idx, itemPath)
        }
    }
    items?.forEach?.((item, idx) => {
        itemPath.push((item as any)?.key)
        doTraverse(item, opts?.root, idx)
        itemPath.pop()
    })
}

export interface FilterOptions<T extends { children?: T[] }, V extends { children?: V[] }> {
    map?: (item: T, children: V[], idx: number, path: string[]) => V
}

// filter
export function filter<T extends { children?: T[] }, V extends { children?: V[] }>(items: T[], predict: (item: T, itemPath: string[]) => boolean, opts?: FilterOptions<T, V>): V[] {
    // debugger
    type FilterItem = { matchChildren: number, children?: V[] }
    const root: FilterItem = { matchChildren: 0, children: [] }
    traverse<T, FilterItem>(items, (e, p) => {
        return [{ matchChildren: 0, children: [] }]
    }, {
        after: (e, c, p, idx, itemPath) => {
            const n = c.matchChildren + (predict(e, itemPath) ? 1 : 0)
            if (n > 0) {
                p.matchChildren += n
                if (opts?.map) {
                    p.children.push(opts?.map?.({ ...e }, c.children, idx, itemPath))
                } else {
                    // if map is not provided, then V is just T
                    p.children.push({ ...e, children: c.children } as any as V)
                }
            }
        },
        root,
    })
    return root.children
}

export interface MapOptions<T extends { children?: T[] }> {
    filter?: (item: T, itemPath: string[]) => boolean
}

// map items with filter
export function map<T extends { children?: T[] }, V extends { children?: V[] }>(items: T[], fn: (item: T, children: V[], idx: number, path: string[]) => V, opts?: MapOptions<T>): V[] {
    return filter<T, V>(items, opts?.filter ? opts.filter : () => true, {
        map: fn,
    })
}