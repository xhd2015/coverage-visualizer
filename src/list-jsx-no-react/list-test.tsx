import { createList } from "./list"

const svgDown = () => <svg className="toggle-icon-down" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"></path></svg>
const svgRight = () => <svg className="toggle-icon-right" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"></path></svg>


interface State {
    expanded?: boolean
    text: string
}

const onClick = (e) => {
    console.log("clicked:", e)
    const subList = list.getEnclosingList(e.target as Element)
    console.log("subList:", subList)

    if (!subList) {
        return
    }
    subList.setInfo({ info: <div>Clicked</div> })
}

// data: renderInfo => 
// always by setting data
const list = createList<State>(document.getElementById("root"), {
    key: "root",
    data: {
        text: "B"
    },
    children: [{
        key: "1",
        data: {
            text: "B"
        },
        info: <div>
            B
            <button onClick={(e) => {
                const subList = list.getEnclosingList(e.target)
                if (subList == null) {
                    return
                }
                subList.elInfo.//

                    subList.getChildren().forEach(e => e.remove())
            }}>Remove Children</button>
            <button onClick={(e) => {
                const subList = list.getEnclosingList(e.target)
                if (subList == null) {
                    return
                }
                subList.add({ key: "x", info: "Hello" })
            }}>Add</button>
        </div>,
        children: [{
            key: "1",
            style: { listStyle: "none", cursor: "pointer" },
            data: {
                text: "C"
            },
            info: <div>C
                <button onClick={(e) => {
                    const subList = list.getEnclosingList(e.target)
                    if (subList == null) {
                        return
                    }
                    subList.remove()
                }}>Remove</button>
            </div>
        }]
    }]
}, {
    // create all
    renderInfo(list, item) {
        // TODO: performance
        //      svg down, svg right cache?
        let icon = svgDown()
        if (item.data.expanded === false) {
            icon = svgRight()
            list.getChildren().forEach(e => e.remove())
        }
        return <div> <span onClick={(e) => {
            const subList = list.getEnclosingList(e.target)
            if (subList == null) {
                return
            }
            const prevInfo = subList.getInfo()
            subList.setInfo({
                ...prevInfo,
                data: {
                    ...prevInfo.data,
                    expanded: prevInfo.data.expanded === false ? true : false,
                }
            })
        }}>{icon}</span> <span>{item.data.text}</span></div>
    },
})

list.traverse(e => e.setStyle({ listStyle: "none", cursor: "pointer" }))
