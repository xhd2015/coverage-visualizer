import { MockInfo, TestingCase, TestingRequestV2, TestingResponseV2 } from "./testing"


export interface API {
    loadMockInfo: () => Promise<MockInfo>
    loadCase: () => Promise<TestingCase>

    requestTest: <T>(req: TestingRequestV2) => Promise<TestingResponseV2<T>>
}