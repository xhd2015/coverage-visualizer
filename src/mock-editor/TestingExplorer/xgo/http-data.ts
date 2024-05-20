import { useEffect, useState } from "react"
import { RunStatus } from "../testing"
import { TestingItem } from "../testing-api"
import { Options, RunItem } from "../TestingList"

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