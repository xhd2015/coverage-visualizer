import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { API } from "./testing-api";
import TestingExplorerEditor from "./TestingExplorerEditor";
import axios from "axios";

const caseURL = 'http://10.12.208.244/api/testing/case/load?region=sg&env=test&service=credit-pricing-center&endpoint=localhost:16000&method=manager_core_v2%2FQueryUserInstalmentInfo%2Fall_in_one&id=31'

// const schemaURL = "http://localhost:16000/api/mock/infoAll"
const schemaURL = 'http://10.12.208.244/api/testing/mock/infoAll?endpoint=localhost:16000'
// const testingURL = "http://10.12.208.244/api/testing/requestV2"
const testingURL = "http://localhost:16000/api/endpoint/test"

export const demoAPI: API = {
    loadMockInfo: function (): Promise<MockInfo> {
        return axios(schemaURL).then(e => e.data);
    },
    loadCase: function (method: string, id: number): Promise<TestingCase> {
        return axios(`http://10.12.208.244/api/testing/case/load?region=sg&env=test&service=credit-pricing-center&endpoint=localhost:16000&method=${method}&id=${id}`).then(e => e.data);
    },
    saveCase: async function (method: string, id: number, name: string, caseData: TestingCase): Promise<void> {
        await axios({
            url: "http://localhost:16000/api/case/update",
            method: "POST",
            data: {
                method,
                id,
                name,
                data: capObj({ ...caseData }),

            }
        })
    },
    requestTest: function <T>(req: TestingRequestV2): Promise<TestingResponseV2<T>> {
        return axios({
            url: testingURL,
            method: "POST",
            data: {
                endpoint: "localhost:16000",
                ...capObj(transObject(req)),
            },
        }).then(e => e.data).then((e: { data: TestingResponseV2<T>; code: number; msg: string; }) => {
            if (e.code !== 0) {
                return { Error: e.msg } as TestingResponseV2<T>;
            }
            return e.data;
        }).catch(err => {
            return { Error: err.message } as TestingResponseV2<T>;
        });
        // .then(e => e.data).catch(err => {
        //     return { Error: err.message }
        // })
    },
}

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

function transObject(req: TestingRequestV2): TestingRequestV2 {
    const n = { ...req }
    n.request = tryParse(n.request)
    n.asserts = tryParse(n.asserts)
    n.assertMockRecord = tryParse(n.assertMockRecord)
    // TODO: typesafe
    n["mockData"] = tryParse(n.mock)
    delete n.mock
    return n
}
function capObj<T>(s: T): T {
    const v = {} as T
    for (let key in s) {
        v[cap(key)] = s[key]
    }
    return v
}
function cap(s: string): string {
    if (!s) {
        return s
    }
    return s[0].toUpperCase() + s.slice(1)
}

export default function () {
    return <TestingExplorerEditor api={demoAPI} />
}