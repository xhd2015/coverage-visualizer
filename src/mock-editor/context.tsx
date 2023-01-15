

// in a 3 column layout,
// A |    B
//   | B1  B2 
//   
// when A is re-layouted,B1,B2 should also be relayouted

const rootResizeListeners: (() => void)[] = []

// return destroy
export function notifyRootResize() {
    rootResizeListeners.forEach(e => e())
}

// return destroy
export function onRootResize(fn: () => void): () => void {
    rootResizeListeners.push(fn)
    return () => {
        const idx = rootResizeListeners.indexOf(fn)
        rootResizeListeners.splice(idx, 1)
    }
}