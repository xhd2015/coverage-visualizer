import { CSSProperties } from "react"
import { TreeItem, TreeList } from "./TreeList"
import { ExpandItem, ExpandListProps } from "../../ExpandList"
import { buildFileTree } from "./util"

export interface TreeListDemoProps {
    style?: CSSProperties
    className?: string
    items?: TreeItem[]
    expandListProps?: ExpandListProps<TreeItem>
}

interface DemoItem extends TreeItem {
    children?: DemoItem[]
}

const items: DemoItem[] = [
    {
        key: "src",
        path: "src",
        children: [{
            key: "main.go",
            path: "src/main.go",
            leaf: true,
        }]
    }
]
const items2 = buildFileTree(["src/main.go"])

export function TreeListDemo(props: TreeListDemoProps) {
    return <TreeList
        style={{
            width: "400px",
            border: "1px solid grey",
            paddingLeft: "16px",
            overflowY: 'auto',
            overflowX: "hidden",
            ...props.style,
        }}
        // items={items}
        items={props.items ?? items}
        expandListProps={props.expandListProps}
    />
}