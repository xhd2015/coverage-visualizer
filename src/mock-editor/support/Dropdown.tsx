import { createElement, CSSProperties, useState } from "react"
import { AiOutlineDown, AiOutlineMenu, AiOutlineEllipsis } from "react-icons/ai"
import { CgMenuRight, CgMenu } from "react-icons/cg"
import { AiOutlineCaretDown, AiFillCaretRight } from "react-icons/ai"

export interface DropdownProps {
    style?: CSSProperties
    children?: any
}

//   <div style={{ marginLeft: "auto" }}>
//             <AiOutlinePlus />
//         </div>

export function Dropdown(props: DropdownProps) {
    const [show, setShow] = useState(false)

    return <div style={{ ...props.style, position: "relative" }}>
        {
            createElement(show ? AiOutlineCaretDown : AiFillCaretRight, {
                onClick: () => {
                    setShow(!show)
                }
            })
        }
        {
            show && <div style={{ position: "absolute" }}>
                {props.children}
            </div>
        }
    </div>
}