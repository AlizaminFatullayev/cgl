import { Link } from 'react-router-dom'
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

const HERO_STATS = [
  { value: '12K+', label: 'Cars Shipped' },
  { value: '60+', label: 'Destinations' },
  { value: '98%', label: 'On-time Rate' },
]

const WAIVED_FEES = [
  { label: 'Dealer Service Fee', amount: '59$' },
  { label: 'Transaction Fee', amount: '17$' },
  { label: 'Late Fee', amount: '100$' },
  { label: 'THC', amount: '150$' },
  { label: 'Storage', amount: '50$' },
  { label: 'Carfax Report', amount: '10$' },
]

const WHY_US = [
  {
    icon: ShieldCheck,
    title: 'Fully Insured',
    body: 'Free insurance covers your car door-to-port — 0%, no extra fees.',
  },
  {
    icon: BadgeCheck,
    title: 'Original IAAI & Copart Accounts',
    body: 'We hold verified dealer accounts at IAAI and Copart — bid directly, no middlemen.',
  },
  {
    icon: Truck,
    title: '$350 Car Transporter',
    body: 'Flat $350 inland transport from auction yard to our port — one of the lowest rates on the market.',
  },
  {
    icon: Tag,
    title: 'Best Rates',
    body: 'Direct carrier contracts mean lower prices, no hidden fees.',
  },
]

const STEPS = [
  {
    icon: Search,
    title: 'Find & Buy',
    body: 'Pick a car from any US auction. We bid or accept your VIN.',
  },
  {
    icon: Truck,
    title: 'Pickup & Inland',
    body: 'Auction yard to the loading port within 5–7 days.',
  },
  {
    icon: Anchor,
    title: 'Load at Port',
    body: 'Container or RoRo. Loaded under camera surveillance.',
  },
  {
    icon: Ship,
    title: 'Ship & Deliver',
    body: 'Ocean transit, customs clearance, and final delivery.',
  },
]

const REVIEWS = [
  {
    quote:
      'Picked up my Tesla from Copart and delivered to Baku in 38 days. Tracking updates every step.',
    author: 'Elvin M.',
    location: 'Baku, AZ',
  },
  {
    quote:
      'Best price I could find. The calculator was spot-on with the final invoice.',
    author: 'Sara K.',
    location: 'Dubai, UAE',
  },
  {
    quote: 'Smooth process. The team answered every question within minutes.',
    author: 'Tomas R.',
    location: 'Vilnius, LT',
  },
]

// TODO(content): the original site keeps these answers collapsed, so the real
// copy was never captured. Every answer below is placeholder text.
const FAQ = [
  {
    question: 'How long does shipping take?',
    answer:
      'TODO(content): typical door-to-port and ocean transit times per destination.',
  },
  {
    question: 'Do you handle customs clearance?',
    answer:
      'TODO(content): which destinations we clear customs for and what the client must supply.',
  },
  {
    question: 'What does the calculator include?',
    answer:
      'TODO(content): confirm exactly which legs and fees the published rate covers.',
  },
  {
    question: 'Can I track my car in real time?',
    answer:
      'TODO(content): describe how VIN tracking works and when statuses update.',
  },
]

export function HomePage() {
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
              Live VIN tracking on 12,000+ vehicles
            </span>
            <h1 className="text-primary-foreground text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Ship Cars From USA Worldwide
            </h1>
            <p className="text-primary-foreground/90 max-w-2xl text-lg">
              From the auction floor to your driveway. Transparent pricing,
              real-time tracking, and a team that moves your car like it&apos;s
              our own.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/tracking"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-card text-primary hover:bg-card/90 shadow-soft rounded-full px-6',
                )}
              >
                <Search className="size-4" />
                Track VIN
              </Link>
              <Link
                to="/calculator"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-primary-foreground/40 text-primary-foreground rounded-full bg-transparent px-6 hover:bg-white/10 hover:text-white',
                )}
              >
                <Calculator className="size-4" />
                Calculate Shipping
              </Link>
            </div>

            <dl className="grid max-w-lg grid-cols-3 gap-6 pt-8">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="text-primary-foreground block text-3xl font-bold tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-primary-foreground/80 text-sm">
                      {stat.label}
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
              ATTENTION DEALERS!
            </p>
            <h2 className="text-primary-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              0$ — All Service Fees Free
            </h2>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {WAIVED_FEES.map((fee) => (
              <li
                key={fee.label}
                className="bg-primary-foreground/15 text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {fee.label}
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
        <Eyebrow>WHY CASPIAN GLOBAL LOGISTICS</Eyebrow>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((item) => (
            <Card
              key={item.title}
              className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
            >
              <CardHeader>
                <span className="bg-accent text-accent-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
                  <item.icon className="size-5" />
                </span>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {item.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 4. HOW IT WORKS */}
      <Section tinted>
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="Four simple steps to your driveway"
        />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
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
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {step.body}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. REVIEWS */}
      <Section>
        <SectionHeading eyebrow="REVIEWS" title="Trusted by importers worldwide" />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <Card
              key={review.author}
              className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
            >
              <CardContent className="space-y-4 pt-6">
                <Quote
                  className="text-primary size-6 opacity-40"
                  aria-hidden="true"
                />
                <blockquote className="text-foreground">
                  “{review.quote}”
                </blockquote>
                <footer className="text-muted-foreground text-sm">
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
        <SectionHeading eyebrow="FAQ" title="Questions, answered" centered />
        <Accordion className="mx-auto mt-10 max-w-3xl">
          {FAQ.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* 7. CONTACT */}
      <Section>
        <SectionHeading
          eyebrow="CONTACT"
          title="Get a quote in minutes"
          subtitle="Tell us about your shipment. Our team replies within one business hour."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Call us</h3>
            <ul className="mt-4 space-y-3">
              {PHONE_NUMBERS.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone}`}
                    className="text-foreground hover:text-primary transition-smooth flex items-center gap-3 text-lg font-medium tabular-nums"
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
