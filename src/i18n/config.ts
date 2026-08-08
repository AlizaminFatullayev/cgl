/** Supported locales. `en` is the default and the fallback for missing keys. */
export const LOCALES = ['en', 'az', 'ru'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Short labels for the header switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  az: 'AZ',
  ru: 'RU',
}

/** Full names, used for the switcher's accessible names. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  az: 'Azərbaycan',
  ru: 'Русский',
}

/** BCP 47 tags for Intl date and number formatting. */
export const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  az: 'az-AZ',
  ru: 'ru-RU',
}

export const STORAGE_KEY = 'cgl.locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Reads the persisted choice. Hand-rolled instead of pulling in a detector package. */
export function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Private mode or storage disabled -- fall through to the default.
  }
  return DEFAULT_LOCALE
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Non-fatal: the choice just will not survive a reload.
  }
}
