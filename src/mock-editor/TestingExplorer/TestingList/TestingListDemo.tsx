import React from "react";
import TestingList, { TestingAPI } from "./index";
import { ItemPath } from "../../List";
import { RunStatus } from "../testing";
import { TestingItem } from "../testing-api";


function randList<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
}

export const demoAPI: TestingAPI = {
    delete: function (item: TestingItem, path: ItemPath): Promise<void> {
        throw new Error("Function not implemented.");
    },
    run: function (item: TestingItem, path: ItemPath): Promise<RunStatus> {
        // the API can be designed to have rate limit
        return new Promise((resolve) => {
            setTimeout(() => resolve(randList(["success", /* "fail", "error", "skip" */] as RunStatus[])), (1 + Math.random() * 3) * 1000)
        })
    },
    duplicate: function (item: TestingItem, path: ItemPath): Promise<void> {
        throw new Error("Function not implemented.");
    },
    add: async function (item: TestingItem, path: ItemPath): Promise<void> {

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

export const demoData: TestingItem[] = [
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