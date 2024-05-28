import { useState } from "react"
import { useCurrent } from "./useCurrent"

export function useLoading(action: () => Promise<void>): [loading: boolean, run: () => Promise<void>] {
    const [loading, setLoading] = useState(false)
    const actionRef = useCurrent(action)
    const run = async () => {
        if (actionRef.current == null) {
            return
        }
        setLoading(true)
        try {
            await actionRef.current()
        } finally {
            setLoading(false)
        }
    }
    return [loading, run]
}