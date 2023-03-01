import { traverse } from "../../tree";
import { objectifyData } from "../../util/format";
import { MockData, MockItem, TestingResponseV2 } from "../testing";
import { CallRecord, ExtensionData } from "./TraceList/trace-types";
import { MockEditData, MockType } from "./types";

export function getRecordKey(e: CallRecord): string {
    return `${e.pkg}.${e.func}`
}

// fill in blank fields
// NOTE: this logic can be filled by server
export function patchResponse(resp: TestingResponseV2<ExtensionData>) {
    if (resp?.Extension?.Data?.trace?.root) {
        const totalByFunc = new Map<string, number>()
        const indexByFunc = new Map<string, number>()

        traverse([resp.Extension.Data?.trace?.root], record => {
            const key = getRecordKey(record)
            totalByFunc.set(key, (totalByFunc.get(key) || 0) + 1)
        })
        totalByFunc.forEach((v, k) => {
            indexByFunc.set(k, 0)
        })

        traverse([resp.Extension.Data?.trace?.root], record => {
            const key = getRecordKey(record)
            const keyIdx = indexByFunc.get(key)
            indexByFunc.set(key, keyIdx + 1)

            record.callIndex = keyIdx
            record.callTotal = totalByFunc.get(key)
        })
    }
    return resp
}

export function getMockItem(mockData: MockData, item: CallRecord): [MockItem, MockType] {
    let mockItem: MockItem
    let mockType: MockType = "all"
    const mockItems = mockData?.MappingList?.[item?.pkg]?.[item?.func]
    if (mockItems?.length > 0) {
        mockType = "current"
        if (item?.callIndex >= 0 && item?.callIndex < mockItems?.length) {
            mockItem = mockItems[item?.callIndex]
        } else {
            mockItem = mockItems[mockItems.length - 1]
        }
    } else {
        mockItem = mockData?.Mapping?.[item?.pkg]?.[item?.func]
    }
    return [mockItem, mockType]
}

export function changeMockTypeWithItem(mockData: MockData, item: CallRecord, mockType: MockType, mockItem: MockItem) {
    if (mockType === "all") {
        // delete the other
        if (mockData?.MappingList?.[item?.pkg]?.[item?.func]) {
            delete mockData.MappingList[item?.pkg][item?.func]
        }
        mockData.Mapping = mockData.Mapping || {}
        mockData.Mapping[item.pkg] = mockData.Mapping[item.pkg] || {}
        mockData.Mapping[item.pkg][item.func] = mockItem
    } else if (mockType === "current") {
        if (mockData?.Mapping?.[item?.pkg]?.[item?.func]) {
            delete mockData.Mapping[item?.pkg][item?.func]
        }
        mockData.MappingList = mockData.MappingList || {}
        mockData.MappingList[item.pkg] = mockData.MappingList[item.pkg] || {}
        mockData.MappingList[item.pkg][item.func] = setList(mockData.MappingList[item.pkg][item.func] || [], item.callIndex, mockItem, mockItem)

    } else {
        throw new Error(`unrecognized mockType: ${mockType}`)
    }
}

export function setList<E>(list: E[], idx: number, prev: E, e: E): E[] {
    list = [...list]
    if (list.length <= idx) {
        // need append
        for (let i = list.length; i++; i < idx) {
            list.push(prev)
        }
        list.push(e)
    } else {
        list[idx] = e
    }
    return list
}

export function mockEditDataToMockItem(data: MockEditData): MockItem {
    return data && data.mockMode !== "No Mock" ? {
        ...data,
        ...({
            // ignore these fields
            mockMode: undefined,
            mockErr: undefined,
            mockResp: undefined,
        } as any),
        Error: data.mockMode === "Mock Error" ? data.mockErr : "",
        // TODO: handle JSON parse error here
        // NOTE: why JSON.parse? because this is an inner data we have to do so
        // when finally request the endpoint we can use string, but here, object only
        Resp: data.mockMode === "Mock Error" ? "" : objectifyData(data.mockResp),
        RespNull: data.mockMode === "Mock Response" && data.mockResp === "null" ? true : undefined,
    } : undefined
}