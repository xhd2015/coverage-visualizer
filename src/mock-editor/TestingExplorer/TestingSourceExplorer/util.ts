import { ExpandItem } from "../../ExpandList";
import { buildTree } from "../../list/build";
import { traverse } from "../../tree";
import { TreeItem } from "./TreeList";

// import { buildTree } from "@/open-coverage-visualizer/src/mock-editor/list/build"

export function buildFileTree(files: string[]): TreeItem[] {
    const tree = buildTree<TreeItem, string>({
        newItem(path, key, parent, data) {
            return {
                key: key,
                parent,
                path: path.join("/"),
            }
        },
    }, fn => {
        files?.forEach?.(f => {
            const paths = splitPaths(f)
            fn(paths, paths.join("/"))
        })

    })
    // sort
    sortFileTree(tree)
    return tree
}

// sort: dir first,file last
export function sortFileTree<T extends ExpandItem & { children?: T[] }>(items: T[]) {
    traverse(items, (e, ctx, idx, paths) => {
        // sort children
        e.children?.sort?.((a, b) => {
            if ((!!a.leaf) === (!!b.leaf)) {
                return (a.key || '').localeCompare(b.key || '')
            }
            // dir at front
            if (!a.leaf) {
                return -1
            }
            return 1
        })
        return true
    })

}
function splitPaths(f: string): string[] {
    const segs = f?.split?.("/")
    return segs?.filter?.(e => !!e) || []
}