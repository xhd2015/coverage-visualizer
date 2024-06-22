import React, { Key, useMemo, useState } from "react";
import { TestingList, Options, TestingAPI, TestingListV2, TestingItemV2 } from "./index";
import { ItemPath } from "../../List";
import { RunStatus } from "../testing";
import { TestingItem } from "../testing-api";
import { map } from "../../tree";
import { listToMap } from "./util";
import { Button } from "antd";


export function randList<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
}

export const demoAPI: TestingAPI = {
    delete: function (item: TestingItem, opts: Options): Promise<void> {
        throw new Error("Function not implemented.");
    },
    run: function (item: TestingItem, opts: Options): Promise<RunStatus> {
        // the API can be designed to have rate limit
        return new Promise((resolve) => {
            setTimeout(() => resolve(randList(["success", /* "fail", "error", "skip" */] as RunStatus[])), (1 + Math.random() * 3) * 1000)
        })
    },
    duplicate: function (item: TestingItem, opts: Options): Promise<void> {
        throw new Error("Function not implemented.");
    },
    add: async function (item: TestingItem, opts: Options): Promise<void> {

    },
    addFolder: async function (item: TestingItem, opts: Options): Promise<void> {

    },
    delFolder: async function (item: TestingItem, opts: Options): Promise<void> {

    }
}

function newArray(n) {
    const arr = []
    for (let i = 0; i < n; i++) {
        arr.push(i)
    }
    return arr
}

export default function () {
    return <TestingList
        data={demoData}
        showEditActions={false}
        style={{
            width: "400px",
            minHeight: "600px",
        }}
        runLimit={20}
        // runLimit={5}
        // runLimit={1} // serial
        api={demoAPI}
    />
}

export function buildData(demoData: TestingItem[]): TestingItemV2[] {
    return map<TestingItem, TestingItemV2>(demoData, (e, children): TestingItemV2 => ({ ...e, key: e.name, children, childrenMapping: listToMap(children), state: {} })
    )
}

function mergeData(prev: TestingItemV2, data: TestingItemV2): TestingItemV2 {
    data.state = prev.state
    if (data.children != null) {
        const oldMap = listToMap(prev.children)
        const n = data.children.length
        for (let i = 0; i < n; i++) {
            const prevChild = oldMap.get(data.children[i].key)
            if (prevChild == null) {
                continue
            }
            data.children[i] = mergeData(prevChild, data.children[i])
        }
    }
    return data
}

export function TestingListV2Demo() {
    const demoDataMapping = useMemo<TestingItemV2[]>(() => buildData(demoData), [demoData])
    const [data, setData] = useState(demoDataMapping[0])

    return <div style={{ width: "400px", height: "80vh", border: "1px solid grey", overflow: "auto" }}>
        <div>
            <Button onClick={() => {
                const newData = getRefreshedDemoData()
                const newBuiltData = buildData(newData)[0]
                console.log("newBuiltData:", newBuiltData)
                setData(prev => mergeData(prev, newBuiltData))
                // merge status
            }}>Refresh</Button>
        </div>
        <TestingListV2
            data={data}
            onChange={setData}
            showEditActions={false}
            style={{

            }}
            runLimit={20}
            // runLimit={5}
            // runLimit={1} // serial
            api={demoAPI}
        />
    </div>
}

export const demoData: TestingItem[] = getDemoData()

function getDemoData(): TestingItem[] {
    return [
        {
            name: "/",
            kind: "dir",
            children: [{
                name: "core",
                kind: "dir",
                children: [{
                    "name": "biz",
                    kind: "testSite",
                    children: [
                        {
                            "name": "Hello",
                            kind: "testSite",
                            children: [
                                {
                                    name: "WhatInterface to test?",
                                    kind: "case",
                                    children: [{
                                        name: "sub_case",
                                        kind: "case",
                                    }]
                                },
                                ...newArray(25).map((e, i): TestingItem => ({
                                    name: `Test_${i}`,
                                    kind: "case",
                                }))
                            ]
                        }
                    ]
                },
                {
                    name: "inner",
                    kind: "testSite"
                },
                {
                    name: "bizv2",
                    kind: "dir",
                    children: [
                        {
                            "name": "World",
                            kind: "testSite",
                            children: [
                                {
                                    name: "WhatInterface to test?",
                                    kind: "case",
                                },
                                ...newArray(25).map((e, i): TestingItem => ({
                                    name: `Test_${i}`,
                                    kind: "case",
                                }))
                            ]
                        }
                    ]
                }]
            }]
        },

    ]
}


function getRefreshedDemoData(): TestingItem[] {
    const newData = getDemoData()
    const newData2 = getDemoData()

    newData2[0].children[0].name = "new_" + newData2[0].children[0].name
    newData[0].children.push(newData2[0].children[0])

    return newData
}