import { createElement, CSSProperties } from "react"
import "./Icon.css"
import "./Loading.css"

export interface IconProps {
    icon?: any
    disabled?: boolean
    onClick?: () => void
    loading?: boolean
    style?: CSSProperties
    rootStyle?: CSSProperties
    loadingStyle?: CSSProperties
}

export default function (props: IconProps) {
    // ${props.loading ? "mock-editor-loading-loader" : ""}
    return <>
        {
            props.icon && <div style={{ display: "flex", ...props.rootStyle }}>
                {
                    createElement(props.icon, {
                        style: {
                            ...props.style,
                            cursor: "pointer",
                        },
                        className: `mock-editor-icon ${props.disabled ? "disabled" : ""}`,
                        onClick: () => {
                            if (props.disabled) {
                                return
                            }
                            props.onClick?.()
                        }
                    })
                }
                {props.loading && <Loading style={props.loadingStyle} disabled={props.disabled} />}
            </div>
        }   </>
}
export function Loading({ disabled, style }: { disabled?: boolean, style?: CSSProperties }) {
    return <div className={`mock-editor-loading-loader ${disabled ? "disabled" : ""}`}
        style={style}
    ></div>
}