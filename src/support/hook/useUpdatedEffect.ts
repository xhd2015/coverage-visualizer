import { useEffect, useRef } from "react";

export function useUpdatedEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
    const init = useRef(true)
    useEffect(() => {
        if (init.current) {
            init.current = false
            return
        }
        return effect()
    }, deps)
}