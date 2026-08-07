import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { deleteRowById, insertRow, updateRowById } from '@/lib/admin-writes'
import { displayText, formatCurrency } from '@/lib/format'
import type { ShippingRate } from '@/types/database'
import { AdminError } from '@/components/AdminError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NewRate {
  state_code: string
  state_name: string
  branch: string
  rate: string
}

const EMPTY_NEW_RATE: NewRate = {
  state_code: '',
  state_name: '',
  branch: '',
  rate: '',
}

export function AdminRatesPage() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [newRate, setNewRate] = useState<NewRate>(EMPTY_NEW_RATE)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: loadError } = await supabase
      .from('shipping_rates')
      .select('id, state_code, state_name, branch, rate')
      .order('state_name', { ascending: true })
      .order('branch', { ascending: true })
      .returns<ShippingRate[]>()

    if (loadError) {
      setError(loadError.message)
      setRates([])
    } else {
      setRates(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (term === '') return rates
    return rates.filter((rate) =>
      [rate.state_code, rate.state_name, rate.branch]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [rates, search])

  const startEdit = (rate: ShippingRate) => {
    setWriteError(null)
    setEditingId(rate.id)
    setEditValue(rate.rate === null ? '' : String(rate.rate))
  }

  const saveEdit = async (rate: ShippingRate) => {
    const raw = editValue.trim()
    if (raw === '' || !/^\d+$/.test(raw)) {
      setWriteError('A rate must be a whole, non-negative number.')
      return
    }

    setWriteError(null)
    setSavingId(rate.id)
    // The stored value IS the final price -- no markup is applied anywhere.
    const { data, error: updateError } = await updateRowById<ShippingRate>(
      'shipping_rates',
      rate.id,
      { rate: Number(raw) },
    )
    setSavingId(null)

    if (updateError || !data) {
      setWriteError(updateError ?? 'The rate was not updated.')
      return
    }

    setRates((current) =>
      current.map((row) => (row.id === data.id ? data : row)),
    )
    setEditingId(null)
  }

  const addRate = async () => {
    setAddError(null)
    const code = newRate.state_code.trim().toUpperCase()
    const name = newRate.state_name.trim()
    const branch = newRate.branch.trim()
    const raw = newRate.rate.trim()

    if (code === '' || branch === '') {
      setAddError('State code and branch are required.')
      return
    }
    if (raw === '' || !/^\d+$/.test(raw)) {
      setAddError('A rate must be a whole, non-negative number.')
      return
    }

    setAddSaving(true)
    const { data, error: insertError } = await insertRow<ShippingRate>(
      'shipping_rates',
      {
        state_code: code,
        state_name: name === '' ? null : name,
        branch,
        rate: Number(raw),
      },
    )
    setAddSaving(false)

    if (insertError || !data) {
      setAddError(insertError ?? 'The branch was not created.')
      return
    }

    setRates((current) => [...current, data])
    setAdding(false)
    setNewRate(EMPTY_NEW_RATE)
  }

  const removeRate = async (rate: ShippingRate) => {
    setWriteError(null)
    setSavingId(rate.id)
    const { error: deleteError } = await deleteRowById('shipping_rates', rate.id)
    setSavingId(null)

    if (deleteError) {
      setWriteError(deleteError)
      return
    }
    setRates((current) => current.filter((row) => row.id !== rate.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Shipping rates</h1>
        <Button className="shadow-soft rounded-full px-6" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add branch
        </Button>
      </div>

      <div className="space-y-2 sm:max-w-sm">
        <Label htmlFor="rate-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="rate-search"
            className="pl-8"
            placeholder="State or branch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {writeError && <AdminError message={writeError} />}
      {error && <AdminError message={`Could not load rates: ${error}`} />}

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading rates…</span>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {filtered.length} of {rates.length} rows
          </p>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="w-40 text-right">Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-10 text-center"
                    >
                      No rates match this search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        {displayText(rate.state_name)}
                      </TableCell>
                      <TableCell>{displayText(rate.state_code)}</TableCell>
                      <TableCell>{displayText(rate.branch)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {editingId === rate.id ? (
                          <Input
                            value={editValue}
                            inputMode="numeric"
                            className="h-8 text-right"
                            autoFocus
                            onChange={(event) => setEditValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void saveEdit(rate)
                              if (event.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : (
                          formatCurrency(rate.rate)
                        )}
                      </TableCell>
                      <TableCell className="space-x-1 text-right whitespace-nowrap">
                        {savingId === rate.id ? (
                          <Loader2 className="text-muted-foreground inline size-4 animate-spin" />
                        ) : editingId === rate.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-lg hover:bg-accent"
                          aria-label="Save rate"
                              onClick={() => void saveEdit(rate)}
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-lg hover:bg-accent"
                          aria-label="Cancel"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full px-4"
                        onClick={() => startEdit(rate)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-lg hover:bg-accent"
                          aria-label={`Delete ${displayText(rate.branch)}`}
                              onClick={() => void removeRate(rate)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog
        open={adding}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false)
            setNewRate(EMPTY_NEW_RATE)
            setAddError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a branch</DialogTitle>
            <DialogDescription>
              The rate you enter is the final price shown to customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-state-code">State code</Label>
                <Input
                  id="new-state-code"
                  placeholder="CA"
                  value={newRate.state_code}
                  onChange={(event) =>
                    setNewRate({ ...newRate, state_code: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-state-name">State name</Label>
                <Input
                  id="new-state-name"
                  placeholder="California"
                  value={newRate.state_name}
                  onChange={(event) =>
                    setNewRate({ ...newRate, state_name: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-branch">Branch</Label>
              <Input
                id="new-branch"
                placeholder="Los Angeles"
                value={newRate.branch}
                onChange={(event) =>
                  setNewRate({ ...newRate, branch: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rate">Rate (USD)</Label>
              <Input
                id="new-rate"
                inputMode="numeric"
                placeholder="850"
                value={newRate.rate}
                onChange={(event) =>
                  setNewRate({ ...newRate, rate: event.target.value })
                }
              />
            </div>

            {addError && <AdminError message={addError} />}
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-full px-5" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button className="shadow-soft rounded-full px-6" onClick={() => void addRate()} disabled={addSaving}>
              {addSaving && <Loader2 className="size-4 animate-spin" />}
              Add branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
