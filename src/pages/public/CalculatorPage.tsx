import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  deriveBranches,
  deriveStates,
  fetchShippingRates,
} from '@/lib/shipping-rates'
import type { ShippingRate } from '@/types/database'
import { formatCurrency } from '@/lib/format'
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
      <div className="flex items-center gap-2 py-16">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground">Loading rates…</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Shipping calculator
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Choose the auction state and branch to see the transportation total.
          Rates are read from our published rate table.
        </p>
      </header>

      {loadError && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Could not load rates: {loadError}</span>
        </div>
      )}

      {!loadError && states.length === 0 && (
        <div
          role="alert"
          className="text-muted-foreground flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            No shipping rates are available yet. The rate table has not been
            populated.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Route</CardTitle>
            <CardDescription>
              Step 1: pick a state. Step 2: pick the auction branch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="state-select">State</Label>
              <Select
                items={stateItems}
                value={stateCode}
                onValueChange={handleStateChange}
              >
                <SelectTrigger
                  id="state-select"
                  className="w-full"
                  disabled={states.length === 0}
                >
                  <SelectValue placeholder="Select a state" />
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
              <Label htmlFor="branch-select">Branch</Label>
              <Select
                items={branchItems}
                value={branch}
                onValueChange={setBranch}
              >
                <SelectTrigger
                  id="branch-select"
                  className="w-full"
                  disabled={!stateCode || branches.length === 0}
                >
                  <SelectValue
                    placeholder={
                      stateCode ? 'Select a branch' : 'Select a state first'
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
                  No branches with a published rate in this state.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Transportation total</CardTitle>
            <CardDescription>
              {selectedBranch
                ? 'Final price — no extra fees are added.'
                : 'Pick a state and branch to see the price.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* The stored rate IS the final price. Never apply a markup here. */}
            <p className="text-3xl font-semibold tabular-nums">
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
  )
}
