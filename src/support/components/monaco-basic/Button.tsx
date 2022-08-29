import React from "react";
import { QuickInputBox as vsQuickInputBox } from "monaco-editor/esm/vs/base/parts/quickinput/browser/quickInputBox"
import { Button as vsButton } from 'monaco-editor/esm/vs/base/browser/ui/button/button';


export interface Props {
    label: string
    onClick?: () => any
}
export interface Stats {

}

export class Button extends React.Component<Props, Stats> {
    container: any
    inputBox: any
    constructor(props) {
        super(props)
    }

    componentDidMount(): void {
        const inputBox = new vsButton(this.container)
        this.inputBox = inputBox
        this.inputBox.label = this.props.label
        if (this.props.onClick) {
            this.inputBox.onDidClick(this.props.onClick)
        }

    }

    render(): React.ReactNode {
        return <div ref={(e) => this.container = e}>{this.props.children}</div>
    }
}
