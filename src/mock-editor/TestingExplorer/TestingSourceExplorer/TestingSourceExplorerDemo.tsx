import { CSSProperties } from "react"
import { TestingSourceExplorer } from "./TestingSourceExplorer"
import { buildFileTree } from "./util"

export interface TestingSourceExplorerDemoProps {
    style?: CSSProperties
    className?: string
}

const files = buildFileTree(["src/main.go"])
const funcs = ["main", "startGo"]
const cases = ["param", "resp"]

export function TestingSourceExplorerDemo(props: TestingSourceExplorerDemoProps) {
    return <TestingSourceExplorer
        files={files}
        funcs={funcs}
        cases={cases}
        codeTabProps={{
            oldCode: `package hello

hello jell
print shit
`,
            newCode: `package hello

hello world
print ok
`,
            lineMapping: {
                1: {
                    uncoverable: true
                },
                2: {
                    uncoverable: true
                },
                3: {
                    covered: true,
                },
                4: {
                    covered: false,
                }
            }
        }}
    />
}