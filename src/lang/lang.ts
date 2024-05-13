export type Language = string

export interface LanguageTexts {
    [key: Language]: string
}

export interface LanguageTextMapping {
    getText: (languages: Language[]) => string | undefined
}

export function newTextMapping(texts: LanguageTexts): LanguageTextMapping {
    return new LanguageTextMappingImpl(texts)
}

// langages: 
//   navigator.languages => ['en-US', 'zh-CN', 'en']
export function getText(texts: LanguageTexts, languages: Language[]): string | undefined {
    if (texts == null) {
        return null
    }
    if (languages == null || languages.length === 0) {
        languages = ['en']
    }
    let triedEn = false
    for (let lang of languages) {
        if (!lang) {
            continue
        }

        const textWithZone = texts[lang]
        if (textWithZone != null) {
            return textWithZone
        }

        let zone = ''
        let langNoZone = lang
        const idx = lang.indexOf("-")
        if (idx >= 0) {
            zone = lang.slice(idx + 1)
            langNoZone = lang.slice(0, idx)
        }
        if (langNoZone === 'en') {
            triedEn = true
        }
        if (langNoZone !== lang) {
            const textNoZone = texts[lang]
            if (textNoZone != null) {
                return textNoZone
            }
        }
    }

    if (!triedEn) {
        const text = texts["en"]
        if (text != null) {
            return text
        }
    }

    // return the first one
    for (let k in texts) {
        return texts[k]
    }

    return null
}

class LanguageTextMappingImpl {
    texts: LanguageTexts
    constructor(texts: LanguageTexts) {
        this.texts = texts
    }
    getText(languages: Language[]): string | undefined {
        return getText(this.texts, languages)
    }
}