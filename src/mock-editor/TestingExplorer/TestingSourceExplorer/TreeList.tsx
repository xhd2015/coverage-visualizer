import { CSSProperties, useEffect, useState } from "react"
import ExpandList, { ExpandItem, ExpandListProps, useSelect } from "../../ExpandList"

export interface TreeItem extends Omit<ExpandItem, "children"> {
    parent?: TreeItem
    path: string
    children?: TreeItem[]
}

export interface TreeListProps<E extends Omit<TreeItem, "children"> & { children?: E[] }> {
    style?: CSSProperties
    items: E[]
    className?: string

    selectedNode?: string

    onClickItem?: (e: E) => void

    expandListProps?: ExpandListProps<E>
}

// a TreeList should support:
//    search, filter, collapse, clickable
// just by default

// when selected: should render background color proper
// click: allow repeated click
// search: allow partial match
// collapse: multi level expand
// display: name ellipse

export function TreeList<E extends Omit<TreeItem, "children"> & { children?: E[] }>(props: TreeListProps<E>) {
    const [currentClickNode, setCurrentClickNode] = useState<string>(props.selectedNode);
    const { selectedController, setSelectedController, getSelectAction } =
        useSelect<E>({
            onSelectChange: (item, root, index) => {
                // NOTE: this maybe called more than once for single select
                // so do what ever you can to prevent duplicate
            },
        });
    useEffect(() => {
        setCurrentClickNode(props.selectedNode)
    }, [props.selectedNode])

    return <div className={props.className} style={props.style}>
        <ExpandList<E>
            showFileIcon
            {...props.expandListProps}
            // toggleExpandRef={toggleExpandRef}
            // searchCallbackRef={searchCallbackRef}
            // initialAllExpanded={true}
            items={props.items}
            itemStyle={{ "position": "relative" }}

            currentClickNode={currentClickNode}
            // expandOnClick={false}
            render={(item, controller) => {
                return <TreeItemRender
                    file={item}
                    onClick={() => {
                        const action = getSelectAction(item, controller);
                        action?.();
                        setCurrentClickNode(item.path)
                        props.onClickItem?.(item)
                    }}
                />
            }}
        />
    </div>
}

export interface TreeItemRenderList<E> {
    style?: CSSProperties
    className?: string
    onClick?: () => void
    file: E
}

export function TreeItemRender<E extends Omit<TreeItem, "children"> & { children?: E[] }>(props: TreeItemRenderList<E>) {
    return <div
        className={props.className}
        style={{
            // by default indicate clickable
            cursor: "pointer",
            ...props.style
        }}
        onClick={props.onClick}
    >
        {props.file?.key}
    </div>
}