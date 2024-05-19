import { BaseDebugTraceExplorer, BaseDebugTraceExplorerProps } from "./BaseSourceExplorer"


export interface DebugTraceExplorerProps extends BaseDebugTraceExplorerProps {

}

export function DebugTraceExplorer(props: DebugTraceExplorerProps) {
    return <BaseDebugTraceExplorer
        {...props}
        codeTabProps={{
            hideOldCode: true,
            defaultTab: "Test",
            ...props.codeTabProps,
            testingEditorProps: {
                disableName: true,
                disableSave: true,
                disableAssert: true,
                ...props.codeTabProps?.testingEditorProps,
            }
        }}

    />
}