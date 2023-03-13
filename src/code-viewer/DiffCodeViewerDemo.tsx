import DiffCodeViewer, { DiffCodeViewerTitled } from "./DiffCodeViewer";
import { go } from "./lang"
import "./CodeViewer.css"
import { lineDelete, lineNew } from "./styles";
import { compactLines, diffCode, diffLines } from "./diff";
import { ChangeType } from "./diff-vscode";

export interface DiffCodeViewerDemoProps {
}

export default function (props: DiffCodeViewerDemoProps) {
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
                            className: lineDelete,
                            grammar: go.grammar,
                            language: go.langauge,
                        },
                        newLine: {
                            lineNumber: 3005,
                            value: "fmt.Printf('hello\\n')",
                            className: lineNew,
                            grammar: go.grammar,
                            language: go.langauge,
                        }
                    }
                },

            ]
        }
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