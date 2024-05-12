import DiffCodeViewer, { BlockLineProps, DiffCodeViewerTitled } from "./DiffCodeViewer";
import { go } from "./lang"
import "./CodeViewer.css"
import { CLS_LINE_DELETE, CLS_LINE_NEW } from "./styles";
import { compactLines, diffCode, diffLines } from "./diff";
import { ChangeType } from "./diff-vscode";
import { useEffect, useState } from "react";
import { debounce } from "lodash"
import { GroupSelection } from "./select/select";

export interface DiffCodeViewerDemoProps {
}

export function DiffCodeViewerByLinesDemo(props: DiffCodeViewerDemoProps) {
    return <DiffCodeViewer
        style={{
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        lines={
            [
                {
                    line: {
                        index: 0,
                        changeType: ChangeType.Update,
                        oldLine: {
                            lineNumber: 1,
                            value: "func main(){",
                            grammar: go.grammar,
                            language: go.langauge,
                        },
                        newLine: {
                            lineNumber: 1,
                            value: "func main2(){",
                            grammar: go.grammar,
                            language: go.langauge,
                        }
                    }
                },
                {
                    line: {
                        index: 1,
                        changeType: ChangeType.Update,
                        oldLine: {
                            lineNumber: 15,
                            value: "fmt.Printf('hello')",
                            grammar: go.grammar,
                            language: go.langauge,
                        },
                        newLine: {
                            lineNumber: 17,
                            value: "fmt.Printf('hello\\n')",
                            grammar: go.grammar,
                            language: go.langauge,
                        }
                    }
                },
                {
                    line: {
                        index: 2,
                        changeType: ChangeType.Update,
                        oldLine: {
                            lineNumber: 1001,
                            value: "fmt.Printf('hello')",
                            className: CLS_LINE_DELETE,
                            grammar: go.grammar,
                            language: go.langauge,
                        },
                        newLine: {
                            lineNumber: 3005,
                            value: "fmt.Printf('hello\\n')",
                            className: CLS_LINE_NEW,
                            grammar: go.grammar,
                            language: go.langauge,
                            charRangeStyles: [
                                // simple convert to span
                                // {
                                //     startCol: 1,
                                //     endCol: 3,
                                //     style: {
                                //         // show as delete
                                //         backgroundColor: "#ffadb9"
                                //     }
                                // },

                                // partial convert in the middle
                                {
                                    startCol: 2,
                                    endCol: 2,
                                    style: {
                                        // show as delete
                                        backgroundColor: "#ffadb9"
                                    }
                                },

                                // partial convert suffix
                                // {
                                //     startCol: 1,
                                //     endCol: 2,
                                //     style: {
                                //         // show as delete
                                //         backgroundColor: "#ffadb9"
                                //     }
                                // },

                                // char range across multipe span
                                // {
                                //     startCol: 1,
                                //     endCol: 4,
                                //     style: {
                                //         // show as delete
                                //         backgroundColor: "#ffadb9"
                                //     }
                                // },
                            ]
                        }
                    }
                },

            ]
        }
    />
}

export function DiffCodeViewerCharChangeDemo(props: DiffCodeViewerDemoProps) {
    const [lines, setLines] = useState<BlockLineProps[]>()
    useEffect(() => {
        // diffCode(`fmt.Sprintf`, "fmt .HSpritf_z")
        diffCode(`				AA: B`, `				AA:  B`)
            // diffCode(`fmt.Sprintf`, "fmt .Sprintf")
            .then(diffLines => {
                console.log("diff:", diffLines)
                setLines(diffLines.map(e => ({ line: e })))
            })
    }, [])

    return <DiffCodeViewer
        style={{
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        lines={lines}
    />
}

export function DiffCodeViewerMultilineSelectionDemo(props: DiffCodeViewerDemoProps) {
    const [lines, setLines] = useState<BlockLineProps[]>()
    useEffect(() => {
        // diffCode(`fmt.Sprintf`, "fmt .HSpritf_z")
        diffCode(`AAA\nBBB\nDD`, ` AAA\nBB\nCC\nDD`)
            // diffCode(`fmt.Sprintf`, "fmt .Sprintf")
            .then(diffLines => {
                console.log("diff:", diffLines)
                setLines(diffLines.map(e => ({ line: e })))
            })
    }, [])

    // const groups = [
    //     ".code-viewer-line-old-container .code-viewer-line-content",
    //     ".code-viewer-line-old-container .code-viewer-line-number",
    //     ".code-viewer-line-new-container .code-viewer-line-content",
    //     ".code-viewer-line-new-container .code-viewer-line-number",
    // ]

    // useEffect(() => {
    //     const handler = new GroupSelection(document, groups, {
    //         onSelect: (group, start, end) => {
    //             console.log("select:", group, start, end)
    //         }
    //     })
    //     return () => handler.dispose()
    // }, [])

    return <DiffCodeViewer
        style={{
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        fullDiff
        lines={lines}
    />
}


// const oldCode = `package main

// func main(){
//     fmt.Printf("hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")
//     // end
// }
// `
// const newCode = `package main

// func main(){
//     // comment
//     fmt.Printf("world")
// }`

const oldCode2 = `package biz

import (
	"context"
	"encoding/json"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/constant"
	"math"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/shopspring/decimal"

	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/bizv2"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/bizv2/admin"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/config"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/enums"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/exception"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/types"
	common_util "example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/util"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/model"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/producer"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/repo/dao"
	util "example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/utils"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/db"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/lock"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/log"
	pb "example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com"
)
`
const newCode2 = `package biz

import (
	"context"
	"encoding/json"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/constant"
	"math"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/shopspring/decimal"

	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/bizv2"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/bizv2/admin"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/config"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/enums"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/exception"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/common/types"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/model"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/producer"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/repo/dao"
	util "example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/src/utils"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/db"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/lock"
	"example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com//src/log"
	pb "example.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.comexample.com/"
)
`
const oldCode = `		termInfo.AdminFee = monthMonies[i].Round_admin_fee.String()
termInfo.BtxFee = monthMonies[i].Round_btx_fee.String()
termInfo.TotalFee = monthMonies[i].Display_fee.String()

termInfo.Principal = monthMonies[i].Calc_principal.String()
termInfo.TotalAmount = monthMonies[i].Display_repay_amount.String()
`
const newCode = `		termInfo.AdminFee = monthMonies[i].Round_admin_fee.String()
termInfo.BtxFee = monthMonies[i].Round_btx_fee.String()
termInfo.TotalFee = monthMonies[i].Display_fee.String()
termInfo.IofFee = monthMonies[i].IofFee.String()

termInfo.Principal = monthMonies[i].Calc_principal.String()
termInfo.TotalAmount = monthMonies[i].Display_repay_amount.String()
`

export function DiffCodeViewCodeSnippetDemo() {
    let lines = diffCode(
        oldCode,
        newCode,
        {
            baseProps: {
                grammar: go.grammar,
                language: go.langauge,
            }
        }
    )
    // lines = lines.slice(10, 11)
    // console.log("lines:", lines)
    const compLines = compactLines(lines)
    // console.log("compact lines:", compLines)
    return <DiffCodeViewer
        style={{
            width: "80%",
            marginLeft: "auto",
            marginRight: "auto",
            fontSize: "90%"
        }}
        lines={compLines}
    />
}


export function DiffCodeViewCodeTitleDemo() {
    const lines = diffCode(
        `package main

func main(){
    fmt.Printf("hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")
    // end
}
`,
        `package main

func main(){
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
    return <DiffCodeViewerTitled
        style={{
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto"
        }}
        className="code-viewer-titled"
        title={'src/main.go'}
        loadLines={() => {
            return new Promise(resolve => {
                setTimeout(() => resolve(compactLines(lines)), 1000)
            })
        }}
    />
}