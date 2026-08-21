import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Images,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import type { Profile, Vehicle, VehiclePhoto } from '@/types/database'
import { VEHICLE_LOCATIONS } from '@/types/database'
import {
  carLabel,
  displayNumber,
  displayText,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  vehicleDebt,
} from '@/lib/format'
import { locationLabel } from '@/i18n/labels'
import { VehicleStatusBadge } from '@/components/VehicleStatusBadge'
import { VehicleDetailsCards } from '@/components/VehicleDetailsCards'
import { VehicleGallery } from '@/components/VehicleGallery'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * "My Cars" -- the customer's own file on every vehicle, at /invoices.
 *
 * Structure follows the reference system: a Location filter bar, one row per
 * vehicle, a Details disclosure that opens INLINE directly under its row, and a
 * gallery grouped into four fixed categories.
 *
 * RESPONSIVE. Above md this is a real table. Below md each vehicle becomes a
 * card showing ID, Car, Status and Debt, with the same Details panel inside it.
 * The alternative -- one horizontally scrolling eleven-column table on a phone
 * -- is unusable, and hiding columns would contradict the rule that every field
 * stays visible. Both layouts render from the same data and the same panel
 * component; only the chrome differs.
 *
 * Every field the reference shows is rendered even when we hold no data for it
 * yet: an em dash, never a hidden column and never a plausible-looking zero.
 */

const ALL = '__all__'

interface CarRow extends Vehicle {
  photos: VehiclePhoto[]
}

export function MyCarsPage() {
  const { t } = useTranslation(['cars', 'common', 'photos'])
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const [rows, setRows] = useState<CarRow[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [location, setLocation] = useState<string | null>(ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [galleryFor, setGalleryFor] = useState<CarRow | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    // RLS already limits this to the caller's own rows; the explicit user_id
    // filter keeps the intent visible and the query index-friendly.
    const [vehicleRes, profileRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<Vehicle[]>(),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle<Profile>(),
    ])

    if (vehicleRes.error) {
      setError(vehicleRes.error.message)
      setRows([])
      setLoading(false)
      return
    }

    const vehicles = vehicleRes.data ?? []
    setProfile(profileRes.data ?? null)

    if (vehicles.length === 0) {
      setRows([])
      setLoading(false)
      return
    }

    // One query for every photo on every vehicle, rather than one per row.
    const { data: photoRows, error: photoError } = await supabase
      .from('vehicle_photos')
      .select('id, vehicle_id, url, created_at, category')
      .in(
        'vehicle_id',
        vehicles.map((vehicle) => vehicle.id),
      )
      .order('created_at', { ascending: true })
      .returns<VehiclePhoto[]>()

    // A photo failure must not hide the cars themselves.
    const byVehicle = new Map<string, VehiclePhoto[]>()
    if (!photoError) {
      for (const photo of photoRows ?? []) {
        if (!photo.vehicle_id) continue
        const list = byVehicle.get(photo.vehicle_id) ?? []
        list.push(photo)
        byVehicle.set(photo.vehicle_id, list)
      }
    }

    setRows(
      vehicles.map((vehicle) => ({
        ...vehicle,
        photos: byVehicle.get(vehicle.id) ?? [],
      })),
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!location || location === ALL) return rows
    // Compared against the STORED English value, never a translated label.
    return rows.filter((row) => row.location === location)
  }, [rows, location])

  const locationItems = useMemo(
    () => [
      { value: ALL, label: t('locationAll') },
      ...VEHICLE_LOCATIONS.map((value) => ({
        value,
        label: locationLabel(value),
      })),
    ],
    [t],
  )

  const client = displayText(profile?.full_name)
  const personalNumber = displayText(profile?.personal_number)

  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id))

  const detailsPanel = (row: CarRow) => (
    <VehicleDetailsCards
      vehicle={row}
      client={client}
      personalNumber={personalNumber}
    />
  )

  /** The gallery button, shared by the table's Image cell and the card. */
  const galleryButton = (row: CarRow) => (
    <Button
      variant="ghost"
      className="size-11 rounded-lg md:size-9"
      aria-label={t('openGallery')}
      onClick={() => setGalleryFor(row)}
    >
      <Images className="size-4" aria-hidden="true" />
      {row.photos.length > 0 && (
        <span className="text-xs tabular-nums">{row.photos.length}</span>
      )}
    </Button>
  )

  const detailsButton = (row: CarRow, className?: string) => {
    const open = expandedId === row.id
    return (
      <Button
        variant="outline"
        className={className}
        aria-expanded={open}
        aria-controls={`details-${row.id}`}
        onClick={() => toggle(row.id)}
      >
        {open ? t('hideDetails') : t('details')}
        {open ? (
          <ChevronUp className="size-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4" aria-hidden="true" />
        )}
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* Filter bar. Full width above the table, as in the reference. */}
      <div className="bg-secondary/60 border-border/60 flex flex-wrap items-center gap-3 rounded-2xl border p-4">
        <Label htmlFor="location-filter" className="font-semibold">
          {t('locationFilter')}:
        </Label>
        <Select
          items={locationItems}
          value={location}
          onValueChange={setLocation}
        >
          <SelectTrigger id="location-filter" className="bg-card w-56">
            <SelectValue placeholder={t('locationAll')} />
          </SelectTrigger>
          <SelectContent>
            {locationItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!loading && !error && (
          <span className="text-muted-foreground ml-auto text-sm">
            {t('countLabel', { shown: filtered.length, total: rows.length })}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">{t('loading')}</span>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{t('loadError', { error })}</span>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-gradient-subtle border-border/60 rounded-3xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* ---------- Desktop: the full table ---------- */}
          <div className="border-border/60 bg-card shadow-soft hidden overflow-x-auto rounded-2xl border md:block">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    {t('colId')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t('colRegistered')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t('colAuctionDate')}
                  </TableHead>
                  <TableHead>{t('colVin')}</TableHead>
                  <TableHead>{t('colLot')}</TableHead>
                  <TableHead>{t('colCar')}</TableHead>
                  <TableHead className="text-right">{t('colDebt')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    {t('colPenalty')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t('colStatus')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t('colOpening')}
                  </TableHead>
                  <TableHead>{t('colImage')}</TableHead>
                  <TableHead className="text-right">
                    {t('colActions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-muted-foreground py-10 text-center"
                    >
                      {t('noMatch')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    /*
                      A fragment, not a wrapper element: the details panel is a
                      sibling <tr>, so it can span the full table width directly
                      beneath its own row. Nesting it inside the row would put a
                      block element in a <td> and break the column grid.
                    */
                    <Fragment key={row.id}>
                      <TableRow>
                        <TableCell className="font-medium tabular-nums">
                          {displayNumber(row.ref_no)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTime(row.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateOnly(row.auction_date)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {displayText(row.vin)}
                        </TableCell>
                        <TableCell>{displayText(row.lot_number)}</TableCell>
                        <TableCell className="font-medium">
                          {carLabel(row)}
                        </TableCell>
                        {/* Money owed reads red, as in the reference. */}
                        <TableCell className="text-destructive text-right font-semibold tabular-nums">
                          {formatCurrency(vehicleDebt(row))}
                        </TableCell>
                        <TableCell className="text-destructive text-right font-semibold tabular-nums">
                          {formatCurrency(row.auction_penalty)}
                        </TableCell>
                        <TableCell>
                          <VehicleStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateOnly(row.expected_opening_date)}
                        </TableCell>
                        <TableCell>{galleryButton(row)}</TableCell>
                        <TableCell className="text-right">
                          {detailsButton(row, 'h-9 rounded-full px-4')}
                        </TableCell>
                      </TableRow>

                      {expandedId === row.id && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={12}
                            id={`details-${row.id}`}
                            className="bg-secondary/30 p-4"
                          >
                            {detailsPanel(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ---------- Mobile: one card per vehicle ---------- */}
          <div className="space-y-3 md:hidden">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                {t('noMatch')}
              </p>
            ) : (
              filtered.map((row) => (
                <div
                  key={row.id}
                  className="border-border/60 bg-card shadow-soft space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {t('colId')} {displayNumber(row.ref_no)}
                      </p>
                      <p className="truncate font-semibold">{carLabel(row)}</p>
                    </div>
                    <VehicleStatusBadge status={row.status} />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t('colDebt')}
                      </p>
                      <p className="text-destructive font-semibold tabular-nums">
                        {formatCurrency(vehicleDebt(row))}
                      </p>
                    </div>
                    {galleryButton(row)}
                  </div>

                  {detailsButton(row, 'h-11 w-full rounded-full')}

                  {expandedId === row.id && (
                    <div id={`details-${row.id}`}>{detailsPanel(row)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Photo gallery, grouped into the four fixed categories. */}
      <Dialog
        open={galleryFor !== null}
        onOpenChange={(open) => {
          if (!open) setGalleryFor(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('galleryTitle')}</DialogTitle>
            <DialogDescription>
              {galleryFor ? carLabel(galleryFor) : ''}
            </DialogDescription>
          </DialogHeader>

          {galleryFor && (
            <VehicleGallery
              photos={galleryFor.photos}
              title={carLabel(galleryFor)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
