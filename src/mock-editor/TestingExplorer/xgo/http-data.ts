import React, { useEffect, useMemo, useState } from "react"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { Options, RunItem, Session, SessionRunner, UpdateCallback } from "../TestingList"
import { traverse } from "../../tree"
import { ItemPath } from "../../List"

export async function requestPoll(url: string, pollURL: string, body: any, callback: (err: Error, events: ItemEvent[]) => boolean): Promise<void> {
    const resp = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body)
    })
    if (resp.status !== 200) {
        const text = await resp.text()
        throw new Error(text)
    }
    const sessionResult: StartSessionResult = await resp.json()
    const sessionID = sessionResult.id

    await pollStatus(pollURL, sessionID, sessionResult.pollIntervalMS, callback)
}

// poll every 200ms
async function pollStatus(pollEventURL: string, sessionID: string, pollIntervalMS: number, callback: (err: Error | undefined, events: ItemEvent[]) => boolean) {
    if (!(pollIntervalMS > 0)) {
        pollIntervalMS = 200
    }
    const body = JSON.stringify({ id: sessionID })
    let init = true
    while (true) {
        if (!init) {
            await sleep(pollIntervalMS)
        } else {
            init = false
        }
        try {
            const resp = await fetch(pollEventURL, { method: "POST", body })
            if (resp.status !== 200) {
                if (callback(new Error(await resp.text()), null)) {
                    return
                }
                continue
            }
            const pollResult: PollSessionResult = await resp.json()
            if (pollResult == null || pollResult.events == null) {
                continue
            }
            if (pollResult.pollIntervalMS > 0) {
                pollIntervalMS = pollResult.pollIntervalMS
            }
            if (callback(null, pollResult.events)) {
                return
            }
        } catch (e) {
            if (callback(e, null)) {
                return
            }
        }
    }
}


export async function requestRun(url: string, item: TestingItem, opts?: { verbose?: boolean }): Promise<{ status: RunStatus, msg: string }> {
    const resp = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ file: item.file, name: item.name, verbose: !!opts?.verbose })
    })
    if (resp.status !== 200) {
        return { status: "error", msg: await resp.text() }
    }

    return await resp.json()
}

export async function requestRunPoll(url: string, pollURL: string, body: any, opts?: {
    appendLog?: (log: string) => void
    onEnd?: (err: Error | undefined) => void
    onEvent?: (event: ItemEvent) => void
}): Promise<void> {
    let fails = 0
    await requestPoll(url, pollURL, body, (err, events) => {
        if (err != null) {
            opts?.appendLog?.("poll err: " + err.message + "\n")
            fails++
            if (fails <= 10) {
                return false
            }
            if (opts?.onEnd) {
                opts.onEnd(err)
                return true
            }
            throw err
        }
        fails = 0
        for (const e of events) {
            if (e.logConsole) {
                console.log("DEBUG event:", e)
            }
            if (opts?.onEvent) {
                opts?.onEvent(e)
            }
            if (e.event === Event.TestEnd) {
                opts?.onEnd?.(null)
                return true
            }
            if (e.msg != null && e.msg !== '') {
                if (opts?.appendLog) {
                    opts?.appendLog?.(e.msg)
                    if (!e.msg.endsWith("\n")) {
                        opts?.appendLog?.("\n")
                    }
                }
            }
        }
        return false
    })
}

export async function fetchContent(url: string, selectedItem: TestingItem): Promise<string> {
    let name = selectedItem.name
    if (selectedItem.baseCaseName) {
        name = selectedItem.baseCaseName
    }
    const resp = await fetch(url + "?" + new URLSearchParams({
        file: selectedItem.file,
        name: name,
    }).toString())
    const data = await resp.json()
    return data.content
}

export function useUrlData(url: string): { data: TestingItem, refresh: () => void } {
    const [data, setData] = useState<TestingItem>()

    const refresh = async () => {
        const resp = await fetch(url)
        const data: TestingItem[] | TestingItem = await resp.json()

        const rootData = makeSingleRoot(data)
        fillKeys(rootData)
        setData(rootData)

    }
    useMemo(() => {
        refresh()
    }, [])

    return { data, refresh }
}

function fillKeys(data: TestingItem) {
    traverse([data], e => {
        if (e.key == null) {
            e.key = e.name
        }
    })
}
function makeSingleRoot(data: TestingItem[] | TestingItem): TestingItem {
    if (data == null) {
        return { key: "/", name: "/", kind: "dir" }
    }
    if (!Array.isArray(data)) {
        // new API returns single root
        return data
    }
    if (data.length === 1) {
        return data[0]
    }
    return { key: "/", name: "/", children: data, kind: "dir" }
}

export function useUrlRun(url: string): RunItem {
    return async function (item: TestingItem, opts: Options): Promise<RunStatus> {
        const data = await requestRun(url, item)
        return data.status
    }
}
function getItemKey(item: TestingItem): string {
    return `${item.kind}:${item.file}:${item.name || "_"}`
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export enum Event {
    TestStart = "test_start",
    ItemStatus = "item_status",
    MergeTree = "merge_tree",
    TestEnd = "test_end",
}

interface StartSessionRequest extends TestingItem {
    children: undefined
}
interface StartSessionResult {
    id: string
    pollIntervalMS: number
}

export interface ItemEvent {
    event: Event
    item: TestingItem // deprecated
    path: ItemPath
    status: RunStatus
    msg?: string
    logConsole?: boolean
}
interface PollSessionResult {
    events: ItemEvent[]
    pollIntervalMS?: number
}
export function newSessionRunner(startSessionURL: string, pollEventURL: string): SessionRunner {
    return {
        async start(item: TestingItem): Promise<Session> {
            const startReq: StartSessionRequest = { ...item, children: undefined }
            const resp = await fetch(startSessionURL, { method: "POST", body: JSON.stringify(startReq) })
            if (resp.status !== 200) {
                throw new Error(await resp.text())
            }
            const sessionResult: StartSessionResult = await resp.json()
            const sessionID = sessionResult.id

            const successCaseMapping: Record<string, boolean> = {}
            const callbackMapping: Record<string, UpdateCallback[]> = {}

            function handleEvents(events: ItemEvent[]): boolean {
                for (const e of events) {
                    if (e.event === Event.TestEnd) {
                        return true
                    }
                    if (e.event === Event.TestStart) {
                        for (let key in callbackMapping) {
                            const callbacks = callbackMapping[key]
                            if (callbacks != null) {
                                callbacks.forEach(f => f("running"))
                            }
                        }
                        continue
                    }
                    if (e.event === Event.ItemStatus) {
                        const key = getItemKey(e.item)
                        if (e.item.kind === "case" && e.status === 'success') {
                            successCaseMapping[key] = true
                        }
                        const callbacks = callbackMapping[key]
                        if (callbacks != null) {
                            callbacks.forEach(f => f(e.status))
                        }
                    }
                }
                return false
            }
            pollStatus(pollEventURL, sessionID, (err, events) => {
                if (err) {
                    // set failure
                    for (let key in callbackMapping) {
                        if (successCaseMapping[key]) {
                            continue
                        }
                        const callbacks = callbackMapping[key]
                        if (callbacks != null) {
                            callbacks.forEach(f => f('error'))
                        }
                    }
                    return false
                }
                return handleEvents(events)
            })
            const session: Session = {
                subscribeUpdate(item: TestingItem, callback: UpdateCallback): void {
                    // console.log("subscribeUpdate:", item)
                    // if (item.kind !== 'case') {
                    //     return
                    // }
                    const key = getItemKey(item)
                    callbackMapping[key] = callbackMapping[key] || []
                    callbackMapping[key].push(callback)
                }
            }
            return session
        }
    }
}