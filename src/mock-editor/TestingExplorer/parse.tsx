import { TestingRequestV2 } from "./testing"


export function tryParse(s: string | Object): Object {
    if (typeof s !== 'string') {
        return s as Object
    }
    if (!s) {
        return undefined
    }
    try {
        return JSON.parse(s)
    } catch (e) {
        return undefined
    }
}


export function transObject(req: TestingRequestV2): TestingRequestV2 {
    const n = { ...req }
    n.request = tryParse(n.request)
    n.asserts = tryParse(n.asserts)
    n.assertMockRecord = tryParse(n.assertMockRecord)
    // TODO: typesafe
    n["mockData"] = tryParse(n.mock)
    delete n.mock
    return n
}