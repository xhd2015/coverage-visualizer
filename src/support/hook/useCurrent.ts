import { useState } from "react"

export interface CurrentRef<T> {
    current: T
}

export function useCurrent<T>(v: T): CurrentRef<T> {
    const [ref] = useState({ current: v })
    ref.current = v
    return ref
}