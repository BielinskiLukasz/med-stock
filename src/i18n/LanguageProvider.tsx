import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang, TranslationDict } from './types'
import { LangContext } from './index'
import { en } from './en'
import { pl } from './pl'

const STORAGE_KEY = 'medstock-lang'
const VALID_LANGS: readonly Lang[] = ['en', 'pl']

function isValidLang(value: unknown): value is Lang {
  return VALID_LANGS.includes(value as Lang)
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isValidLang(saved) ? saved : 'en'
  })

  const setLang = (newLang: Lang) => {
    localStorage.setItem(STORAGE_KEY, newLang)
    setLangState(newLang)
  }

  const dict: TranslationDict = lang === 'pl' ? pl : en

  function t(key: string): string {
    const dotIndex = key.indexOf('.')
    if (dotIndex === -1) return key
    const ns = key.slice(0, dotIndex)
    const subKey = key.slice(dotIndex + 1)
    const sections = dict as unknown as Record<string, Record<string, unknown>>
    const section = sections[ns]
    if (typeof section !== 'object' || section === null) return key
    const value = section[subKey]
    if (typeof value === 'string') return value
    return key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}
