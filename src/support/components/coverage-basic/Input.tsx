
import React from "react";

export interface Props {
    value?: string
    style?: React.CSSProperties
    onChange?: (value: string) => any
}
export interface Stats {

}

export class Input extends React.Component<Props, Stats> {
    el: HTMLInputElement
    constructor(props) {
        super(props)
    }
    render(): React.ReactNode {
        return <input style={this.props.style} className="coverage-input" ref={e => this.el = e} value={this.props.value} onChange={e => this.props.onChange?.(e.target.value)}></input>
    }
}