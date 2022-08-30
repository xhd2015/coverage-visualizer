
import React from "react";

export interface Props {
    label: string
    value?: any
    style?: React.CSSProperties
    onChange?: (value: any) => any
}
export interface Stats {

}

export class Checkbox extends React.Component<Props, Stats> {
    el: HTMLInputElement
    constructor(props) {
        super(props)
    }
    render(): React.ReactNode {
        return <span><input style={this.props.style} type='checkbox' className="coverage-checkbox" ref={e => this.el = e} checked={this.props.value} onChange={e => {
            this.props.onChange?.(e.target.checked)
        }}></input> <span>{this.props.label}</span></span>
    }
}