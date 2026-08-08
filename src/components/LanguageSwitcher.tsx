import { useTranslation } from 'react-i18next'
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES } from '@/i18n/config'
import { useLocale } from '@/i18n/use-locale'
import { cn } from '@/lib/utils'

/**
 * EN / AZ / RU pill group, matching the header nav styling.
 *
 * Built as a radiogroup so the whole control is one tab stop and arrow keys
 * move between options, which is the expected pattern for a small set of
 * mutually exclusive choices. `aria-checked` announces the active language.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation('common')
  const { locale, setLocale } = useLocale()

  return (
    <div
      role="radiogroup"
      aria-label={t('language')}
      className={cn(
        'bg-secondary/60 border-border/60 inline-flex items-center gap-0.5 rounded-full border p-0.5',
        className,
      )}
    >
      {LOCALES.map((option) => {
        const isActive = option === locale
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            // Only the active option is in the tab order; arrows move within.
            tabIndex={isActive ? 0 : -1}
            lang={option}
            title={LOCALE_NAMES[option]}
            onClick={() => setLocale(option)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
              event.preventDefault()
              const step = event.key === 'ArrowRight' ? 1 : -1
              const next =
                LOCALES[(LOCALES.indexOf(locale) + step + LOCALES.length) % LOCALES.length]
              setLocale(next)
            }}
            className={cn(
              'transition-smooth focus-visible:ring-ring rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none',
              isActive
                ? 'bg-card text-primary shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="sr-only">{LOCALE_NAMES[option]}</span>
            <span aria-hidden="true">{LOCALE_LABELS[option]}</span>
          </button>
        )
      })}
    </div>
  )
}
