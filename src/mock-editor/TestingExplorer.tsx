import { CSSProperties } from "react";
import ColResizeBar from "../support/components/v2/ColResizeBar";
import LayoutLeftRight from "./support/LayoutLeftRight";
import { API } from "./testing-api";
import TestingExplorerEditor from "./TestingExplorerEditor";
import TestingList, { TestingListProps } from "./TestingList";

export interface TestingExplorerProps {
    api: API
    style?: CSSProperties

    listProps?: TestingListProps
}
export default function (props: TestingExplorerProps) {
    return <LayoutLeftRight
        rootStyle={{
            display: "flex",
            // height: "610px",
            height: "fit-content",
            minHeight: "400px",
            maxHeight: "610px",
            userSelect: "none",
            ...props.style
            // justifyContent: 'center'
        }}

        onLeftResize={() => {
            // if (mockSetupEditorRef.current) {
            //     mockSetupEditorRef.current.layout()
            // }
            // if (traceEditorRef.current) {
            //     traceEditorRef.current.layout()
            // }
            // if (mockErrEditorRef.current) {
            //     mockErrEditorRef.current.layout()
            // }
        }}
        leftStyle={{
            position: "relative",
            //  height: "100%", // 100% makes the height exceeds parent's height
            // minHeight: "400px"
        }}
        leftChild={<>
            <TestingList
                {...props.listProps}
                style={{
                    height: "100%",
                    // minHeight: "400px",
                    // width: "fit-conent",
                    width: "300px",
                    border: "unset",
                    overflowY: "auto",
                    borderBottom: "1px solid black",
                    // maxWidth: "300px",
                    ...props.listProps?.style,
                }}
            />

            <ColResizeBar
                barColor="#dddd85" // yellow like
                getTargetElement={e => {
                    return e.parentElement.firstElementChild as HTMLElement
                }} />
        </>
        }
        rightChild={
            <TestingExplorerEditor api={props.api} />
        }
    />
}