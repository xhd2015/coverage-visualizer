import { Key } from "react"
import { TestingItemState } from "."
import { ItemPath } from "../../List"

export function listToMap<T extends { key: K }, K extends Key>(list: T[]): Map<K, T> {
    const m = new Map<K, T>()
    if (list != null) {
        for (let e of list) {
            m.set(e.key, e)
        }
    }
    return m
}

const isDev = process.env["NODE_ENV"] == "development"
export function updateData<T extends { key: Key, children?: any[] }>(data: T, path: ItemPath, f: (item: T) => T, opts?: { optional?: boolean }): T {
    if (isDev) {
        if (path != null) {
            for (let p of path) {
                if (!p) {
                    throw new Error(`empty path: ${path.join(".")}`)
                }
            }
        }
    }
    if (path == null || path.length === 0) {
        return f(data)
    }
    const key = path[0]
    const idx = data.children?.findIndex?.(e => e.key === key)
    if (!(idx >= 0)) {
        if (opts?.optional) {
            return data
        }
        throw new Error(`item not found: ${key}`)
    }

    const updatedSubItem = updateData(data.children[idx], path.slice(1), f, opts)

    const newData = { ...data }
    newData.children = updateList(newData.children, idx, updatedSubItem)
    return newData
}

export function updateSubTree<T extends { key: Key, children?: any[] }>(data: T, path: ItemPath, f: (item: T) => T, opts?: { optional?: boolean }): T {
    return doUpdateSubTree(data, path, f, false, opts)
}

function doUpdateSubTree<T extends { key: Key, children?: any[] }>(data: T, path: ItemPath, f: (item: T) => T, foundSubStree: boolean, opts?: { optional?: boolean }): T {
    if (!foundSubStree) {
        if (path == null || path.length === 0) {
            foundSubStree = true
        }
    }
    if (!foundSubStree) {
        const key = path[0]
        const idx = data.children?.findIndex?.(e => e.key === key)
        if (!(idx >= 0)) {
            if (opts?.optional) {
                return data
            }
            throw new Error(`item not found: ${key}`)
        }
        const updatedSubItem = doUpdateSubTree(data.children[idx], path.slice(1), f, false, opts)
        const newData = { ...data }
        newData.children = updateList(newData.children, idx, updatedSubItem)
        return newData
    }
    data = f(data)
    if (data.children != null) {
        data.children = data.children.map(e => doUpdateSubTree(e, null, f, true, opts))
    }
    return data
}

export function updateList<T>(list: T[], idx: number, item: T): T[] {
    return [...list.slice(0, idx), item, ...list.slice(idx + 1)]
}

export function findDataPath<T extends { key: string, children?: any[] }>(data: T, predict: (item: T) => boolean): ItemPath | undefined {
    const res = doFindData(data, predict)
    if (res == null) {
        return null
    }
    return res[1]
}

export function findData<T extends { key: string, children?: any[] }>(data: T, predict: (item: T) => boolean): T | undefined {
    const res = doFindData(data, predict)
    if (res == null) {
        return null
    }
    return res[0]
}

export function findDataAndPath<T extends { key: string, children?: any[] }>(data: T, predict: (item: T) => boolean): [item: T | undefined, ItemPath | undefined] {
    const res = doFindData(data, predict)
    if (res == null) {
        return [null, null]
    }
    return res
}

export function doFindData<T extends { key: string, children?: any[] }>(data: T, predict: (item: T) => boolean): [item: T, ItemPath] | undefined {
    if (data == null) {
        return null
    }
    let prefix: ItemPath = []
    let foundItem: T
    const find = (item: T): boolean => {
        if (predict(item)) {
            foundItem = item
            prefix.push(item.key)
            return true
        }
        if (item.children == null) {
            return false
        }
        prefix.push(item.key)
        for (let child of item.children) {
            if (find(child)) {
                return true
            }
        }
        prefix.pop()
    }
    if (find(data)) {
        return [foundItem, prefix]
    }
    return null
}

export function getDataByPath<T extends { key: string, children?: any[] }>(data: T, path: ItemPath): T | undefined {
    let p = data
    while (p != null && path != null && path.length > 0) {
        if (p.children == null) {
            return null
        }
        const key = path[0]
        p = p.children.find(e => e.key === key)
        path = path.slice(1)
    }
    return p
}

export function patchSubStree<T extends { key: string, children?: any[] }>(data: T, path: ItemPath, subTree: T, merge: (data: T, patch: T) => T): T {
    const n = path?.length
    let idx: number = -1
    if (data != null && data.children != null) {
        idx = data.children.findIndex(e => e.key === (n === 0 ? subTree.key : path[0]))
    }
    if (n == 0) {
        if (data == null) {
            throw new Error(`patch sub tree data cannot be null`)
        }
        if (idx < 0) {
            return { ...data, children: [... (data.children || []), subTree] }
        }
        return {
            ...data,
            children: updateList(data.children, idx, patchData(data.children[idx], subTree, merge))
        }
    } else {
        if (idx < 0) {
            throw new Error(`path not found: ${path[0]}`)
        }
        return {
            ...data,
            children: updateList(data.children, idx, patchSubStree(data.children[idx], path.slice(1), subTree, merge))
        }
    }
}

export function patchData<T extends { key: string, children?: any[] }>(data: T, patch: T, merge: (data: T, patch: T) => T): T {
    if (data == null) {
        return patch
    }
    if (patch == null) {
        return data
    }
    data = merge(data, patch)
    if (patch.children == null) {
        return data
    }
    data = { ...data, children: [...(data.children || [])] }
    for (let child of patch.children) {
        const idx = data.children.findIndex(e => e.key === child.key)
        if (idx < 0) {
            data.children.push(child)
            continue
        }
        data.children[idx] = patchData(data.children[idx], child, merge)
    }
    return data
}


export function updateState<T extends { key: Key, children?: any[], state?: TestingItemState }>(data: T, path: ItemPath, f: (state: TestingItemState) => void, opts?: { optional?: boolean }): T {
    return updateData(data, path, e => {
        const state = { ...e.state }
        f(state)
        return { ...e, state }
    }, opts)
}