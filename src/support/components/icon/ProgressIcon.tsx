import { createElement, useState } from "react"
import { IconBaseProps } from "react-icons"

export interface ProgressIconProps extends Omit<IconBaseProps, "onClick"> {
    icon?: any
    processingIcon?: any
    onClick?: (e: React.MouseEvent<SVGElement, MouseEvent>) => Promise<void> | void
}
export function ProgressIcon(props: ProgressIconProps) {
    const [processing, setProcessing] = useState(false)
    return createElement((processing && props.processingIcon) ? props.processingIcon : props.icon, {
        ...props,
        style: {
            ...props.style,
            cursor: processing ? "progress" : "pointer"
        },
        icon: undefined, processingIcon: undefined, handle: undefined,
        onClick: async (e) => {
            if (props.onClick == null) {
                return
            }
            setProcessing(true)
            try {
                await props.onClick(e)
            } finally {
                setProcessing(false)
            }
        }
    })
}