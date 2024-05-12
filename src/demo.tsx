import * as React from 'react';
import { createRoot } from "react-dom/client";
import ExpandListDemo from "./mock-editor/ExpandListDemo"

const rootElement = document.getElementById('root');
const root = createRoot(rootElement)


interface Demo {
    name: string
    component: React.ReactElement
}

const demos: Demo[] = [
    {
        name: "hello",
        component: <div>Hello World!</div>
    }, {
        name: "ExpandListDemo",
        component: <ExpandListDemo />
    },
]

function DemoList() {
    const [name, setName] = React.useState("ExpandListDemo")
    const component = React.useMemo(() => {
        const d = demos.find(e => e.name === name)
        return d?.component
    }, [name])
    return <ul>
        {
            demos.map(e => <li
                key={e.name}
                onClick={() => setName(e.name)}
                style={{ cursor: "pointer", color: e.name === name ? "green" : "" }}
            >{e.name}</li>)
        }
        {component}
    </ul>
}

root.render(<DemoList />)