
import React from "react";

export interface Props {
    label: string
    style?: React.CSSProperties
    onClick?: () => any
}
export interface Stats {

}

export class Button extends React.Component<Props, Stats> {
    constructor(props) {
        super(props)
    }
    render(): React.ReactNode {
        return <button style={this.props.style} className="coverage-button" onClick={this.props.onClick}>{this.props.label}</button>
    }
}