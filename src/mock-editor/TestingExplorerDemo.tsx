import { useEffect, useState } from "react";
import TestingExplorer from "./TestingExplorer";
import { demoAPI } from "./TestingExplorerEditorDemo";
import { demoData, demoAPI as listDemoAPI } from "./TestingListDemo";
import axios from "axios"
import { TestingItem } from "./TestingList";
import { traverse } from "./tree";

const listCaseURL = 'http://10.12.208.244/api/testing/case/listAll?endpoint=localhost:16000'


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

export default function () {
    const [testingItems, setTestingItems] = useState<TestingItem[]>()
    useEffect(() => {
        axios(listCaseURL).then(e => {
            const resp: ListCaseResp = e.data
            const item = buildTestingItem(resp.method_case_list)
            setTestingItems(item ? [item] : [])
        })
    }, [])

    return <TestingExplorer
        listProps={{
            data: testingItems,
            style: {
                // width: "400px",
                // minHeight: "600px",
            },
            runLimit: 20,
            api: listDemoAPI,
        }}
        api={demoAPI}
        style={{
            "marginLeft": "auto",
            "marginRight": "auto",
        }}
    />
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
            name,
            kind: "testSite",
            children: [],
            childrenMapping: {}
        }
        parent.children.push(item)
        parent.childrenMapping[name] = item

        e.case_list?.forEach?.((c) => {
            const name = `[${c.id}]: ${c.name}`
            const caseItem: TestingItemBuild = {
                name,
                kind: "case",
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