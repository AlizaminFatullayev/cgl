import { FileText, Gavel, Package, ShieldCheck, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Section, SectionHeading } from '@/components/Section'

const SERVICES = [
  {
    icon: Gavel,
    title: 'Auction Bidding',
    body: 'Copart and IAAI — we bid live or accept your won lot.',
  },
  {
    icon: Truck,
    title: 'Inland Trucking',
    body: 'Yard pickup to loading port within 5–7 days nationwide.',
  },
  {
    icon: Package,
    title: 'Port Loading',
    body: 'Container, RoRo, or consolidated loading at major US ports.',
  },
  {
    icon: ShieldCheck,
    title: 'Cargo Insurance',
    body: 'FREE all-risk coverage from yard to port — 0%, no extra fees.',
  },
  {
    icon: FileText,
    title: 'Customs & Docs',
    body: 'Title work, bill of lading, and destination customs support.',
  },
]

export function ServicesPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="SERVICES"
        title="Everything you need to import a car"
        subtitle="From the auction floor to your front door, Caspian Global Logistics covers every leg of the journey."
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Card
            key={service.title}
            className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
          >
            <CardHeader>
              <span className="bg-accent text-accent-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
                <service.icon className="size-5" />
              </span>
              <CardTitle className="text-base">{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {service.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
