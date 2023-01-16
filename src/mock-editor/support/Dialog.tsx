import { MutableRefObject, useEffect, useRef, useState } from "react"
import Popup from "./Popup"
import Button from "./Button"
import { useCurrent } from "../react-hooks"
import { Loading } from "./Icon"

export interface ButtonProps {
    text?: string
    color?: string
    handler?: () => (Promise<void> | void)
}

export interface DialogOptions {
    title?: string
    msg?: string
    buttons: {
        [name: string]: ButtonProps
    }
}

export function useDialogControl(): MutableRefObject<DialogControl | undefined> {
    return useRef<DialogControl>()
}
export interface DialogControl {
    showDialog?: (opts: DialogOptions) => void
}

export interface DialogProps {
    controlRef?: MutableRefObject<DialogControl | undefined>
    onShow?: (show: boolean) => void
}

export default function Dialog(props: DialogProps) {
    const [show, setShow] = useState(false)
    const [buttons, setButtons] = useState<{ [name: string]: ButtonProps }>()
    const [handlingButton, setHandlingButton] = useState<string>()

    const [opts, setOpts] = useState<DialogOptions>()

    const onShowRef = useCurrent(props.onShow)
    useEffect(() => {
        onShowRef.current?.(show)
    }, [show])

    if (props.controlRef) {
        props.controlRef.current = {
            showDialog(opts) {
                if (show) {
                    return
                }
                setButtons(opts?.buttons)
                setShow(true)
                setOpts(opts)
            },
        }
    }

    return <>{show && <Popup style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{
            // width: "80%",
            width: "fit-content",
            minWidth: "400px",
            // marginTop: "100px",
            // marginTop: "10%",
            // marginBottom: "auto",

            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: "white",
            // height: "200px",
            height: "fit-content",
        }}>
            <div style={{ backgroundColor: "black", color: "white", display: "flex", alignItems: "end" }}>
                <div>{opts?.title}</div>
                {handlingButton && <Loading style={{ borderTopColor: "white", margin: "1px" }} />}
            </div>
            <div style={{ minHeight: "100px", display: "flex", alignItems: "center", marginLeft: "10px" }}>{opts?.msg}</div>
            <div style={{
                display: "flex",
                // justifyContent: "end",
                justifyContent: "center",
                padding: "1px"
            }}>
                {
                    Object.keys(buttons || {}).map(k => {
                        const buttonProp = buttons[k]
                        return <DialogButton
                            key={k}
                            options={{ ...buttonProp, text: buttonProp?.text || k }}
                            loading={handlingButton === k}
                            disabled={!!handlingButton}
                            onClick={() => {
                                if (handlingButton) {
                                    return
                                }
                                setHandlingButton(k);
                                (async () => buttonProp.handler?.())().then(() => {
                                    setHandlingButton(undefined);
                                    setShow(false)
                                })
                            }}
                        />
                    })
                }
            </div>
        </div>
    </Popup>
    }
    </>
}

export interface DialogButtonProps {
    options?: ButtonProps
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
}
export function DialogButton(props: DialogButtonProps) {

    return <Button
        style={{
            backgroundColor: props.options?.color,
            minWidth: "50px",
            marginLeft: "5px",
        }}
        disabled={props.disabled}
        loading={props.loading}
        // loading
        onClick={props.onClick}>
        {props.options?.text}
    </Button>

}


export interface ConfirmDialogControl {
    popup: () => void
}

export interface ConfirmDialogProps {
    show?: boolean

    title?: string
    msg?: string

    confirmText?: string // default OK

    onShow?: (show: boolean) => void

    controlRef?: MutableRefObject<ConfirmDialogControl>

    onConfirm?: () => (Promise<void> | void)
    onCancel?: () => (Promise<void> | void)
    onDiscard?: () => (Promise<void> | void)
}

export function ConfirmDialog(props: ConfirmDialogProps) {
    const dialogControlRef = useDialogControl()

    const titleRef = useCurrent(props.title)
    const msgRef = useCurrent(props.msg)
    const onConfirmRef = useCurrent(props.onConfirm)
    const onCancelRef = useCurrent(props.onCancel)
    const onDiscardRef = useCurrent(props.onDiscard)

    if (props.controlRef) {
        props.controlRef.current = {
            popup() {

            },
        }
    }

    useEffect(() => {
        if (props.show) {
            dialogControlRef.current?.showDialog?.({
                title: titleRef.current,
                msg: msgRef.current,
                buttons: {
                    [props.confirmText || "OK"]: {
                        color: "#f8fff6",
                        handler: onConfirmRef.current,
                    },
                    "Discard": {
                        color: "#ff9797",
                        handler: onDiscardRef.current,
                    },
                    "Cancel": {
                        handler: onCancelRef.current,
                    },
                }
            })
        }
    }, [props.show])

    return <Dialog controlRef={dialogControlRef} onShow={props.onShow} />
}