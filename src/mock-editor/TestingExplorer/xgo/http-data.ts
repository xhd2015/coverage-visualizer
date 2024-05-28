import React, { useEffect, useState } from "react"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { Options, RunItem, Session, SessionRunner, UpdateCallback } from "../TestingList"

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


async function pollStatus(pollEventURL: string, sessionID: string, callback: (err: Error | undefined, events: ItemEvent[]) => boolean) {
    const body = JSON.stringify({ id: sessionID })
    let init = true
    while (true) {
        if (!init) {
            await sleep(500)
        } else {
            init = false
        }
        try {
            const resp = await fetch(pollEventURL, { method: "POST", body })
            if (resp.status !== 200) {
                console.log("poll err:", await resp.text())
                continue
            }
            const pollResult: PollSessionResult = await resp.json()
            if (pollResult == null || pollResult.events == null) {
                continue
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

export async function requestDebug(url: string, pollURL: string, item: TestingItem, setLog: React.Dispatch<React.SetStateAction<string>>, opts?: {}): Promise<void> {
    setLog("debugging...\n")
    const resp = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ item })
    })
    if (resp.status !== 200) {
        setLog(log => log + "error: ")
        const text = await resp.text()
        setLog(log => log + text + "\n")
        return
    }
    const sessionResult: StartSessionResult = await resp.json()
    const sessionID = sessionResult.id

    await pollStatus(pollURL, sessionID, (err, events) => {
        if (err != null) {
            setLog(log => log + "poll err: " + err.message + "\n")
            return false
        }
        for (const e of events) {
            if (e.event === Event.TestEnd) {
                return true
            }
            if (e.msg != null && e.msg !== '') {
                setLog(log => log + e.msg + "\n")
            }
        }
        return false
    })
}

export async function fetchContent(url: string, selectedItem: TestingItem): Promise<string> {
    const resp = await fetch(url + "?" + new URLSearchParams({
        file: selectedItem.file,
        name: selectedItem.name,
    }).toString())
    const data = await resp.json()
    return data.content
}

export function useUrlData(url: string): { data: TestingItem[], refresh: () => void } {
    const [data, setData] = useState<TestingItem[]>()

    const refresh = async () => {
        const resp = await fetch(url)
        const data = await resp.json()
        setData(data)
    }
    useEffect(() => {
        refresh()
    }, [])

    return { data, refresh }
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

enum Event {
    ItemStatus = "item_status",
    TestStart = "test_start",
    TestEnd = "test_end",
}

interface StartSessionRequest extends TestingItem {
    children: undefined
}
interface StartSessionResult {
    id: string
}

interface ItemEvent {
    event: Event
    item: TestingItem
    status: RunStatus
    msg?: string
}
interface PollSessionResult {
    events: ItemEvent[]
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