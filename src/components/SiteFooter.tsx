import { Link } from 'react-router-dom'
import { MapPin, Phone, Ship } from 'lucide-react'

/** The four numbers appear here and in the Home contact section. */
export const PHONE_NUMBERS = [
  '0102410741',
  '0102410742',
  '0102410743',
  '0102410744',
]

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

const TOOL_LINKS = [
  { to: '/calculator', label: 'Calculator' },
  { to: '/tracking', label: 'VIN Tracking' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function SiteFooter() {
  return (
    <footer className="border-border bg-gradient-subtle border-t">
      <div className="container mx-auto px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <span className="text-foreground flex items-center gap-2 text-base font-bold tracking-tight">
              <span className="bg-gradient-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <Ship className="size-4" />
              </span>
              CGL
            </span>
            <p className="text-muted-foreground max-w-xs text-sm">
              Reliable car shipping from USA auctions to anywhere in the world.
            </p>
          </div>

          <nav aria-labelledby="footer-company">
            <h2
              id="footer-company"
              className="text-foreground mb-3 text-sm font-semibold"
            >
              Company
            </h2>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {link.label}
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
              Tools
            </h2>
            <ul className="space-y-2">
              {TOOL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-foreground mb-3 text-sm font-semibold">
              Contact
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
                Əhməd Rəcəbli küçəsi 3, Narimanov, Bakı
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-wrap items-center justify-between gap-2 border-t pt-6 text-sm">
          <p>© 2026 Caspian Global Logistics. All rights reserved.</p>
          <p>Built for shippers worldwide.</p>
        </div>
      </div>
    </footer>
  )
}
