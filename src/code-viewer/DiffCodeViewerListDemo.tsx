import { CSSProperties, useState, useEffect } from "react"
import { diffCode } from "./diff"
import { DiffCodeViewerTitled } from "./DiffCodeViewer"
import ViewerList from "./ViewerList"
import { go } from "./lang"

export interface Item {
    name?: string
}

export default function (props: DiffCodeViewerListDemoProps) {
    return <ViewerList<Item>
        style={{
            height: "100px",
            border: "1px solid red"
        }}
        hasMore={n => n < 20}
        loadMore={i => {
            return new Promise(resolve => {
                setTimeout(() => resolve([{ name: `hi:${Math.random() * 10}` }]), 1000)
            })
        }}
        renderItem={(item, i) => <LazyItem
            title={item.name}
            key={i + 1}
            placeholder={<div>....</div>}
            loader={() => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(<div>{'You are luck!'}</div>), 2000)
                })
            }}
        />}
    />
}

export interface LazyItemProps {
    title?: string
    placeholder?: any
    loader?: () => Promise<any>
}
// title goes first, then content load
export function LazyItem(props: LazyItemProps) {
    const [loadedItem, setLoadedItem] = useState()
    useEffect(() => {
        Promise.resolve(props.loader?.()).then(setLoadedItem)
    }, [])

    return <div>
        <div>{props.title}</div>
        {
            loadedItem || props.placeholder
        }
    </div>
}

export interface DiffCodeViewerListDemoProps {
    style?: CSSProperties
    className?: string
}

export function DiffCodeViewerListTitledDemo(props: DiffCodeViewerListDemoProps) {
    return <ViewerList<Item>
        style={{
            height: "100%",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            position: "relative",
            // border: "1px solid red"
            ...props.style,
        }}
        hasMore={n => n < 20}
        loadMore={i => {
            return new Promise(resolve => {
                setTimeout(() => resolve([{ name: `src/biz_${Math.floor(Math.random() * 10)}.go` }]), 1000)
            })
        }}
        renderItem={(item, i) => <DiffCodeViewerTitled
            title={item.name}
            key={i + 1}
            style={{
                marginBottom: "20px",
            }}
            titleStyle={{
                position: "sticky",
                top: "0",
                zIndex: "20",
                backgroundColor: "#FAFAFA",
            }}
            loadLines={async () => {
                const lines = diffCode(
                    `package main

func main(){
    // file: ${i}
    fmt.Printf("hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")
    // end
}
`,
                    `package main

func main(){
    // file at: ${i}
    // comment
    fmt.Printf("world")
}`,
                    {
                        baseProps: {
                            grammar: go.grammar,
                            language: go.langauge,
                        }
                    }
                )
                return new Promise(resolve => setTimeout(() => resolve(lines), 1000))
            }}
        />}
    />
}