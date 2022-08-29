
import React from "react";

export interface Props {
    options: string[]
    style?: React.CSSProperties
    onChange?: (option: string) => any
}
export interface Stats {

}

export class Select extends React.Component<Props, Stats> {
    el: HTMLSelectElement
    constructor(props) {
        super(props)
    }
    componentDidMount(): void {
        this.props.onChange?.(this.el.value)
    }
    render(): React.ReactNode {
        return <select style={this.props.style} className="coverage-select" ref={e => this.el = e} onChange={(e) => this.props.onChange?.(e.target.value)}>
            {
                this.props.options.map((e, i) => {
                    return <option key={`${e}_${i}`} value={e}>{e}</option>
                })
            }
        </select>
    }
}