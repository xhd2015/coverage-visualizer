import { CSSProperties } from "react";
import ColResizeBar from "../support/components/v2/ColResizeBar";
import LayoutLeftRight from "./support/LayoutLeftRight";
import { API } from "./testing-api";
import TestingExplorerEditor, { TestingExplorerEditorProps } from "./TestingExplorerEditor";
import TestingList, { TestingListProps } from "./TestingList";

export interface TestingExplorerProps {
    style?: CSSProperties

    listProps?: TestingListProps
    editorProps?: TestingExplorerEditorProps
}
export default function (props: TestingExplorerProps) {
    return <LayoutLeftRight
        rootStyle={{
            display: "flex",
            // height: "610px",
            height: "fit-content",
            minHeight: "400px",
            maxHeight: "610px",
            width: "80%",
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
        leftHeightMatchRight
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
                    borderBottom: "1px solid lightgrey",
                    marginRight: "10px",
                    // maxHeight: "100%",
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
        rightStyle={{
            height: "fit-content"
        }}
        rightChild={
            <TestingExplorerEditor
                {...props.editorProps}
            />
        }
    />
}