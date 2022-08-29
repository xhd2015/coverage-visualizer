
import React from "react";

export interface Props {
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
        return <div style={this.props.style} ></div>
    }
}