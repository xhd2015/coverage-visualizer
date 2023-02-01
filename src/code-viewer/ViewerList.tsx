
import { useCurrent } from "../mock-editor/react-hooks";
import { useState, useCallback, CSSProperties } from "react"
import InfiniteScroll from 'react-infinite-scroller';

import { FixedSizeList } from "react-window";

export interface ViewerListProps<T> {
    style?: CSSProperties
    renderItem?: (item: T, index: number) => any

    loadMore?: (start: number) => (Promise<T[]> | T[])
    hasMore?: (loadedNum: number) => boolean
}

export default function <T>(props: ViewerListProps<T>) {
    const [items, setItems] = useState<T[]>([]);

    const hasMore = props.hasMore?.(items?.length || 0)

    const itemsRef = useCurrent(items)
    const loadMoreRef = useCurrent(props.loadMore)
    const hasMoreRef = useCurrent(hasMore)
    const loadMore = useCallback(async () => {
        if (!hasMoreRef.current) {
            return
        }
        const moreItems = await loadMoreRef.current?.(itemsRef.current?.length)
        setItems([...itemsRef.current, ...moreItems])
    }, [])

    return <div style={{ overflow: "auto", ...props.style }}>
        <InfiniteScroll
            pageStart={0}
            loadMore={loadMore}
            hasMore={hasMore}
            loader={<div className="loader" key={"0_loader"}>Loading ...</div>}
            getScrollParent={() => {

            }}
            useWindow={false}
        >
            {items?.map?.((item, i) => props.renderItem?.(item, i))}
        </InfiniteScroll>
    </div>
}

export interface VirtualListProps {
}

export function VirtualList(props: VirtualListProps) {
    return <FixedSizeList

    />
}