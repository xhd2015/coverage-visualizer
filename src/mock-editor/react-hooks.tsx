import { useState } from "react"

export function useCurrent<T>(v: T): { current: T } {
    const [ref] = useState({ current: v })
    ref.current = v
    return ref
}