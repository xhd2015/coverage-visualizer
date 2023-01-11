


export function throttle<T extends (...args) => Promise<any>>(fn: T, limit: number): T {
    if (limit <= 0) {
        return fn
    }
    let cur = 0
    let waits = []
    const tryInvokePromised = (args, resolve, reject) => {
        if (cur < limit) {
            cur++
            const action = (async () => fn(...args))()
            action.finally(() => {
                cur--
                if (waits.length) {
                    // pop head
                    let [args, resolve, reject] = waits.splice(0, 1)[0]
                    tryInvokePromised(args, resolve, reject)
                }
            })
            action.then(resolve).catch(reject)
        } else {
            waits.push([args, resolve, reject])
        }
    }

    const tryInvoke = ((...args) => {
        if (cur < limit) {
            cur++
            const action = (async () => fn(...args))()
            action.finally(() => {
                cur--
                if (waits.length) {
                    // pop head
                    let [args, resolve, reject] = waits.splice(0, 1)[0]
                    tryInvokePromised(args, resolve, reject)
                }
            })
            return action
        }
        return new Promise((resolve, reject) => {
            waits.push([args, resolve, reject])
        })
    }) as any as T

    return tryInvoke
}