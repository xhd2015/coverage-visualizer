import { useEffect, useRef } from "react"


const defaultBarColor = "#0000ff" // blue
export interface ColResizeBarProps {
    barColor?: string // defa

    getTargetElement?: (bar: HTMLElement) => HTMLElement
}

// expect parent to have: position:relative
export default function ColResizeBar(props: ColResizeBarProps) {
    const divRef = useRef<HTMLDivElement>()
    useEffect(() => {
        // console.log("attaching resize handler")
        const detach = attachResizeHandlers(divRef.current, props)
        return detach
    }, [])
    return <div style={{
        // backgroundColor: "red",
        width: "5px",
        cursor: 'col-resize',
        position: "absolute",
        top: 0,
        right: 0,
        height: "100%"
    }}
        ref={divRef}
    ></div>
}

export function attachResizeHandlers(div: HTMLDivElement, props: ColResizeBarProps) {
    let pageX: number
    let targetElementWidth: number;
    let targetElement: HTMLElement;

    const onmousedown = function (e) {
        // console.log("mousedown:", e)
        // curCol = e.target.parentElement;
        targetElement = props?.getTargetElement ? props?.getTargetElement(e.target as HTMLElement) : (e.target as HTMLElement).parentElement.parentElement
        if (!targetElement) {
            return
        }
        pageX = e.pageX;

        var padding = paddingDiff(targetElement);
        targetElementWidth = targetElement.offsetWidth - padding;
    }
    const onmouseover = function (e) {
        e.target.style.borderRight = `2px solid ${props?.barColor || defaultBarColor}`;
    }
    const onmouseout = function (e) {
        e.target.style.borderRight = '';
    }
    const onmousemove = function (e) {
        // console.log("mousemove:", e)
        if (targetElement) {
            var diffX = e.pageX - pageX;

            // const padding = paddingDiff(monacoContainer);
            // const monacoContainerWidth = monacoContainer.offsetWidth - padding;
            const newWidth = (targetElementWidth + diffX) + 'px';
            // console.log("moving:", monacoContainer, diffX, newWidth)
            targetElement.style.width = (targetElementWidth + diffX) + 'px';
        }
    }
    const onmouseup = function (e) {
        targetElement = undefined;
        pageX = undefined;
        targetElementWidth = undefined
    }

    div.addEventListener('mousedown', onmousedown);
    div.addEventListener('mouseover', onmouseover)
    div.addEventListener('mouseout', onmouseout)
    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);

    return () => {
        // console.log("detaching resize handler")
        div.removeEventListener('mousedown', onmousedown)
        div.removeEventListener('mouseover', onmouseover)
        div.removeEventListener('mouseout', onmouseout)
        document.removeEventListener('mousemove', onmousemove);
        document.removeEventListener('mouseup', onmouseup);
    }
}
function paddingDiff(col) {

    if (getStyleVal(col, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padLeft = getStyleVal(col, 'padding-left');
    var padRight = getStyleVal(col, 'padding-right');
    return (parseInt(padLeft) + parseInt(padRight));

}

function getStyleVal(elm, css) {
    return (window.getComputedStyle(elm, null).getPropertyValue(css))
}