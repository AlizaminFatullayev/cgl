import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  deriveBranches,
  deriveStates,
  fetchShippingRates,
} from '@/lib/shipping-rates'
import type { ShippingRate } from '@/types/database'
import { formatCurrency } from '@/lib/format'
import { Section } from '@/components/Section'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function CalculatorPage() {
  const { t } = useTranslation('calculator')
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [stateCode, setStateCode] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchShippingRates().then(({ rates: loaded, error }) => {
      if (!active) return
      setRates(loaded)
      setLoadError(error)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const states = useMemo(() => deriveStates(rates), [rates])
  const branches = useMemo(
    () => (stateCode ? deriveBranches(rates, stateCode) : []),
    [rates, stateCode],
  )

  const selectedBranch = branches.find((item) => item.branch === branch) ?? null

  const stateItems = useMemo(
    () => states.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` })),
    [states],
  )
  const branchItems = useMemo(
    () => branches.map((b) => ({ value: b.branch, label: b.branch })),
    [branches],
  )

  const handleStateChange = (next: string | null) => {
    setStateCode(next)
    // The previously chosen branch belongs to the old state, so clear it.
    setBranch(null)
  }

  if (loading) {
    return (
      <Section>
        <div className="flex items-center gap-2">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">{t('loadingRates')}</span>
        </div>
      </Section>
    )
  }

  return (
    <Section>
      <div className="space-y-8">
      <header className="max-w-2xl space-y-4">
        <span className="bg-accent text-accent-foreground inline-flex rounded-full px-4 py-2 text-sm font-medium">
          {t('eyebrow')}
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </header>

      {loadError && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{t('loadError', { error: loadError })}</span>
        </div>
      )}

      {!loadError && states.length === 0 && (
        <div
          role="alert"
          className="text-muted-foreground flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{t('noRates')}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>{t('routeTitle')}</CardTitle>
            <CardDescription>{t('routeSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="state-select">{t('state')}</Label>
              <Select
                items={stateItems}
                value={stateCode}
                onValueChange={handleStateChange}
              >
                <SelectTrigger
                  id="state-select"
                  /* 44px touch target on phones; the desktop height is unchanged. */
                  className="w-full data-[size=default]:h-11 md:data-[size=default]:h-8"
                  disabled={states.length === 0}
                >
                  <SelectValue placeholder={t('selectState')} />
                </SelectTrigger>
                <SelectContent>
                  {stateItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-select">{t('branch')}</Label>
              <Select
                items={branchItems}
                value={branch}
                onValueChange={setBranch}
              >
                <SelectTrigger
                  id="branch-select"
                  className="w-full data-[size=default]:h-11 md:data-[size=default]:h-8"
                  disabled={!stateCode || branches.length === 0}
                >
                  <SelectValue
                    placeholder={
                      stateCode ? t('selectBranch') : t('selectStateFirst')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branchItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stateCode && branches.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t('noBranches')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-border/60 shadow-soft h-fit">
          <CardHeader>
            <CardTitle>{t('totalTitle')}</CardTitle>
            <CardDescription>
              {selectedBranch ? t('totalFinal') : t('totalPrompt')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* The stored rate IS the final price. Never apply a markup here. */}
            <p className="text-primary text-4xl font-bold tabular-nums">
              {selectedBranch ? formatCurrency(selectedBranch.rate) : '—'}
            </p>
            {selectedBranch && (
              <p className="text-muted-foreground mt-2 text-sm">
                {selectedBranch.branch}
                {stateCode ? `, ${stateCode}` : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Section>
  )
}
