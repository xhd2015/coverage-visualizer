import { ItemPath, isSamePath } from "../../List"
import { map, traverse } from "../../tree"
import { HideType, StateCounters, TestingListItem } from "../TestingList"
import { StatusFilter } from "../TestingList/TestingListWithToolbar"
import { findDataPath, getDataByPath, updateState } from "../TestingList/util"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"

export function filterData(data: TestingItem, statusFilter: StatusFilter, search: string): TestingItem {
    const checkMatch = (item: TestingItem): boolean => {
        if (statusFilter === StatusFilter.Fail) {
            if (item.state?.status !== "fail" && item.state?.status !== "error") {
                return false
            }
        } else if (statusFilter === StatusFilter.Skip) {
            if (item.state?.status !== "skip") {
                return false
            }
        }

        if (search && !item.name?.includes?.(search)) {
            return false
        }

        return true
    }
    const traverse = (data: TestingItem): [TestingItem, boolean] => {
        let match = checkMatch(data)
        data = { ...data }
        if (data.children != null) {
            data.children = data.children.map(child => {
                const [newChild, childMatch] = traverse(child)
                match = match || childMatch
                return newChild
            })
        }
        data.state = { ...data.state, hideType: match ? HideType.None : HideType.All }
        return [data, match]
    }
    if (data == null || data.children == null) {
        return data
    }
    return { ...data, children: data.children.map(e => traverse(e)[0]) }
}

export function toggleExpand(data: TestingItem, maxDepth: number): TestingItem {
    const traverse = (data: TestingItem, depth: number): TestingItem => {
        if (maxDepth > 0 && depth >= maxDepth) {
            data = { ...data, state: { ...data.state, expanded: false } }
            return data
        }
        data = { ...data, state: { ...data.state, expanded: true } }
        if (data.children != null) {
            data.children = data.children.map(e => traverse(e, depth + 1))
        }
        return data
    }
    return traverse(data, 0)
}

export function setSelect(data: TestingItem, path: ItemPath): TestingItem {
    // clear other selected
    const prev = findDataPath(data, e => e.state?.selected)
    let newData = updateState(data, path.slice(1), e => e.selected = true)
    if (prev != null && !isSamePath(prev, path)) {
        newData = updateState(newData, prev.slice(1), e => e.selected = false)
    }
    return newData
}

export function replaceDataMergingState(prev: TestingItem, data: TestingItem) {
    if (data == null || prev == null) {
        return
    }
    if (data.key !== prev.key) {
        return
    }

    const mergeChildren = (prev: TestingItem, data: TestingItem) => {
        if (data.children == null || prev.children == null) {
            return
        }

        const n = data.children.length
        for (let i = 0; i < n; i++) {
            const child = data.children[i]
            let prevChild = prev.children[i]
            if (prevChild == null || prevChild.key !== child.key) {
                prevChild = prev.children.find(e => e.key === child.key)
            }
            if (prevChild == null) {
                continue
            }
            child.state = { ...child.state, ...prevChild.state }
            mergeChildren(prevChild, child)
        }
    }
    mergeChildren(prev, data)
    return
}

export function fillTestingItem(item: TestingListItem): TestingListItem {
    const selfStatus = item.state?.status || "not_run"
    let counters: Partial<StateCounters> = {}

    if (item.kind === "case") {
        counters[selfStatus] = 1
    }

    if (item.children != null) {
        for (let child of item.children) {
            for (let k in child.counters) {
                counters[k] = (counters[k] || 0) + child.counters[k]
            }
        }
    }
    item.overallStatus = sumStatus(selfStatus, counters)
    item.counters = counters
    return item
}

function sumStatus(selfStatus: RunStatus, counters: Partial<StateCounters>): RunStatus {
    if (selfStatus === "error") {
        return "error"
    }
    if (selfStatus === "fail") {
        return "fail"
    }
    if (counters["error"] > 0) {
        return "error"
    }
    if (counters["fail"] > 0) {
        return "fail"
    }
    if (counters["running"] > 0) {
        return "running"
    }
    if (counters["not_run"] > 0) {
        return "not_run"
    }
    if (counters["success"] > 0) {
        return "success"
    }
    // unless all skip
    if (counters["skip"] > 0) {
        return "skip"
    }
    if (!selfStatus || selfStatus === "not_run") {
        return "not_run"
    }
    return "success"
}