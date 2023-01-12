import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing"
import { traverse } from "./tree"


export interface API {
    loadMockInfo: () => Promise<MockInfo>
    loadCase: (method: string, id: number) => Promise<TestingCase>
    saveCase: (method: string, id: number, name: string, caseData: TestingCase) => Promise<void>
    requestTest: <T>(req: TestingRequestV2) => Promise<TestingResponseV2<T>>
}

export interface ListCaseResp {
    method_case_list?: MethodCaseInfo[]
}
export interface MethodCaseInfo {
    case_list?: MethodCase[]
    method: string
}
export interface MethodCase {
    id: number
    name: string
}

export type TestingItemType = "dir" | "testSite" | "case"

export interface TestingItem {
    name: string
    kind: TestingItemType

    method?: string // for case
    id?: number // for case

    children?: TestingItem[]
}


interface TestingItemBuild extends Omit<TestingItem, "children"> {
    childrenMapping?: { [key: string]: TestingItemBuild }
    children: TestingItemBuild[]
}
export function buildTestingItem(methods: MethodCaseInfo[]): TestingItem {
    let root: TestingItemBuild = {
        name: "/",
        kind: "dir",
        children: [],
        childrenMapping: {},
    }

    const getOrInit = (paths: string[]): TestingItemBuild => {
        let cur = root
        for (const path of paths) {
            let next = cur.childrenMapping?.[path]
            if (next) {
                cur = next
                continue
            }
            next = {
                name: path,
                kind: "dir",
                children: [],
                childrenMapping: {}
            }
            cur.childrenMapping[path] = next
            cur.children.push(next)
            cur = next
        }
        return cur
    }
    methods?.forEach?.((e) => {
        if (!e.method) {
            return
        }

        const segments = e.method.split("/").filter(e => e);

        const parent = getOrInit(segments.slice(0, segments.length - 1))
        const name = segments[segments.length - 1]
        // check duplicate
        if (parent.childrenMapping?.[name]) {
            console.error("found duplicate method:", e)
            return
        }

        const item: TestingItemBuild = {
            name: name,
            kind: "testSite",
            method: e.method,
            children: [],
            childrenMapping: {}
        }
        parent.children.push(item)
        parent.childrenMapping[name] = item

        e.case_list?.forEach?.((c) => {
            // const name = `[${c.id}]: ${c.name}`
            const caseItem: TestingItemBuild = {
                // name: name,
                name: c.name,
                kind: "case",
                method: e.method,
                id: c.id,
                children: [],
                childrenMapping: {}
            }
            item.childrenMapping[name] = caseItem
            item.children.push(caseItem)
        });
    })
    // delete unused data
    traverse<TestingItemBuild, TestingItemBuild>([root], e => delete e.childrenMapping)
    return root
}
export function trimPrefix(s, prefix) {
    if (s.startsWith(prefix)) {
        return s.slice(prefix.length)
    }
    return s
}