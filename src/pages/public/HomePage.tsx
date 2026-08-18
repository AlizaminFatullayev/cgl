import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Anchor,
  BadgeCheck,
  Calculator,
  Phone,
  Quote,
  Search,
  ShieldCheck,
  Ship,
  Tag,
  Truck,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ContactForm } from '@/components/ContactForm'
import { Eyebrow, Section, SectionHeading } from '@/components/Section'
import { PHONE_NUMBERS } from '@/components/SiteFooter'
import { cn } from '@/lib/utils'

/** Figures are brand constants; only the labels are translated. */
const HERO_STATS = [
  { value: '12K+', key: 'statCarsShipped' },
  { value: '60+', key: 'statDestinations' },
  { value: '98%', key: 'statOnTime' },
] as const

/** Fee amounts are brand constants; only the fee names are translated. */
const WAIVED_FEES = [
  { key: 'feeDealerService', amount: '59$' },
  { key: 'feeTransaction', amount: '17$' },
  { key: 'feeLate', amount: '100$' },
  { key: 'feeThc', amount: '150$' },
  { key: 'feeStorage', amount: '50$' },
  { key: 'feeCarfax', amount: '10$' },
] as const

const WHY_US = [
  { icon: ShieldCheck, key: 'whyInsured' },
  { icon: BadgeCheck, key: 'whyAccounts' },
  { icon: Truck, key: 'whyTransporter' },
  { icon: Tag, key: 'whyRates' },
] as const

const STEPS = [
  { icon: Search, key: 'step1' },
  { icon: Truck, key: 'step2' },
  { icon: Anchor, key: 'step3' },
  { icon: Ship, key: 'step4' },
] as const

/**
 * Reviewer names and cities are written as supplied and are never translated;
 * only the quoted text comes from the catalogue.
 */
const REVIEWS = [
  { key: 'review1', author: 'Elvin M.', location: 'Baku, AZ' },
  { key: 'review2', author: 'Sara K.', location: 'Dubai, UAE' },
  { key: 'review3', author: 'Tomas R.', location: 'Vilnius, LT' },
] as const

const FAQ = ['faq1', 'faq2', 'faq3', 'faq4'] as const

export function HomePage() {
  const { t } = useTranslation('home')

  return (
    <>
      {/* 1. HERO */}
      <section className="bg-gradient-hero relative overflow-hidden">
        {/*
          TODO(content): the client still owes us the hero background image.
          Until it arrives this is gradient-only -- drop the photo in as an
          <img> layered under this content, with the gradient kept on top for
          text contrast.
        */}
        <div
          aria-hidden="true"
          className="bg-primary-glow/30 pointer-events-none absolute -top-32 -right-32 size-96 rounded-full blur-3xl"
        />
        <div className="relative container mx-auto px-4 py-24 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <span className="bg-primary-foreground/15 text-primary-foreground inline-flex rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {t('heroBadge')}
            </span>
            <h1 className="text-primary-foreground text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="text-primary-foreground/90 max-w-2xl text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/tracking"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-card text-primary hover:bg-card/90 shadow-soft h-11 rounded-full px-6 md:h-9',
                )}
              >
                <Search className="size-4" />
                {t('trackVin')}
              </Link>
              <Link
                to="/calculator"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-primary-foreground/40 text-primary-foreground h-11 rounded-full bg-transparent px-6 hover:bg-white/10 hover:text-white md:h-9',
                )}
              >
                <Calculator className="size-4" />
                {t('calculateShipping')}
              </Link>
            </div>

            <dl className="grid max-w-lg grid-cols-3 gap-6 pt-8">
              {HERO_STATS.map((stat) => (
                <div key={stat.key}>
                  <dt className="sr-only">{t(stat.key)}</dt>
                  <dd>
                    <span className="text-primary-foreground block text-3xl font-bold tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-primary-foreground/80 text-sm">
                      {t(stat.key)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 2. DEALER BANNER */}
      <Section narrow>
        <div className="bg-gradient-primary shadow-elegant rounded-3xl p-8 md:p-10">
          <div className="space-y-2">
            <p className="text-primary-foreground/90 text-xs font-semibold tracking-wide uppercase sm:text-sm">
              {t('dealersEyebrow')}
            </p>
            <h2 className="text-primary-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              {t('dealersTitle')}
            </h2>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {WAIVED_FEES.map((fee) => (
              <li
                key={fee.key}
                className="bg-primary-foreground/15 text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {t(fee.key)}
                <s className="text-primary-foreground/70">{fee.amount}</s>
                <span aria-hidden="true">→</span>
                <span className="font-bold">0$</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 3. WHY US */}
      <Section>
        <Eyebrow>{t('whyEyebrow')}</Eyebrow>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((item) => (
            <Card
              key={item.key}
              className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
            >
              <CardHeader>
                <span className="bg-accent text-accent-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
                  <item.icon className="size-5" />
                </span>
                <CardTitle className="text-base">
                  {t(`${item.key}Title`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {t(`${item.key}Body`)}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 4. HOW IT WORKS */}
      <Section tinted>
        <SectionHeading eyebrow={t('stepsEyebrow')} title={t('stepsTitle')} />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.key}>
              <Card className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant h-full">
                <CardHeader>
                  <div className="mb-1 flex items-center gap-3">
                    <span className="bg-gradient-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-base font-bold">
                      {index + 1}
                    </span>
                    <step.icon
                      className="text-muted-foreground size-5"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle className="text-base">
                    {t(`${step.key}Title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {t(`${step.key}Body`)}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. REVIEWS */}
      <Section>
        <SectionHeading
          eyebrow={t('reviewsEyebrow')}
          title={t('reviewsTitle')}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <Card
              key={review.key}
              className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
            >
              <CardContent className="space-y-4 pt-6">
                <Quote
                  className="text-primary size-6 opacity-40"
                  aria-hidden="true"
                />
                <blockquote className="text-foreground">
                  “{t(review.key)}”
                </blockquote>
                <footer className="text-muted-foreground text-sm">
                  {/* Name and city are supplied verbatim -- never translated. */}
                  <span className="text-foreground font-medium">
                    {review.author}
                  </span>
                  , {review.location}
                </footer>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 6. FAQ */}
      <Section tinted>
        <SectionHeading eyebrow={t('faqEyebrow')} title={t('faqTitle')} centered />
        <Accordion className="mx-auto mt-10 max-w-3xl">
          {FAQ.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="min-h-11 md:min-h-0">
                {t(`${key}Q`)}
              </AccordionTrigger>
              <AccordionContent>{t(`${key}A`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* 7. CONTACT */}
      <Section>
        <SectionHeading
          eyebrow={t('contactEyebrow')}
          title={t('contactTitle')}
          subtitle={t('contactSubtitle')}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {t('callUs')}
            </h3>
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

          {/* Same component as /contact -- submit handling is untouched. */}
          <ContactForm idPrefix="home-contact" />
        </div>
      </Section>
    </>
  )
}
