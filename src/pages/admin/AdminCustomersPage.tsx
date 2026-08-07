import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Search, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callRpc } from '@/lib/admin-rpc'
import {
  displayText,
  formatCurrency,
  formatDate,
  vehicleTitle,
} from '@/lib/format'
import type { AdminCustomer, Transaction, Vehicle } from '@/types/database'
import { AdminError } from '@/components/AdminError'
import { VehicleStatusBadge } from '@/components/VehicleStatusBadge'
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
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<AdminCustomer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [adjustFor, setAdjustFor] = useState<AdminCustomer | null>(null)
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [adjusting, setAdjusting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } =
      await callRpc<AdminCustomer[]>('admin_list_customers')
    if (rpcError) {
      setError(rpcError)
      setCustomers([])
    } else {
      setCustomers(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (term === '') return customers
    return customers.filter((customer) =>
      [customer.full_name, customer.email]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [customers, search])

  const openCustomer = async (customer: AdminCustomer) => {
    setSelected(customer)
    setVehicles(null)
    setTransactions(null)
    setDetailError(null)

    const [vehicleRes, txRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
        .returns<Vehicle[]>(),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
        .returns<Transaction[]>(),
    ])

    if (vehicleRes.error || txRes.error) {
      setDetailError(vehicleRes.error?.message ?? txRes.error?.message ?? null)
    }
    setVehicles(vehicleRes.data ?? [])
    setTransactions(txRes.data ?? [])
  }

  /**
   * Money moves only through adjust_balance(), which writes the transactions
   * row and the balance in one transaction. There is deliberately no code
   * path here that updates profiles.balance directly.
   */
  const submitAdjustment = async () => {
    if (!adjustFor) return
    setAdjustError(null)

    const raw = delta.trim()
    if (raw === '' || Number.isNaN(Number(raw)) || Number(raw) === 0) {
      setAdjustError('Enter a non-zero amount. Use a minus sign to debit.')
      return
    }

    setAdjusting(true)
    const { data, error: rpcError } = await callRpc<number | string>(
      'adjust_balance',
      {
        target_user: adjustFor.id,
        // Sent as a string so Postgres parses it as numeric directly.
        delta: raw,
        note: note.trim() === '' ? null : note.trim(),
      },
    )
    setAdjusting(false)

    if (rpcError) {
      setAdjustError(rpcError)
      return
    }
    if (data === null || data === undefined) {
      setAdjustError(
        'The balance was not changed — the database returned no new balance.',
      )
      return
    }

    // Trust the balance the function returned, not the number we sent.
    const newBalance = data as number | string
    setCustomers((current) =>
      current.map((row) =>
        row.id === adjustFor.id ? { ...row, balance: newBalance } : row,
      ),
    )
    if (selected?.id === adjustFor.id) {
      setSelected({ ...selected, balance: newBalance })
      void openCustomer({ ...adjustFor, balance: newBalance })
    }

    setAdjustFor(null)
    setDelta('')
    setNote('')
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          <ArrowLeft className="size-4" />
          All customers
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {displayText(selected.full_name, 'Unnamed customer')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {displayText(selected.email)}
            </p>
          </div>
          <Button onClick={() => setAdjustFor(selected)}>
            <Wallet className="size-4" />
            Adjust balance
          </Button>
        </div>

        {detailError && <AdminError message={detailError} />}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Balance</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatCurrency(selected.balance)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Vehicles</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {vehicles?.length ?? '—'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Joined</CardDescription>
              <CardTitle className="text-lg">
                {formatDate(selected.created_at)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Vehicles</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles === null ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No vehicles.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicleTitle(vehicle)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {displayText(vehicle.vin)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(vehicle.total_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(vehicle.paid)}
                      </TableCell>
                      <TableCell>
                        <VehicleStatusBadge status={vehicle.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Transaction history
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions === null ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No transactions.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.created_at)}</TableCell>
                      <TableCell>{displayText(tx.type)}</TableCell>
                      <TableCell>{displayText(tx.note)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {renderAdjustDialog()}
      </div>
    )
  }

  function renderAdjustDialog() {
    return (
      <Dialog
        open={adjustFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustFor(null)
            setDelta('')
            setNote('')
            setAdjustError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust balance</DialogTitle>
            <DialogDescription>
              {adjustFor
                ? `${displayText(adjustFor.full_name, 'Unnamed customer')} — current balance ${formatCurrency(adjustFor.balance)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delta">Amount</Label>
              <Input
                id="delta"
                inputMode="decimal"
                placeholder="250 to credit, -250 to debit"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
              />
              <p className="text-muted-foreground text-sm">
                Positive credits the customer, negative debits them.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                placeholder="Wire received, invoice #12…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {adjustError && <AdminError message={adjustError} />}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustFor(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitAdjustment()} disabled={adjusting}>
              {adjusting && <Loader2 className="size-4 animate-spin" />}
              Apply adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>

      <div className="space-y-2 sm:max-w-sm">
        <Label htmlFor="customer-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="customer-search"
            className="pl-8"
            placeholder="Name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && <AdminError message={`Could not load customers: ${error}`} />}

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading customers…</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Vehicles</TableHead>
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
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {displayText(customer.full_name, 'Unnamed')}
                    </TableCell>
                    <TableCell>{displayText(customer.email)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(customer.balance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {customer.vehicle_count}
                    </TableCell>
                    <TableCell className="space-x-1 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openCustomer(customer)}
                      >
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdjustFor(customer)}
                      >
                        <Wallet className="size-4" />
                        Balance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {renderAdjustDialog()}
    </div>
  )
}
