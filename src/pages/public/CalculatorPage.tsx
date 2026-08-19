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
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { matchesQuery, rankOptions } from '@/lib/search-match'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/** What both pickers hand around. `code` is empty for branch options. */
interface Option {
  value: string
  label: string
  code: string
}

/**
 * Matches against the visible label AND the underlying code, so "AL" finds
 * Alabama even though the label starts with "Alabama". Pure -- the same query
 * always yields the same list.
 */
function filterOption(item: Option, query: string): boolean {
  return matchesQuery([item.label, item.value, item.code], query)
}

export function CalculatorPage() {
  const { t } = useTranslation('calculator')
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [stateCode, setStateCode] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(null)

  // Only so the "nothing matches" line can quote what was typed.
  const [stateQuery, setStateQuery] = useState('')
  const [branchQuery, setBranchQuery] = useState('')

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

  /*
    Ranked by the CURRENT query before being handed to the combobox: Base UI
    filters the `items` array in place, preserving its order, so the best
    match comes first. The filter predicate itself (filterOption) is
    unchanged -- only the order of what it returns differs.
  */
  const stateItems: Option[] = useMemo(
    () =>
      rankOptions(
        states.map((s) => ({
          value: s.code,
          label: `${s.name} (${s.code})`,
          code: s.code,
        })),
        stateQuery,
      ),
    [states, stateQuery],
  )
  const branchItems: Option[] = useMemo(
    () =>
      rankOptions(
        branches.map((b) => ({ value: b.branch, label: b.branch, code: '' })),
        branchQuery,
      ),
    [branches, branchQuery],
  )

  const selectedStateItem =
    stateItems.find((item) => item.value === stateCode) ?? null
  const selectedBranchItem =
    branchItems.find((item) => item.value === branch) ?? null

  const handleStateChange = (next: Option | null) => {
    setStateCode(next?.value ?? null)
    // The previously chosen branch belongs to the old state, so clear it.
    setBranch(null)
  }

  const handleBranchChange = (next: Option | null) => {
    setBranch(next?.value ?? null)
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

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">{t('routeTitle')}</CardTitle>
            <CardDescription>{t('routeSubtitle')}</CardDescription>
          </CardHeader>

          {/* Roomier than the default: two fields with hints read better with air. */}
          <CardContent className="space-y-8">
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-2.5">
                <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide">
                  {t('stepOne')}
                </span>
                <Label htmlFor="state-select" className="text-base font-semibold">
                  {t('state')}
                </Label>
              </div>

              <Combobox
                items={stateItems}
                value={selectedStateItem}
                onValueChange={handleStateChange}
                onInputValueChange={setStateQuery}
                filter={filterOption}
              >
                <div className="relative">
                  <ComboboxInput
                    id="state-select"
                    className="h-11 md:h-8"
                    placeholder={t('selectState')}
                    disabled={states.length === 0}
                  />
                  <ComboboxTrigger aria-label={t('selectState')} />
                </div>
                <ComboboxContent>
                  <ComboboxEmpty>
                    {t('noMatch', { query: stateQuery })}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(item: Option) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              <p className="text-muted-foreground text-sm">
                {t('searchStateHint')}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-baseline gap-2.5">
                <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide">
                  {t('stepTwo')}
                </span>
                <Label htmlFor="branch-select" className="text-base font-semibold">
                  {t('branch')}
                </Label>
              </div>

              <Combobox
                items={branchItems}
                value={selectedBranchItem}
                onValueChange={handleBranchChange}
                onInputValueChange={setBranchQuery}
                filter={filterOption}
              >
                <div className="relative">
                  <ComboboxInput
                    id="branch-select"
                    className="h-11 md:h-8"
                    placeholder={
                      stateCode ? t('selectBranch') : t('selectStateFirst')
                    }
                    disabled={!stateCode || branches.length === 0}
                  />
                  <ComboboxTrigger aria-label={t('selectBranch')} />
                </div>
                <ComboboxContent>
                  <ComboboxEmpty>
                    {t('noMatch', { query: branchQuery })}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(item: Option) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              <p className="text-muted-foreground text-sm">
                {stateCode && branches.length === 0
                  ? t('noBranches')
                  : t('searchBranchHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/*
          The result panel is deliberately a different surface from the input
          card -- tinted background, heavier ring -- so it reads as an answer
          rather than another field. Tokens only, no new colours.
        */}
        <Card className="bg-gradient-subtle border-border/60 ring-primary/15 shadow-soft h-fit ring-2">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold tracking-widest uppercase">
              {t('totalTitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* The stored rate IS the final price. Never apply a markup here. */}
            <p className="text-primary text-5xl leading-none font-bold tabular-nums">
              {selectedBranch ? formatCurrency(selectedBranch.rate) : '—'}
            </p>

            {selectedBranch ? (
              <div className="border-border/60 space-y-1 border-t pt-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  {t('routeSummary')}
                </p>
                <p className="text-foreground font-medium">
                  {selectedBranch.branch}
                  {stateCode ? `, ${stateCode}` : ''}
                </p>
                <p className="text-muted-foreground pt-2 text-sm">
                  {t('totalFinal')}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground border-border/60 border-t pt-4 text-sm">
                {t('totalPrompt')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Section>
  )
}
