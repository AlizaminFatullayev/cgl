import { useCallback, useEffect, useMemo, useState } from 'react'
import { Images, Loader2, Pencil, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callRpc } from '@/lib/admin-rpc'
import { updateRowById } from '@/lib/admin-writes'
import { signPhotoUrl } from '@/lib/storage'
import { displayText, formatCurrency, vehicleTitle } from '@/lib/format'
import {
  VEHICLE_STATUSES,
  type AdminCustomer,
  type Vehicle,
  type VehiclePhoto,
  type VehicleStatus,
} from '@/types/database'
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

const ANY = '__any__'

/** Editable shipping fields. status is handled separately, inline. */
interface EditableFields {
  container_number: string
  booking_number: string
  receiver: string
  shipping_line: string
  notes: string
  total_amount: string
  paid: string
}

function toEditable(vehicle: Vehicle): EditableFields {
  return {
    container_number: vehicle.container_number ?? '',
    booking_number: vehicle.booking_number ?? '',
    receiver: vehicle.receiver ?? '',
    shipping_line: vehicle.shipping_line ?? '',
    notes: vehicle.notes ?? '',
    total_amount: vehicle.total_amount === null ? '' : String(vehicle.total_amount),
    paid: vehicle.paid === null ? '' : String(vehicle.paid),
  }
}

function nullIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string | null>(ANY)
  const [customerFilter, setCustomerFilter] = useState<string | null>(ANY)
  const [search, setSearch] = useState('')

  const [savingId, setSavingId] = useState<string | null>(null)

  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [editFields, setEditFields] = useState<EditableFields | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [photoVehicle, setPhotoVehicle] = useState<Vehicle | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [vehicleRes, customerRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Vehicle[]>(),
      callRpc<AdminCustomer[]>('admin_list_customers'),
    ])

    if (vehicleRes.error) {
      setError(vehicleRes.error.message)
      setLoading(false)
      return
    }
    if (customerRes.error) {
      setError(customerRes.error)
      setLoading(false)
      return
    }

    setVehicles(vehicleRes.data ?? [])
    setCustomers(customerRes.data ?? [])
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

  const customerLabel = useCallback(
    (userId: string | null) => {
      if (!userId) return '—'
      const customer = customerById.get(userId)
      if (!customer) return 'Unknown customer'
      return displayText(customer.full_name, customer.email ?? 'Unnamed')
    },
    [customerById],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      if (statusFilter && statusFilter !== ANY && vehicle.status !== statusFilter) {
        return false
      }
      if (
        customerFilter &&
        customerFilter !== ANY &&
        vehicle.user_id !== customerFilter
      ) {
        return false
      }
      if (term === '') return true
      const haystack = [
        vehicle.vin,
        vehicle.lot_number,
        vehicle.make,
        vehicle.model,
        `${vehicle.make ?? ''} ${vehicle.model ?? ''}`,
      ]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [vehicles, statusFilter, customerFilter, search])

  /** The one place in the whole app where status is written. */
  const changeStatus = async (vehicle: Vehicle, next: string | null) => {
    if (!next || next === vehicle.status) return
    setWriteError(null)
    setSavingId(vehicle.id)

    const { data, error: updateError } = await updateRowById<Vehicle>(
      'vehicles',
      vehicle.id,
      { status: next },
    )

    setSavingId(null)

    if (updateError || !data) {
      setWriteError(updateError ?? 'Status was not changed.')
      return
    }
    // Confirmed from the row the database sent back, not from the input.
    setVehicles((current) =>
      current.map((row) => (row.id === data.id ? data : row)),
    )
  }

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle)
    setEditFields(toEditable(vehicle))
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editing || !editFields) return
    setEditError(null)

    const totalRaw = editFields.total_amount.trim()
    const paidRaw = editFields.paid.trim()
    if (totalRaw !== '' && (Number.isNaN(Number(totalRaw)) || Number(totalRaw) < 0)) {
      setEditError('Total amount must be a non-negative number.')
      return
    }
    if (paidRaw !== '' && (Number.isNaN(Number(paidRaw)) || Number(paidRaw) < 0)) {
      setEditError('Paid must be a non-negative number.')
      return
    }

    setEditSaving(true)
    const { data, error: updateError } = await updateRowById<Vehicle>(
      'vehicles',
      editing.id,
      {
        container_number: nullIfBlank(editFields.container_number),
        booking_number: nullIfBlank(editFields.booking_number),
        receiver: nullIfBlank(editFields.receiver),
        shipping_line: nullIfBlank(editFields.shipping_line),
        notes: nullIfBlank(editFields.notes),
        // Sent as strings so Postgres parses them straight into numeric
        // instead of round-tripping through a JS float.
        total_amount: totalRaw === '' ? 0 : totalRaw,
        paid: paidRaw === '' ? 0 : paidRaw,
      },
    )
    setEditSaving(false)

    if (updateError || !data) {
      setEditError(updateError ?? 'The vehicle was not updated.')
      return
    }

    setVehicles((current) =>
      current.map((row) => (row.id === data.id ? data : row)),
    )
    setEditing(null)
    setEditFields(null)
  }

  const openPhotos = async (vehicle: Vehicle) => {
    setPhotoVehicle(vehicle)
    setPhotoUrls(null)

    const { data, error: photoError } = await supabase
      .from('vehicle_photos')
      .select('id, vehicle_id, url, created_at')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: true })
      .returns<VehiclePhoto[]>()

    if (photoError) {
      setPhotoUrls([])
      return
    }

    const signed = await Promise.all(
      (data ?? []).map((photo) => signPhotoUrl(photo.url)),
    )
    setPhotoUrls(signed.filter((url): url is string => url !== null))
  }

  const statusItems = [
    { value: ANY, label: 'All statuses' },
    ...VEHICLE_STATUSES.map((s) => ({ value: s, label: s })),
  ]
  const customerItems = [
    { value: ANY, label: 'All customers' },
    ...customers.map((c) => ({
      value: c.id,
      label: displayText(c.full_name, c.email ?? 'Unnamed'),
    })),
  ]
  const rowStatusItems = VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="search"
              className="pl-8"
              placeholder="VIN, lot number, make or model"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            items={statusItems}
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="All statuses" />
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
          <Label htmlFor="customer-filter">Customer</Label>
          <Select
            items={customerItems}
            value={customerFilter}
            onValueChange={setCustomerFilter}
          >
            <SelectTrigger id="customer-filter" className="w-full">
              <SelectValue placeholder="All customers" />
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
      </div>

      {writeError && <AdminError message={writeError} />}
      {error && <AdminError message={`Could not load vehicles: ${error}`} />}

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading vehicles…</span>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {filtered.length} of {vehicles.length} vehicles
          </p>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground py-10 text-center"
                    >
                      No vehicles match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicleTitle(vehicle)}
                      </TableCell>
                      <TableCell>{customerLabel(vehicle.user_id)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {displayText(vehicle.vin)}
                      </TableCell>
                      <TableCell>{displayText(vehicle.lot_number)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(vehicle.total_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(vehicle.paid)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            items={rowStatusItems}
                            value={vehicle.status}
                            onValueChange={(next) =>
                              void changeStatus(vehicle, next as VehicleStatus)
                            }
                          >
                            <SelectTrigger size="sm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rowStatusItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {savingId === vehicle.id && (
                            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View photos"
                          onClick={() => void openPhotos(vehicle)}
                        >
                          <Images className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit vehicle"
                          onClick={() => openEdit(vehicle)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Edit shipping fields */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setEditFields(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? vehicleTitle(editing) : 'Edit vehicle'}
            </DialogTitle>
            <DialogDescription>
              Shipping details and amounts. Status is changed from the table.
            </DialogDescription>
          </DialogHeader>

          {editFields && (
            <div className="space-y-4">
              {(
                [
                  ['container_number', 'Container number'],
                  ['booking_number', 'Booking number'],
                  ['receiver', 'Receiver'],
                  ['shipping_line', 'Shipping line'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    value={editFields[field]}
                    onChange={(event) =>
                      setEditFields({
                        ...editFields,
                        [field]: event.target.value,
                      })
                    }
                  />
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total amount (USD)</Label>
                  <Input
                    id="total_amount"
                    inputMode="decimal"
                    value={editFields.total_amount}
                    onChange={(event) =>
                      setEditFields({
                        ...editFields,
                        total_amount: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid">Paid (USD)</Label>
                  <Input
                    id="paid"
                    inputMode="decimal"
                    value={editFields.paid}
                    onChange={(event) =>
                      setEditFields({ ...editFields, paid: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={editFields.notes}
                  onChange={(event) =>
                    setEditFields({ ...editFields, notes: event.target.value })
                  }
                />
              </div>

              {editError && <AdminError message={editError} />}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null)
                setEditFields(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={editSaving}>
              {editSaving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photos */}
      <Dialog
        open={photoVehicle !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPhotoVehicle(null)
            setPhotoUrls(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {photoVehicle ? vehicleTitle(photoVehicle) : 'Photos'}
            </DialogTitle>
            <DialogDescription>
              Photos uploaded by the customer.
            </DialogDescription>
          </DialogHeader>

          {photoUrls === null ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
              <span className="text-muted-foreground">Loading photos…</span>
            </div>
          ) : photoUrls.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No photos for this vehicle.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {photoUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full rounded-md border object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
