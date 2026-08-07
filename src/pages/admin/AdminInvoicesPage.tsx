import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callRpc } from '@/lib/admin-rpc'
import { insertRow, updateRowById } from '@/lib/admin-writes'
import {
  displayText,
  formatCurrency,
  formatDate,
  vehicleTitle,
} from '@/lib/format'
import type { AdminCustomer, Invoice, Vehicle } from '@/types/database'
import { AdminError } from '@/components/AdminError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const INVOICE_STATUSES = ['unpaid', 'partial', 'paid', 'cancelled'] as const
const NO_VEHICLE = '__none__'

export function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [formUser, setFormUser] = useState<string | null>(null)
  const [formVehicle, setFormVehicle] = useState<string | null>(NO_VEHICLE)
  const [formAmount, setFormAmount] = useState('')
  const [formStatus, setFormStatus] = useState<string | null>('unpaid')
  const [formNote, setFormNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [invoiceRes, customerRes, vehicleRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Invoice[]>(),
      callRpc<AdminCustomer[]>('admin_list_customers'),
      supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Vehicle[]>(),
    ])

    const firstError =
      invoiceRes.error?.message ??
      customerRes.error ??
      vehicleRes.error?.message ??
      null

    if (firstError) {
      setError(firstError)
      setLoading(false)
      return
    }

    setInvoices(invoiceRes.data ?? [])
    setCustomers(customerRes.data ?? [])
    setVehicles(vehicleRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const customerById = useMemo(() => {
    const map = new Map<string, AdminCustomer>()
    for (const customer of customers) map.set(customer.id, customer)
    return map
  }, [customers])

  const vehicleById = useMemo(() => {
    const map = new Map<string, Vehicle>()
    for (const vehicle of vehicles) map.set(vehicle.id, vehicle)
    return map
  }, [vehicles])

  const vehiclesForCustomer = useMemo(() => {
    if (!formUser) return []
    return vehicles.filter((vehicle) => vehicle.user_id === formUser)
  }, [vehicles, formUser])

  const changeStatus = async (invoice: Invoice, next: string | null) => {
    if (!next || next === invoice.status) return
    setWriteError(null)
    setSavingId(invoice.id)

    const { data, error: updateError } = await updateRowById<Invoice>(
      'invoices',
      invoice.id,
      { status: next },
    )
    setSavingId(null)

    if (updateError || !data) {
      setWriteError(updateError ?? 'The invoice status was not changed.')
      return
    }
    setInvoices((current) =>
      current.map((row) => (row.id === data.id ? data : row)),
    )
  }

  const createInvoice = async () => {
    setFormError(null)

    if (!formUser) {
      setFormError('Choose a customer.')
      return
    }
    const raw = formAmount.trim()
    if (raw === '' || Number.isNaN(Number(raw)) || Number(raw) <= 0) {
      setFormError('Enter an amount greater than zero.')
      return
    }

    setFormSaving(true)
    const { data, error: insertError } = await insertRow<Invoice>('invoices', {
      user_id: formUser,
      vehicle_id:
        formVehicle && formVehicle !== NO_VEHICLE ? formVehicle : null,
      // String, so Postgres parses it straight into numeric.
      amount: raw,
      status: formStatus ?? 'unpaid',
      note: formNote.trim() === '' ? null : formNote.trim(),
    })
    setFormSaving(false)

    if (insertError || !data) {
      setFormError(insertError ?? 'The invoice was not created.')
      return
    }

    setInvoices((current) => [data, ...current])
    setCreating(false)
    setFormUser(null)
    setFormVehicle(NO_VEHICLE)
    setFormAmount('')
    setFormStatus('unpaid')
    setFormNote('')
  }

  const customerItems = customers.map((c) => ({
    value: c.id,
    label: displayText(c.full_name, c.email ?? 'Unnamed'),
  }))
  const vehicleItems = [
    { value: NO_VEHICLE, label: 'No vehicle' },
    ...vehiclesForCustomer.map((v) => ({
      value: v.id,
      label: vehicleTitle(v),
    })),
  ]
  const statusItems = INVOICE_STATUSES.map((s) => ({ value: s, label: s }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Create invoice
        </Button>
      </div>

      {writeError && <AdminError message={writeError} />}
      {error && <AdminError message={`Could not load invoices: ${error}`} />}

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading invoices…</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-40">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-10 text-center"
                  >
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const customer = invoice.user_id
                    ? customerById.get(invoice.user_id)
                    : undefined
                  const vehicle = invoice.vehicle_id
                    ? vehicleById.get(invoice.vehicle_id)
                    : undefined
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        {customer
                          ? displayText(customer.full_name, customer.email ?? 'Unnamed')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {vehicle ? vehicleTitle(vehicle) : '—'}
                      </TableCell>
                      <TableCell>{displayText(invoice.note)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            items={statusItems}
                            value={invoice.status ?? 'unpaid'}
                            onValueChange={(next) =>
                              void changeStatus(invoice, next)
                            }
                          >
                            <SelectTrigger size="sm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {savingId === invoice.id && (
                            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setFormError(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              Bill a customer, optionally against one of their vehicles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-customer">Customer</Label>
              <Select
                items={customerItems}
                value={formUser}
                onValueChange={(next) => {
                  setFormUser(next)
                  // The old vehicle belonged to another customer.
                  setFormVehicle(NO_VEHICLE)
                }}
              >
                <SelectTrigger id="invoice-customer" className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-vehicle">Vehicle (optional)</Label>
              <Select
                items={vehicleItems}
                value={formVehicle}
                onValueChange={setFormVehicle}
              >
                <SelectTrigger
                  id="invoice-vehicle"
                  className="w-full"
                  disabled={!formUser}
                >
                  <SelectValue placeholder="No vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-amount">Amount (USD)</Label>
              <Input
                id="invoice-amount"
                inputMode="decimal"
                placeholder="1200.00"
                value={formAmount}
                onChange={(event) => setFormAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-status">Status</Label>
              <Select
                items={statusItems}
                value={formStatus}
                onValueChange={setFormStatus}
              >
                <SelectTrigger id="invoice-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-note">Note</Label>
              <Textarea
                id="invoice-note"
                rows={3}
                value={formNote}
                onChange={(event) => setFormNote(event.target.value)}
              />
            </div>

            {formError && <AdminError message={formError} />}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createInvoice()} disabled={formSaving}>
              {formSaving && <Loader2 className="size-4 animate-spin" />}
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
