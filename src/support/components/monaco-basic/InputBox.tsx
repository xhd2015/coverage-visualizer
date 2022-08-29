import React from "react";
import { QuickInputBox as vsQuickInputBox } from "monaco-editor/esm/vs/base/parts/quickinput/browser/quickInputBox"
// import { InputBox } from 'monaco-editor/esm/vs/base/browser/ui/inputbox/inputBox';

export class QuickInputBox extends React.Component {
    container: any
    inputBox: any
    constructor(props) {
        super(props)
    }

    componentDidMount(): void {
        console.log("input box container:", this.container)
        const inputBox = new vsQuickInputBox(this.container)
        this.inputBox = inputBox
    }

    render(): React.ReactNode {
        return <div ref={(e) => this.container = e}></div>
    }
}
