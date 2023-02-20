import { ItemIndex } from "../../List";
import { CallRecord } from "./TraceList/trace-types";

export type RespEditorOption = "Request" | "Response"
export type MockMode = "Mock Response" | "Mock Error" | "No Mock"
export type MockType = "all" | "current"

export interface TraceItem {
    item: CallRecord;
    root: CallRecord;
    index: ItemIndex;
}

export interface MockEditData {
    mockMode: MockMode;
    mockResp: string;
    mockErr: string;
}