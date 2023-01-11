

import { useState } from "react"
import { AiOutlineCopy, AiOutlineCheck, AiOutlineExclamationCircle } from "react-icons/ai"
import { setClipboard } from "../util/clipboard"

export type CopyStatus = "Copy" | "Copied" | "Copy Failed"

export interface CopyClipboardProps {
    text?: string
}

export default function (props: CopyClipboardProps) {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>("Copy")

    return <>
        {
            copyStatus === "Copy" && <AiOutlineCopy style={{ cursor: "pointer" }} onClick={() => {
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
            }} />
        }
        {
            copyStatus === "Copied" && <AiOutlineCheck />
        }
        {
            copyStatus === "Copy Failed" && <AiOutlineExclamationCircle style={{ color: "red" }} />
        }
    </>
}