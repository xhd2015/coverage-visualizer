

import { useState, createElement, CSSProperties } from "react"
import { AiOutlineCopy, AiOutlineCheck, AiOutlineExclamationCircle } from "react-icons/ai"
import { setClipboard } from "../util/clipboard"

export type CopyStatus = "Copy" | "Copied" | "Copy Failed"

export interface CopyClipboardProps {
    style?: CSSProperties
    text?: string

    copyIcon?: any
    copiedIcon?: any
    copyFailIcon?: any
}

// BsFileEarmarkCheck
export default function (props: CopyClipboardProps) {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>("Copy")

    return <>
        {
            copyStatus === "Copy" && createElement(props.copyIcon || AiOutlineCopy, {
                style: { cursor: "pointer", ...props.style },
                onClick: (e) => {
                    e.stopPropagation()
                    if (!props.text) {
                        return
                    }
                    let t: number
                    setClipboard(props.text).then(() => {
                        setCopyStatus("Copied")
                        t = 1 * 1000
                    }).catch(e => {
                        setCopyStatus("Copy Failed")
                        t = 3 * 1000
                    }).finally(() => {
                        setTimeout(() => {
                            setCopyStatus("Copy")
                        }, t)
                    })
                }
            })
        }
        {
            copyStatus === "Copied" && createElement(props.copiedIcon || AiOutlineCheck, {})
        }
        {
            copyStatus === "Copy Failed" && createElement(props.copiedIcon || AiOutlineExclamationCircle, { style: { color: "red" } })
        }
    </>
}