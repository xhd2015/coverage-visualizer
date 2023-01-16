
import { useState } from "react"
import Button from "./Button"
import Dialog, { ConfirmDialog, useDialogControl } from "./Dialog"

export interface DialogDemoProps {
}

export default function DialogDemo(props: DialogDemoProps) {
    const [show, setShow] = useState(false)
    return <div >
        <Button onClick={() => setShow(true)}>click</Button>

        <ConfirmDialog title="shit" msg="shit" onDiscard={() => new Promise(resolve => setTimeout(resolve, 1 * 1000))}
            show={show}
            onShow={setShow}
        />
    </div>
}