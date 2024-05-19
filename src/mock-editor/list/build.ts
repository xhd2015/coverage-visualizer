import { ExpandItem } from "../ExpandList"

export interface BuildOptions<T extends ExpandItem & { children?: T[] }, V> {
    newItem: (path: string[], key: string, parent: T, data: V) => T
}

// `newItem` does not need to set: leaf, children
export function buildTree<T extends ExpandItem & { children?: T[] }, V>(buildOpts: BuildOptions<T, V>, forEach: (build: (path: string[], data: V) => void) => void): T[] {
    const root = buildOpts.newItem([], "root", null, null)   //  { key: "root", path: [], children: [] }
    root.children = []
    forEach((path: string[], data: V) => {
        let node = root
        let i = 0
        for (const p of path) {
            let next: T
            for (let child of node.children) {
                if (child.key === p) {
                    next = child
                    break
                }
            }
            if (!next) {
                const slice = path.slice(0, i + 1)
                next = buildOpts.newItem(slice, slice.at(-1), node === root ? undefined : node, data)
                next.children = []
                node.children.push(next)
            }
            node = next
            i++
        }
        node.leaf = true
    })
    return root.children
}
