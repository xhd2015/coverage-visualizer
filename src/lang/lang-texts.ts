import { LanguageTextMapping, newTextMapping } from "./lang"

export const incrementSwitchPrompt = newTextMapping({
    "en": "Empty files, switch to ",
    "zh": "增量文件为空,切换到 ",
})

export const incrementEmptyReason = newTextMapping({
    "en": "Why empty files? Probably only config or test files were modified",
    "zh": "为什么增量文件为空?只改动了配置文件或测试文件,不包含可执行代码",
})

export const fullCode = newTextMapping({
    "en": "Full Files",
    "zh": "全量代码 ",
})

export const coverageMode = newTextMapping({
    "en": "Coverage Mode",
    "zh": "覆盖率模式"
})

export const coverageModeDescFull = newTextMapping({
    "en": "Full: all covered lines, excluding non-functional code(e.g. comment, import and type)",
    "zh": "全量覆盖率: 所有代码行中被覆盖的部分, 不包含非函数代码(如: 注释,import和type声明等语句)"
})

export const coverageModeDescIncremental = newTextMapping({
    "en": "Incremental: added or updated lines that were covered, usually diff with master",
    "zh": "增量覆盖率: 所有新增或变化的代码中被覆盖的部分, 通常是和master进行对比"
})

export const color = newTextMapping({
    "en": "Colors",
    "zh": "颜色"
})

export const updatedDesc = newTextMapping({
    "en": "Modification: ",
    "zh": "变更: "
})

export const updatedDescColorGreen = newTextMapping({
    "en": "green",
    "zh": "绿色"
})

export const updatedDescEnd = newTextMapping({
    "en": " marking update, ",
    "zh": "标记变更，"
})

export const updatedDescColorRed = newTextMapping({
    "en": "red",
    "zh": "红色"
})

export const updatedDescMarkingDelete = newTextMapping({
    "en": " marking deletion",
    "zh": "标记删除"
})

export const coverageDesc = newTextMapping({
    "en": "Coverage: ",
    "zh": "覆盖: "
})

export const coverageDescLightBlue = newTextMapping({
    "en": "light blue",
    "zh": "淡蓝色"
})

export const coverageDescMarkingCovered = newTextMapping({
    "en": " marking a line was covered,",
    "zh": "标记代码行已被覆盖,"
})

export const coverageDescLightYellow = newTextMapping({
    "en": "light yellow",
    "zh": "浅黄色"
})
export const coverageDescMarkingNotCovered = newTextMapping({
    "en": " marking a line was not covered",
    "zh": "标记代码行未被覆盖"
})

export const coverageModeNames: Record<string, LanguageTextMapping> = {
    "all": newTextMapping({
        "en": "Full",
        "zh": "全量代码",
    }),
    "all.nocov": newTextMapping({
        "en": "Full Uncovered",
        "zh": "全量未覆盖"
    }),
    "incremental": newTextMapping({
        "en": "Incremental",
        "zh": "增量代码"
    }),
    "incremental.nocov": newTextMapping({
        "en": "Incremental Uncovered",
        "zh": "增量未覆盖"
    })
}

export const coverageIndicatorNames: Record<string, LanguageTextMapping> = {
    "covered": newTextMapping({
        "en": "Covered",
        "zh": "覆盖",
    }),
    "uncovered": newTextMapping({
        "en": "Uncovered",
        "zh": "未覆盖"
    }),
    "deleted": newTextMapping({
        "en": "Deleted",
        "zh": "删除"
    }),
    "modified": newTextMapping({
        "en": "Modified",
        "zh": "变更"
    })
}

export const searchFileOrDirPlaceholder = newTextMapping({
    en: "Search",
    zh: "搜索文件或目录"
})


export const toolBarExpandAll = newTextMapping({
    en: "Expand All",
    zh: "全部展开"
})
export const toolBarExpand1 = newTextMapping({
    en: "Expand Lv.1",
    zh: "一级展开"
})
export const toolBarExpand2 = newTextMapping({
    en: "Expand Lv.2",
    zh: "二级展开"
})
export const toolBarExpand3 = newTextMapping({
    en: "Expand Lv.3",
    zh: "三级展开"
})

export const coverageMenuAdvanced = newTextMapping({
    en: "Advanced",
    zh: "高级"
})
