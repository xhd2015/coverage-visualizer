

export function paddingXDiff(e: HTMLElement): number {
    if (getCSSVal(e, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padLeft = getCSSVal(e, 'padding-left');
    var padRight = getCSSVal(e, 'padding-right');
    return (parseInt(padLeft) + parseInt(padRight));
}
export function paddingYDiff(e: HTMLElement): number {
    if (getCSSVal(e, 'box-sizing') == 'border-box') {
        return 0;
    }

    var padTop = getCSSVal(e, 'padding-top');
    var padBottom = getCSSVal(e, 'padding-bottom');
    return (parseInt(padTop) + parseInt(padBottom));
}

function getCSSVal(elm: HTMLElement, property: string): string {
    return (window.getComputedStyle(elm, null).getPropertyValue(property))
}