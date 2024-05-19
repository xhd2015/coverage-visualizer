import axios, { AxiosRequestConfig } from "axios"

export async function get<T>(url: string, params: any, opts?: Options<T>): Promise<T> {
    return await request(url, {
        method: "GET",
        params: params,
        options: opts,
    })
}

export async function postJSON<T>(url: string, data: any, opts?: Options<T>): Promise<T> {
    return await request(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...opts?.headers,
        },
        params: opts?.params,
        options: opts,
        data: data,
    })
}

export interface Options<T> {
    mapResp?: (data: any) => T
    headers?: { [name: string]: string }
    params?: any
}

export interface RequestConfig<T> extends AxiosRequestConfig {
    options?: Options<T>
}

export async function request<T>(url: string, config?: RequestConfig<T>): Promise<T> {
    const resp = await axios(url, config)
    const respData = resp.data

    if (respData?.code !== 0) {
        if (respData?.msg) {
            throw new Error(respData?.msg)
        }
        throw new Error(`unknown error occured: ${url}`)
    }
    let res = respData.data
    if (config?.options?.mapResp) {
        res = config?.options?.mapResp?.(res)
    }
    return res
}