


export interface TreeListOptions<T> {

}
export interface TreeListItem<T> {

}

// React is made to solve tree problems exactly.

export interface ITreeList<T> {
    updateOptions: (opts: Partial<TreeListOptions<T>>) => void

    get: (path: string[]) => TreeListItem<T>
    add: (path: string[], item: TreeListItem<T>) => void
    update: (path: string[], item: Partial<TreeListItem<T>>) => void
    remove: (path: string[]) => void
}


// avoid diff & patch
//
export class TreeList<T> implements ITreeList<T> {

    constructor() {

    }

    // add/delete/update/find an item at given path

}