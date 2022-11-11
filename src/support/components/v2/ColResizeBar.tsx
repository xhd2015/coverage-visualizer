import { useEffect, useRef } from "react"

export default function ColResizeBar() {
    const divRef = useRef<HTMLDivElement>()
    useEffect(() => {
        // console.log("attaching resize handler")
        const detach = attachResizeHandlers(divRef.current)
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

export function attachResizeHandlers(div: HTMLDivElement) {
    let pageX: number
    let monacoContainerWidth: number;
    let monacoContainer: HTMLElement;

    const onmousedown = function (e) {
        // console.log("mousedown:", e)
        // curCol = e.target.parentElement;
        monacoContainer = (e.target as HTMLElement).parentElement.parentElement
        pageX = e.pageX;

        var padding = paddingDiff(monacoContainer);
        monacoContainerWidth = monacoContainer.offsetWidth - padding;
    }
    const onmouseover = function (e) {
        e.target.style.borderRight = '2px solid #0000ff';
    }
    const onmouseout = function (e) {
        e.target.style.borderRight = '';
    }
    const onmousemove = function (e) {
        // console.log("mousemove:", e)
        if (monacoContainer) {
            var diffX = e.pageX - pageX;

            // const padding = paddingDiff(monacoContainer);
            // const monacoContainerWidth = monacoContainer.offsetWidth - padding;
            const newWidth = (monacoContainerWidth + diffX) + 'px';
            // console.log("moving:", monacoContainer, diffX, newWidth)
            monacoContainer.style.width = (monacoContainerWidth + diffX) + 'px';
        }
    }
    const onmouseup = function (e) {
        monacoContainer = undefined;
        pageX = undefined;
        monacoContainerWidth = undefined
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