import { createContext, useContext } from 'react'
import type { Lang, TranslationDict } from './types'

// Re-export types so callers only need to import from '@/i18n'
export type { Lang, TranslationDict }
export { CATEGORY_KEYS, LOCATION_KEYS, FORM_TYPE_KEYS } from './types'

// Re-export LanguageProvider from the JSX file
export { LanguageProvider } from './LanguageProvider'

// ─── Context ─────────────────────────────────────────────────────────────────

export interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

export const LangContext = createContext<LangContextValue | null>(null)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (ctx === null) {
    throw new Error('useLang must be used inside LanguageProvider')
  }
  return ctx
}
