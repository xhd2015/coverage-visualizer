import { MutableRefObject, useEffect, useRef } from "react"

const default_bg_color = '#f0f0f0';
const highlight_bg_color = '#868686';

export interface ColResizeBarProps {
    barColor?: string
    vertical?: boolean
    getTargetElement?: (bar: HTMLElement) => HTMLElement
    autoResize?: boolean // default true
    onPositionBegin?: (bar: HTMLElement, start: number) => void
    onPositionChange?: (bar: HTMLElement, to: number, from: number) => void
}

// expect parent to have: position:relative
export default function ColResizeBar(props: ColResizeBarProps) {
    const divRef = useRef<HTMLDivElement>()
    const propsRef = useRef(props)
    useEffect(() => {
        const detach = attachResizeHandlers(divRef.current, propsRef)
        return detach
    }, [])
    return <div style={{
        position: "absolute",
        ...(props.vertical ? {
            cursor: 'row-resize',
            height: "5px",
            bottom: 0,
            left: 0,
            width: "100%"
        } : {
            cursor: 'col-resize',
            width: "5px",
            top: 0,
            right: 0,
            height: "100%"
        }),
    }}
        ref={divRef}
    ></div>
}


interface Handler {
    getPos: (e: MouseEvent) => number
    getSize: (e: HTMLElement) => number
    getPadding: (e: HTMLElement) => number
    setSize: (e: HTMLElement, size: number) => void
}

const verticalHandler: Handler = {
    getPos(e) {
        return e.pageY
    },
    getSize(e) {
        return e.offsetHeight
    },
    getPadding(e) {
        return paddingYDiff(e)
    },
    setSize(e, size) {
        e.style.height = `${size}px`
    },
}

const horizontalHandler: Handler = {
    getPos(e) {
        return e.pageX
    },
    getSize(e) {
        return e.offsetWidth
    },
    getPadding(e) {
        return paddingDiff(e)
    },
    setSize(e, size) {
        e.style.width = `${size}px`
    },
}

export function attachResizeHandlers(resizeBar: HTMLDivElement, propsRef: MutableRefObject<ColResizeBarProps>) {
    let pagePos: number
    let targetElementSize: number;
    let targetElement: HTMLElement;
    let watching

    const handler: Handler = propsRef.current.vertical ? verticalHandler : horizontalHandler
    const autoResize = () => propsRef.current?.autoResize !== false

    const onmousedown = function (e) {
        watching = true
        pagePos = handler.getPos(e)
        propsRef.current?.onPositionBegin?.(e.target, pagePos)
        if (autoResize()) {
            targetElement = propsRef.current?.getTargetElement ? propsRef.current?.getTargetElement(e.target as HTMLElement) : (e.target as HTMLElement).parentElement.parentElement
            if (!targetElement) {
                return
            }
            const padding = handler.getPadding(targetElement)
            // inner width(without padding) = offsetWidth - padding
            targetElementSize = handler.getSize(targetElement) - padding
        }

        if (!watching) {
            resizeBar.style.backgroundColor = default_bg_color;
        } else {
            resizeBar.style.backgroundColor = highlight_bg_color;
        }
    }

    const onmouseover = function (e) {
        if (!watching) {
            resizeBar.style.backgroundColor = default_bg_color;
        } else {
            resizeBar.style.backgroundColor = highlight_bg_color;
        }
    }

    const onmouseout = function (e) {
        if (watching) {

        } else {
            resizeBar.style.backgroundColor = default_bg_color;
        }
    }

    const onmousemove = function (e) {
        if (!watching) {
            return
        }
        // console.log("mousemove:", e, e.pageX)
        propsRef.current?.onPositionChange?.(e.target, handler.getPos(e), pagePos)

        if (autoResize() && targetElement) {
            const diff = handler.getPos(e) - pagePos
            // const padding = paddingDiff(monacoContainer);
            // const monacoContainerWidth = monacoContainer.offsetWidth - padding;
            const newSize = targetElementSize + diff
            // console.log("moving:", monacoContainer, diffX, newWidth)
            if (propsRef.current?.autoResize !== false) {
                handler.setSize(targetElement, newSize)
            }
        }
    }

    const onmouseup = function (e) {
        resizeBar.style.backgroundColor = default_bg_color;

        if (!watching) {
            return
        }
        watching = false
        targetElement = undefined;
        pagePos = undefined;
        targetElementSize = undefined
    }

    resizeBar.addEventListener('mousedown', onmousedown);
    resizeBar.addEventListener('mouseover', onmouseover)
    resizeBar.addEventListener('mouseout', onmouseout)
    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);

    return () => {
        // console.log("detaching resize handler")
        resizeBar.removeEventListener('mousedown', onmousedown)
        resizeBar.removeEventListener('mouseover', onmouseover)
        resizeBar.removeEventListener('mouseout', onmouseout)
        document.removeEventListener('mousemove', onmousemove);
        document.removeEventListener('mouseup', onmouseup);
    }
}
export function paddingDiff(e: HTMLElement) {
    if (getCSSVal(e, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padLeft = getCSSVal(e, 'padding-left');
    var padRight = getCSSVal(e, 'padding-right');
    return (parseInt(padLeft) + parseInt(padRight));
}
export function paddingYDiff(e: HTMLElement) {
    if (getCSSVal(e, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padTop = getCSSVal(e, 'padding-top');
    var padBottom = getCSSVal(e, 'padding-bottom');
    return (parseInt(padTop) + parseInt(padBottom));
}

function getCSSVal(elm: HTMLElement, property: string) {
    return (window.getComputedStyle(elm, null).getPropertyValue(property))
}