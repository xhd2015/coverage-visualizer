import axios, { AxiosRequestConfig } from "axios"
import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing"
import { map, traverse } from "./tree"


export interface API {
    loadMockInfo: () => Promise<MockInfo>
    loadCase: (method: string, dir: string, id: number) => Promise<TestingCase>
    saveCase: (method: string, dir: string, id: number, name: string, caseData: TestingCase) => Promise<void>
    requestTest: <T>(req: TestingRequestV2) => Promise<TestingResponseV2<T>>
}

export interface APIV2 {
    load: (req: LoadRequest) => TestingCase
}

export interface CaseDirRef {
    method: string
    dir: string
}

export interface CaseDef {
    id: number
    name: string
}

export interface CaseRef extends CaseDirRef {
    id: number // when update, id never change
}
export interface LoadRequest extends CaseRef {

}
export interface AddCaseRequest extends CaseRef {
    name: string
    data: Partial<TestingCase>
}

export interface UpdateCaseRequest extends CaseRef {
    name: string
    data: Partial<TestingCase>
}
export interface DeleteCaseRequest extends CaseRef {
}

export interface AddDirRequest extends CaseDirRef {
    name: string
}
export interface RenameDirRequest extends CaseDirRef {
    name: string
    newName: string
}

export interface ListCaseResp {
    method_case_list?: MethodCaseInfo[]
    root?: Dir
}
export interface Dir {
    name: string
    path?: string
    method?: string
    caseList?: CaseDef[]
    children?: Dir[]
}
export interface CaseDef {
    id: number
    name: string
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

    // path will be passed back to server
    path?: string

    method?: string // for case
    id?: number // for case

    children?: TestingItem[]
}

export function buildTestingItemV2(root: Dir | undefined): TestingItem {
    let rootItem: TestingItem = {
        name: "/",
        kind: "dir",
        path: "",
        children: [],
    }
    traverse<Dir, TestingItem>(root?.children || [], (e, p, ctx) => {
        const method = e.method || p.method
        let item: TestingItem = {
            name: e.name,
            kind: method ? "testSite" : "dir",
            path: e.path,
            method: method,
            children: [],
        }
        p.children?.push(item)
        return [item]
    }, {
        root: rootItem,
        after(e, ctx, parentCtx, idx, path) {
            e.caseList?.forEach?.(c => {
                ctx.children?.push({
                    name: c.name,
                    id: c.id,
                    kind: "case",
                    method: ctx.method,
                    path: ctx.path,
                })
            })
        },
    })
    return rootItem
}

interface TestingItemBuild extends Omit<TestingItem, "children"> {
    childrenMapping?: { [key: string]: TestingItemBuild }
    children: TestingItemBuild[]
}
export function buildTestingItem(methods: MethodCaseInfo[]): TestingItem {
    let root: TestingItemBuild = {
        name: "/",
        kind: "dir",
        path: "",
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

export async function requestApi<T>(req: AxiosRequestConfig): Promise<T> {
    return await axios(req).then(e => e.data).then((e: { data: T, code: number, msg?: string }) => {
        if (e?.code !== 0) {
            throw new Error(e?.msg ? e?.msg : `request ${req.url} failed: ${JSON.stringify(e)}`)
        }
        return e.data
    })
}


export async function addDir(method: string, dir: string, name: string): Promise<void> {
    await requestApi({
        url: "http://localhost:16000/api/dir/add",
        method: "POST",
        data: {
            method,
            dir,
            name,
        },
    })
}

export async function deleteDir(method: string, dir: string, name: string): Promise<void> {
    await requestApi({
        url: "http://localhost:16000/api/dir/delete",
        method: "POST",
        data: {
            method,
            dir,
            name,
        },
    })
}
export async function renameDir(method: string, dir: string, name: string, newName: string): Promise<void> {
    await requestApi({
        url: "http://localhost:16000/api/dir/rename",
        method: "POST",
        data: {
            method,
            dir,
            name,
            newName,
        },
    })
}
