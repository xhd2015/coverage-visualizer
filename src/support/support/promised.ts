

export class Promised<T> {
    fn: () => Promise<T>
    ongoingPromise: Promise<T>
    cached: boolean
    cachedValue: T
    cachedErr: any
    id: number

    constructor(fn: () => Promise<T>) {
        this.fn = fn
        this.id = 0
        this.reset()
    }
    reset() {
        this.ongoingPromise = null
        this.cached = false
        this.cachedValue = null
        this.cachedErr = null
        this.id++
    }
    get value(): Promise<T> {
        if (this.cached) {
            if (this.cachedErr) {
                return Promise.reject(this.cachedErr)
            }
            return Promise.resolve(this.cachedValue)
        }
        if (this.ongoingPromise) {
            return this.ongoingPromise
        }
        const id = this.id
        return this.ongoingPromise = Promise.resolve(this.fn()).then(e => {
            if (id === this.id) {
                this.cached = true
                this.cachedValue = e
            }
            return e
        }).catch(e => {
            if (id === this.id) {
                this.cached = true
                this.cachedErr = e
            }
            throw e
        })
    }
}