import { MutableRefObject } from "react";
import { ColResizeBarProps } from "../v2/ColResizeBar";
import { attachMouseEvents } from "./mouse";

export interface AttachMouseBehaviorProps {
    // set hover status
    // onMouseOver?: (e: HTMLElement) => void
    mouseOverBorderRightStyle?: string

    onMouseDown?: (e: MouseEvent) => void
}

export function attachXResizeHandlers(resizeBar: HTMLElement, getProps: () => AttachMouseBehaviorProps) {
    let pagePos: number
    let targetElementSize: number;
    let targetElement: HTMLElement;

    return attachMouseEvents(resizeBar, () => {
        const props = getProps()
        return {
            onMouseOver(e) {
                e.target.style.borderRight = props.mouseOverBorderRightStyle
            },
            onMouseOut(e) {
                e.target.style.borderRight = ''
            },
            onMouseDown(e) {
                pagePos = e.pageX
            },
            onMouseMove(e) {

            },
            onMouseUp(e) {

            },
        }
    })
}