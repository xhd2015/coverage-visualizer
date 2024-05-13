import React, { useContext } from "react"
import { Language } from "./lang"

const languages: Language[] = [...navigator.languages]

export const LanguageContext = React.createContext({
    languages: languages,
    // setLanguage: () => {

    // }
})

export function useLanguages(): Language[] {
    const { languages } = useContext(LanguageContext)
    return languages
}
