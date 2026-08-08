import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { applyHtmlLang } from './index'
import {
  DEFAULT_LOCALE,
  INTL_LOCALES,
  isLocale,
  storeLocale,
  type Locale,
} from './config'

/** Active locale, narrowed to the three we support. */
export function useLocale(): {
  locale: Locale
  setLocale: (next: Locale) => void
  intlLocale: string
} {
  const { i18n: instance } = useTranslation()
  const locale = isLocale(instance.language) ? instance.language : DEFAULT_LOCALE

  const setLocale = useCallback((next: Locale) => {
    void instance.changeLanguage(next)
    storeLocale(next)
    applyHtmlLang(next)
  }, [instance])

  return { locale, setLocale, intlLocale: INTL_LOCALES[locale] }
}

/**
 * The active BCP 47 tag, readable outside React.
 *
 * src/lib/format.ts needs the locale for Intl but is called from plain
 * functions, so it reads it from here rather than threading it through every
 * call site.
 */
export function currentIntlLocale(): string {
  const locale = isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE
  return INTL_LOCALES[locale]
}
