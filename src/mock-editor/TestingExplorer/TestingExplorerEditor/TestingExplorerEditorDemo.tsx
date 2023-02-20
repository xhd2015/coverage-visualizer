import axios from "axios";
import TestingExplorerEditor from ".";
import { transObject } from "../parse";
import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "../testing";
import { API } from "../testing-api";

const schemaURL = 'http://localhost:16000/api/mock/infoAll?endpoint=localhost:16000'
const testingURL = "http://localhost:16000/api/endpoint/test"

export const demoAPI: API = {
    loadMockInfo: function (): Promise<MockInfo> {
        return axios(schemaURL).then(e => e.data?.data);
    },
    loadCase: function (method: string, dir: string, id: number): Promise<TestingCase> {
        return axios(`http://localhost:16000/api/case/load?method=${method}&id=${id}&dir=${dir}`).then(e => e.data?.data);
    },
    saveCase: async function (method: string, dir: string, id: number, name: string, caseData: TestingCase): Promise<void> {
        await axios({
            url: "http://localhost:16000/api/case/update",
            method: "POST",
            data: {
                method,
                id,
                name,
                dir,
                data: capObj({ ...caseData }),
            }
        }).then(e => e.data).then(e => {
            if (e?.code !== 0) {
                throw new Error(e?.msg)
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
            // do some patch
            return e.data;
        }).catch(err => {
            return { Error: err.message } as TestingResponseV2<T>;
        });
        // .then(e => e.data).catch(err => {
        //     return { Error: err.message }
        // })
    },
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