import { CSSProperties } from "react"
import { RenderBlockLine } from "../DiffCodeViewer"
import { ChangeType } from "../diff-vscode"
import { go } from "../lang"

export interface BlockLineDemoProps {
    style?: CSSProperties
    className?: string
}

export function BlockLineDemo(props: BlockLineDemoProps) {
    return <RenderBlockLine
        newLineHoverElement={<div>Shit</div>}
        line={
            {
                index: 0,
                changeType: ChangeType.Update,
                oldLine: {
                    lineNumber: 1,
                    value: "A",
                    grammar: go.grammar,
                    language: go.langauge,
                },
                newLine: {
                    lineNumber: 1,
                    value: "B",
                    grammar: go.grammar,
                    language: go.langauge,
                }
            }
        }
    />
}