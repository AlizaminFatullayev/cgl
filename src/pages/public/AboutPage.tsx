import { useTranslation } from 'react-i18next'
import { Award, Globe, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Section, SectionHeading } from '@/components/Section'

/** Figures are brand constants; only the labels are translated. */
const STATS = [
  { icon: Globe, value: '60+', key: 'statPorts' },
  { icon: Users, value: '8K+', key: 'statClients' },
  { icon: Award, value: '12+', key: 'statYears' },
  { icon: TrendingUp, value: '98%', key: 'statOnTime' },
] as const

const PARAGRAPH_KEYS = ['p1', 'p2', 'p3', 'p4'] as const

export function AboutPage() {
  const { t } = useTranslation('about')

  return (
    <Section>
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('titleLead')}
          titleTail={t('titleTail')}
          className="max-w-3xl"
        />

        <div className="mt-8 space-y-5">
          {PARAGRAPH_KEYS.map((key) => (
            <p key={key} className="text-lg leading-relaxed">
              {t(key)}
            </p>
          ))}
        </div>

        <div className="border-border mt-10 border-t pt-6">
          <p className="text-muted-foreground">{t('sincerely')}</p>
          <p className="text-foreground text-lg font-semibold">
            {t('management')}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card
              key={stat.key}
              className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant"
            >
              <CardContent className="space-y-2 pt-6">
                <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
                  <stat.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="text-primary text-3xl font-bold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{t(stat.key)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}
