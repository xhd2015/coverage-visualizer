import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing";
import { API } from "./testing-api";
import TestingExplorerEditor from "./TestingExplorerEditor";
import axios from "axios";

const caseURL = 'http://10.12.208.244/api/testing/case/load?region=sg&env=test&service=credit-pricing-center&endpoint=localhost:16000&method=manager_core_v2%2FQueryUserInstalmentInfo%2Fall_in_one&id=31'
// const schemaURL = "http://localhost:16000/api/mock/infoAll"
const schemaURL = 'http://10.12.208.244/api/testing/mock/infoAll?endpoint=localhost:16000'
const testingURL = "http://10.12.208.244/api/testing/requestV2"

export const demoAPI: API = {
    loadMockInfo: function (): Promise<MockInfo> {
        return axios(schemaURL).then(e => e.data)
    },
    loadCase: function (): Promise<TestingCase> {
        return axios(caseURL).then(e => e.data)
    },
    requestTest: function <T>(req: TestingRequestV2): Promise<TestingResponseV2<T>> {
        return axios({
            url: testingURL,
            method: "POST",
            data: {
                endpoint: "localhost:16000",
                ...req,
            },
        }).then(e => e.data)
    }
}

export default function () {
    return <TestingExplorerEditor api={demoAPI} />
}