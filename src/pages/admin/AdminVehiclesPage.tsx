import { useCallback, useEffect, useMemo, useState } from 'react'
import { Images, Loader2, Pencil, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callRpc } from '@/lib/admin-rpc'
import { updateRowById } from '@/lib/admin-writes'
import { VehicleGallery } from '@/components/VehicleGallery'
import { displayText, formatCurrency, vehicleTitle } from '@/lib/format'
import {
  VEHICLE_LOCATIONS,
  VEHICLE_STATUSES,
  type AdminCustomer,
  type PhotoCategory,
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
/** Select cannot hold null, so "no location set" needs a sentinel value. */
const NO_LOCATION = '__none__'

/*
  The vehicle file, as one declarative list.

  Grouped to match the three cards the customer sees on My Cars, in the same
  order, so a member of staff filling this in and a customer reading it are
  looking at the same document. Adding a column here is a one-line change in the
  group it belongs to -- there is no second place to update.

  Money is kept apart from text because it needs validating, and dates because
  <input type="date"> speaks exactly the YYYY-MM-DD that a Postgres `date`
  column returns, so both directions are a straight assignment.
*/
const TEXT_FIELDS = [
  'container_number',
  'booking_number',
  'receiver',
  'shipping_line',
  'auction_house',
  'auction_state',
  'auction_city',
  'loading_port',
  'carrier',
  'terminal',
  'notes',
] as const

const DATE_FIELDS = [
  'auction_date',
  'expected_opening_date',
  'auction_pickup_date',
  'warehouse_delivery_date',
  'departure_date',
  'entry_date',
  'open_date',
  'release_date',
] as const

/** NOT NULL columns fall back to 0; final_price is nullable and stays null. */
const MONEY_FIELDS = [
  'total_amount',
  'paid',
  'auction_penalty',
  'final_price',
] as const

const NULLABLE_MONEY = new Set<string>(['final_price'])

type EditableKey =
  | (typeof TEXT_FIELDS)[number]
  | (typeof DATE_FIELDS)[number]
  | (typeof MONEY_FIELDS)[number]
  | 'location'

type EditableFields = Record<EditableKey, string>

type FieldKind = 'text' | 'date' | 'money' | 'location' | 'notes'

interface FieldSpec {
  key: EditableKey
  label: string
  kind: FieldKind
}

const FIELD_GROUPS: { heading: string; fields: FieldSpec[] }[] = [
  {
    heading: 'Car information',
    fields: [
      { key: 'total_amount', label: 'Total amount (USD)', kind: 'money' },
      { key: 'paid', label: 'Paid (USD)', kind: 'money' },
      { key: 'final_price', label: 'Final price (USD)', kind: 'money' },
      { key: 'auction_penalty', label: 'Auction penalty (USD)', kind: 'money' },
    ],
  },
  {
    heading: 'Auction information',
    fields: [
      { key: 'auction_date', label: 'Auction date', kind: 'date' },
      { key: 'auction_house', label: 'Auction (IAAI, Copart…)', kind: 'text' },
      { key: 'auction_state', label: 'State', kind: 'text' },
      { key: 'auction_city', label: 'City', kind: 'text' },
    ],
  },
  {
    heading: 'Transportation information',
    fields: [
      { key: 'loading_port', label: 'Loading port', kind: 'text' },
      { key: 'carrier', label: 'Carrier', kind: 'text' },
      { key: 'auction_pickup_date', label: 'Auction pickup date', kind: 'date' },
      {
        key: 'warehouse_delivery_date',
        label: 'Warehouse delivery date',
        kind: 'date',
      },
      { key: 'departure_date', label: 'Departure date', kind: 'date' },
      { key: 'entry_date', label: 'Entry date', kind: 'date' },
      { key: 'container_number', label: 'Container number', kind: 'text' },
      { key: 'open_date', label: 'Open date', kind: 'date' },
      { key: 'shipping_line', label: 'Sea line', kind: 'text' },
      { key: 'terminal', label: 'Terminal', kind: 'text' },
      { key: 'release_date', label: 'Release date', kind: 'date' },
      { key: 'booking_number', label: 'Booking number', kind: 'text' },
      { key: 'receiver', label: 'Receiver', kind: 'text' },
    ],
  },
  {
    heading: 'Location and opening',
    fields: [
      { key: 'location', label: 'Location', kind: 'location' },
      {
        key: 'expected_opening_date',
        label: 'Expected opening date',
        kind: 'date',
      },
      { key: 'notes', label: 'Notes', kind: 'notes' },
    ],
  },
]

function toEditable(vehicle: Vehicle): EditableFields {
  const fields = {} as EditableFields

  for (const key of TEXT_FIELDS) fields[key] = vehicle[key] ?? ''
  for (const key of DATE_FIELDS) fields[key] = vehicle[key] ?? ''
  for (const key of MONEY_FIELDS) {
    const value = vehicle[key]
    fields[key] = value === null || value === undefined ? '' : String(value)
  }
  fields.location = vehicle.location ?? NO_LOCATION

  return fields
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
  /*
    Whole rows, not just paths: the gallery groups by category and lets staff
    re-file a photo. Signing stays VehicleGallery's job, through the one shared
    hook -- so a thumbnail and its full-size view are the same signed URL rather
    than two with separate expiry clocks.
  */
  const [photoRows, setPhotoRows] = useState<VehiclePhoto[] | null>(null)
  const [savingPhotoId, setSavingPhotoId] = useState<string | null>(null)

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

    const patch: Record<string, unknown> = {}

    for (const key of TEXT_FIELDS) patch[key] = nullIfBlank(editFields[key])
    // A blank date is a real "not known yet", so it clears the column.
    for (const key of DATE_FIELDS) patch[key] = nullIfBlank(editFields[key])

    for (const key of MONEY_FIELDS) {
      const raw = editFields[key].trim()
      if (raw !== '' && (Number.isNaN(Number(raw)) || Number(raw) < 0)) {
        const label = FIELD_GROUPS.flatMap((group) => group.fields).find(
          (field) => field.key === key,
        )?.label
        setEditError(`${label ?? key} must be a non-negative number.`)
        return
      }
      /*
        Sent as a STRING so Postgres parses it straight into numeric instead of
        round-tripping through a JS float. Blank means zero on the NOT NULL
        columns and null on final_price, which is genuinely optional.
      */
      patch[key] = raw === '' ? (NULLABLE_MONEY.has(key) ? null : '0') : raw
    }

    patch.location =
      editFields.location === NO_LOCATION ? null : editFields.location

    setEditSaving(true)
    const { data, error: updateError } = await updateRowById<Vehicle>(
      'vehicles',
      editing.id,
      patch,
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
    setPhotoRows(null)

    const { data, error: photoError } = await supabase
      .from('vehicle_photos')
      .select('id, vehicle_id, url, created_at, category')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: true })
      .returns<VehiclePhoto[]>()

    setPhotoRows(photoError ? [] : (data ?? []))
  }

  /**
   * Files a photo under a different gallery column.
   *
   * vehicle_photos UPDATE is admin-only in RLS, so this is the only surface in
   * the app that can write the column. The row is updated optimistically only
   * AFTER the database confirms it, from the row the database sent back.
   */
  const changeCategory = async (photoId: string, category: PhotoCategory) => {
    setWriteError(null)
    setSavingPhotoId(photoId)

    const { data, error: updateError } = await updateRowById<VehiclePhoto>(
      'vehicle_photos',
      photoId,
      { category },
    )

    setSavingPhotoId(null)

    if (updateError || !data) {
      setWriteError(updateError ?? 'The photo category was not changed.')
      return
    }

    setPhotoRows((current) =>
      current === null
        ? current
        : current.map((row) => (row.id === data.id ? data : row)),
    )
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
  /*
    Stored English values, never a translated label -- vehicles_location_check
    constrains the column to exactly these strings.
  */
  const locationItems = [
    { value: NO_LOCATION, label: 'Not set' },
    ...VEHICLE_LOCATIONS.map((value) => ({ value, label: value })),
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>

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

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
            <Table>
              <TableHeader className="bg-secondary/50">
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
                          className="rounded-lg hover:bg-accent"
                          aria-label="View photos"
                          onClick={() => void openPhotos(vehicle)}
                        >
                          <Images className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg hover:bg-accent"
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
            <div className="space-y-6">
              {FIELD_GROUPS.map((group) => (
                <section key={group.heading} className="space-y-3">
                  <h3 className="border-primary text-primary border-b-2 pb-1.5 text-sm font-semibold">
                    {group.heading}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.fields.map((field) => {
                      const value = editFields[field.key]
                      const set = (next: string) =>
                        setEditFields({ ...editFields, [field.key]: next })

                      if (field.kind === 'notes') {
                        return (
                          <div
                            key={field.key}
                            className="space-y-2 sm:col-span-2"
                          >
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Textarea
                              id={field.key}
                              rows={4}
                              value={value}
                              onChange={(event) => set(event.target.value)}
                            />
                          </div>
                        )
                      }

                      if (field.kind === 'location') {
                        return (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            <Select
                              items={locationItems}
                              value={value}
                              onValueChange={(next) => next && set(next)}
                            >
                              <SelectTrigger id={field.key} className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {locationItems.map((item) => (
                                  <SelectItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      }

                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <Input
                            id={field.key}
                            type={field.kind === 'date' ? 'date' : 'text'}
                            inputMode={
                              field.kind === 'money' ? 'decimal' : undefined
                            }
                            value={value}
                            onChange={(event) => set(event.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

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
            setPhotoRows(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {photoVehicle ? vehicleTitle(photoVehicle) : 'Photos'}
            </DialogTitle>
            <DialogDescription>
              Photos uploaded by the customer. Use the picker under a photo to
              move it into another gallery column.
            </DialogDescription>
          </DialogHeader>

          {photoRows === null ? (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
              <span className="text-muted-foreground">Loading photos…</span>
            </div>
          ) : (
            // Every thumbnail opens the full-screen viewer at that photo.
            <VehicleGallery
              photos={photoRows}
              title={photoVehicle ? vehicleTitle(photoVehicle) : 'Vehicle'}
              onCategoryChange={(photoId, category) =>
                void changeCategory(photoId, category)
              }
              savingPhotoId={savingPhotoId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
