

export interface RootRecord {
    startTime: string // the abolute begin time
    root: CallRecord
}

export interface CallRecord {
    pkg: string
    func: string
    file: string
    line: number // 1-based

    start: number // relative to request begin, as nanoseconds
    end: number

    args: any

    mockStatus: MockStatus
    error?: string // has error,may be empty
    panic?: boolean // has panic
    result: any // keyed by name, if no name, a slice

    log?: any // log set within request
    children?: CallRecord[]
}

export type MockStatus = "normal_resp" | "normal_error" | "mock_resp" | "mock_error"
