import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'
import { Section, SectionHeading } from '@/components/Section'
import { PHONE_NUMBERS } from '@/components/SiteFooter'

export function ContactPage() {
  const { t } = useTranslation('home')

  return (
    <Section>
      <SectionHeading
        eyebrow={t('contactEyebrow')}
        title={t('contactTitle')}
        subtitle={t('contactSubtitle')}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{t('callUs')}</h3>
          <ul className="mt-4 space-y-3">
            {PHONE_NUMBERS.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone}`}
                  className="text-foreground hover:text-primary transition-smooth flex min-h-11 items-center gap-3 text-lg font-medium tabular-nums"
                >
                  <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-xl">
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Shared with the Home contact section; submit handling unchanged. */}
        <ContactForm idPrefix="contact-page" />
      </div>
    </Section>
  )
}
