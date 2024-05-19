export type HMouseEvent = Omit<MouseEvent, "target"> & { target: HTMLElement }

export interface AttachMouseEventsProps {
    onMouseOver?: (e: HMouseEvent) => void
    onMouseOut?: (e: HMouseEvent) => void
    onMouseDown?: (e: HMouseEvent) => void
    onMouseMove?: (e: HMouseEvent) => void
    onMouseUp?: (e: HMouseEvent) => void
}

// return detach function
export function attachMouseEvents(e: HTMLElement, props: AttachMouseEventsProps | (() => AttachMouseEventsProps)): () => void {
    const getProps = () => typeof props === 'function' ? props() : props

    let watching: boolean

    const onmousedown = function (e: HMouseEvent) {
        const props = getProps()
        watching = true
        props?.onMouseDown?.(e)
    }
    const onmouseover = function (e: HMouseEvent) {
        const props = getProps()
        props?.onMouseOver?.(e)
    }

    const onmouseout = function (e: HMouseEvent) {
        const props = getProps()
        props?.onMouseOut?.(e)
    }
    const onmousemove = function (e: HMouseEvent) {
        if (!watching) {
            return
        }
        const props = getProps()
        props?.onMouseMove?.(e)
    }
    const onmouseup = function (e: HMouseEvent) {
        watching = false
        const props = getProps()
        props?.onMouseUp?.(e)
    }

    e.addEventListener('mousedown', onmousedown);
    e.addEventListener('mouseover', onmouseover)
    e.addEventListener('mouseout', onmouseout)
    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);

    return () => {
        e.removeEventListener('mousedown', onmousedown)
        e.removeEventListener('mouseover', onmouseover)
        e.removeEventListener('mouseout', onmouseout)
        document.removeEventListener('mousemove', onmousemove);
        document.removeEventListener('mouseup', onmouseup);
    }
}