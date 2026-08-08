import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, readStoredLocale, type Locale } from './config'
import { en } from './locales/en'
import { az } from './locales/az'
import { ru } from './locales/ru'

/**
 * i18next is configured with one namespace per area, keyed exactly as the
 * catalogue objects are. English is the fallback for every missing key.
 */
const resources = {
  en: en,
  az: az,
  ru: ru,
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  // Namespaces are the top-level keys of each catalogue.
  ns: Object.keys(en),
  defaultNS: 'common',
  interpolation: {
    // React already escapes rendered values.
    escapeValue: false,
  },
  returnNull: false,
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: import.meta.env.DEV
    ? (lngs, ns, key) => {
        console.warn(
          `[i18n] missing key "${ns}:${key}" for locale(s) ${lngs.join(', ')} — falling back to English`,
        )
      }
    : undefined,
})

/** Keeps <html lang> in step with the active locale. */
export function applyHtmlLang(locale: Locale): void {
  document.documentElement.lang = locale
}

applyHtmlLang(readStoredLocale())

export default i18n
