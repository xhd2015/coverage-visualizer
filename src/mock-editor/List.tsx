import { CSSProperties, useEffect, useMemo, useState } from "react"
import { useCurrent } from "./react-hooks"

// the core implementation of a nested list
// the key here is that the components are stateless, i.e. there is no
// internal state maintained so it's simple and care nothing about onChange...
// let's care state in the outside, like in ExpandList


export type ItemPath = string[]
export type ItemIndex = number[]

// return unsubscriber
export type SubscribeUpdate<T extends Item> = (handler: (item: T) => void) => () => void
export type DispatchUpdate<T extends Item> = (getUpdate: (prev: T) => T) => void

// it implements recursive List nesting, with no other functions included 
export interface ListProps<T extends Item> {
    parentPath?: ItemPath
    items?: T[] // single root or item list
    render?: (item: T, path: ItemPath) => any
    getSubscribeUpdate?: (item: T, path: ItemPath) => SubscribeUpdate<T> // should be memorized

    style?: CSSProperties
    className?: string
}

export function List<T extends Item>(props: ListProps<T>) {
    // console.log("List changed:", props.items)
    return <ul style={props.style} className={props.className}>
        <ListItems items={props.items} render={props.render} parentPath={props.parentPath} getSubscribeUpdate={props.getSubscribeUpdate} />
    </ul>
}

export interface Item {
    key: string
    children?: Item[]
    itemStyle?: CSSProperties
    itemClassName?: string

    listStyle?: CSSProperties
    listClassName?: string
    hide?: boolean
    hideList?: boolean
}

export interface ListItemsProps<T extends Item> extends ListProps<T> {
}

export function ListItems<T extends Item>(props: ListItemsProps<T>) {
    // check keys
    const checkKeys = true
    if (checkKeys) {
        const keys = {}
        props.items?.forEach(e => {
            if (e.key === undefined) {
                console.error("WARNING item no key:", e.key)
                return
            }
            if (keys[e.key]) {
                console.error("WARNING duplicate key:", e.key)
                return
            }
            keys[e.key] = true
        })
    }
    return <>{
        props.items?.map?.(item => <ListItem
            // !!!! a bug that needs to be noted here:
            // I forgot to add the `key`(which should be unique)
            // caused me 3 hours from 22:00 to 01:00 to locate it
            // this is really a lesson taught by React, thank you, React!(b*tch)
            //
            // key: if keys are the same, then the children may be incorrectly mapped.
            // using index as key is not a good practice here.
            key={item.key}
            // !!!!

            item={item}
            parentPath={props.parentPath}
            render={props.render}
            getSubscribeUpdate={props.getSubscribeUpdate}
        />)
    }</>
}

export interface ListItemProps<T extends Item> {
    item?: T
    parentPath?: ItemPath
    render?: ListItemsProps<T>["render"]
    getSubscribeUpdate?: (item: T, path: ItemPath) => SubscribeUpdate<T>
}
export function ListItem<T extends Item>(props: ListItemProps<T>) {
    const [item, setItem] = useState<T>(props.item)
    const itemPath = useMemo(() => [...(props.parentPath || []), item?.key], [props.parentPath, item?.key])

    const itemPathRef = useCurrent(itemPath)
    const itemRef = useCurrent(item)

    // if the element gets reused, we should ensure subscriber valid
    const getSubscribeUpdateRef = useCurrent(props.getSubscribeUpdate)
    useEffect(() => {
        if (getSubscribeUpdateRef.current) {
            const sub = getSubscribeUpdateRef.current(itemRef.current, itemPathRef.current)
            if (sub) {
                // console.log("ListItem will sub:", item.key)
                return sub((item: T) => {
                    // console.log("update via ref:", item.key, item)
                    setItem(item)
                })
            }
        }
    }, [props.item])

    useEffect(() => {
        if (props.getSubscribeUpdate) {
            const sub = props.getSubscribeUpdate(itemRef.current, itemPathRef.current)
            if (sub) {
                // console.log("ListItem will sub:", item.key)
                return sub((item: T) => {
                    // console.log("update via ref:", item.key, item)
                    setItem(item)
                })
            }
        }
    }, [])

    // reactive to prop change
    useEffect(() => setItem(props.item), [props.item])

    return !item.hide && <li key={item.key} style={item.itemStyle} className={item.itemClassName}>
        {props.render?.(item, itemPath)}
        {
            !item.hideList && <List
                parentPath={itemPath}
                items={item.children}
                render={props.render}
                style={item.listStyle}
                className={item.listClassName}
                getSubscribeUpdate={props.getSubscribeUpdate}
            />
        }
    </li>
}