import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'

/** The four numbers appear here and in the Home contact section. */
export const PHONE_NUMBERS = [
  '0102410741',
  '0102410742',
  '0102410743',
  '0102410744',
]

const COMPANY_LINKS = [
  { to: '/about', key: 'nav:about' },
  { to: '/services', key: 'nav:services' },
  { to: '/contact', key: 'nav:contact' },
] as const

const TOOL_LINKS = [
  { to: '/calculator', key: 'nav:calculator' },
  { to: '/tracking', key: 'footer:vinTracking' },
  { to: '/dashboard', key: 'common:dashboard' },
] as const

export function SiteFooter() {
  const { t } = useTranslation(['footer', 'nav', 'common'])

  return (
    <footer className="border-border bg-gradient-subtle border-t">
      <div className="container mx-auto px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            {/* Larger here than in the header -- there is room for it. */}
            <Logo className="h-14" />
            <p className="text-muted-foreground max-w-xs text-sm">
              {t('footer:tagline')}
            </p>
          </div>

          <nav aria-labelledby="footer-company">
            <h2
              id="footer-company"
              className="text-foreground mb-3 text-sm font-semibold"
            >
              {t('footer:company')}
            </h2>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-tools">
            <h2
              id="footer-tools"
              className="text-foreground mb-3 text-sm font-semibold"
            >
              {t('footer:tools')}
            </h2>
            <ul className="space-y-2">
              {TOOL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-foreground mb-3 text-sm font-semibold">
              {t('footer:contact')}
            </h2>
            <ul className="space-y-2">
              {PHONE_NUMBERS.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone}`}
                    className="text-muted-foreground hover:text-primary transition-smooth flex items-center gap-2 text-sm"
                  >
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    {phone}
                  </a>
                </li>
              ))}
              <li className="text-muted-foreground flex items-start gap-2 pt-1 text-sm">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {t('footer:address')}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-wrap items-center justify-between gap-2 border-t pt-6 text-sm">
          <p>{t('footer:rights')}</p>
          <p>{t('footer:builtFor')}</p>
        </div>
      </div>
    </footer>
  )
}
