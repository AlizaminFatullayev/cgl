import { useTranslation } from 'react-i18next'
import { FileText, Gavel, Package, ShieldCheck, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Section, SectionHeading } from '@/components/Section'

/** Keys index into the `services` namespace. */
const SERVICES = [
  { icon: Gavel, key: 'bidding' },
  { icon: Truck, key: 'trucking' },
  { icon: Package, key: 'loading' },
  { icon: ShieldCheck, key: 'insurance' },
  { icon: FileText, key: 'customs' },
] as const

export function ServicesPage() {
  const { t } = useTranslation('services')

  return (
    <Section>
      <SectionHeading
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Card
            key={service.key}
            className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
          >
            <CardHeader>
              <span className="bg-accent text-accent-foreground mb-1 flex size-10 items-center justify-center rounded-xl">
                <service.icon className="size-5" />
              </span>
              <CardTitle className="text-base">
                {t(`${service.key}Title`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {t(`${service.key}Body`)}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
