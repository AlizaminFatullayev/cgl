import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Loader2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import type { Vehicle, VehiclePhoto } from '@/types/database'
import {
  ACCEPTED_PHOTO_TYPES,
  removeVehiclePhotos,
  uploadVehiclePhoto,
  validatePhoto,
} from '@/lib/storage'
import { useSignedPhotos } from '@/lib/use-signed-photos'
import { compressImage, formatBytes } from '@/lib/image-compress'
import { formatCurrency, vehicleTitle } from '@/lib/format'
import { PhotoViewer } from '@/components/PhotoViewer'
import { usePhotoViewer } from '@/lib/use-photo-viewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * One form, two modes.
 *
 *   /vehicles/new             -> add   (INSERT, status omitted so the column
 *                                       default 'At Auction' applies)
 *   /vehicles/:vehicleId/edit -> edit  (UPDATE of the customer-supplied fields
 *                                       only, plus adding and removing photos)
 *
 * Values are kept as strings and converted on submit -- more predictable than
 * coercion, and it lets "leave it blank" mean NULL rather than 0.
 *
 * NOTE: there is intentionally no `status` field here or anywhere else on the
 * customer side. Status is admin-only, enforced by RLS plus the
 * guard_vehicle_status trigger.
 *
 * EDIT MODE IS NOT SECURED BY THIS FILE. The set of columns a customer may
 * change is a whitelist inside guard_customer_vehicle_columns()
 * (0013_vehicle_detail_fields.sql); everything else is rejected by the database
 * whatever this form sends. EDITABLE_COLUMNS below is the client-side mirror of
 * that list, kept for the reader's benefit -- it is a convenience, not a
 * control. Keep the two in step.
 */
const EDITABLE_COLUMNS = [
  'year',
  'make',
  'model',
  'vin',
  'lot_number',
  'container_number',
  'booking_number',
  'receiver',
  'shipping_line',
  'notes',
] as const

const optionalText = (max: number) => z.string().trim().max(max).optional()

const vehicleSchema = z.object({
  year: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= 2100),
      'vYear',
    ),
  make: optionalText(80),
  model: optionalText(80),
  vin: z.string().trim().refine((v) => v === '' || v.length <= 17, 'vVin'),
  lot_number: optionalText(50),
  container_number: optionalText(50),
  booking_number: optionalText(50),
  receiver: optionalText(120),
  shipping_line: optionalText(120),
  notes: optionalText(2000),
})

type VehicleValues = z.infer<typeof vehicleSchema>

const EMPTY_VALUES: VehicleValues = {
  year: '',
  make: '',
  model: '',
  vin: '',
  lot_number: '',
  container_number: '',
  booking_number: '',
  receiver: '',
  shipping_line: '',
  notes: '',
}

/** '' -> null, so blank fields stay NULL instead of becoming empty strings. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

/** Row -> form values. Every column is nullable; the form wants strings. */
function toFormValues(vehicle: Vehicle): VehicleValues {
  return {
    year: vehicle.year === null ? '' : String(vehicle.year),
    make: vehicle.make ?? '',
    model: vehicle.model ?? '',
    vin: vehicle.vin ?? '',
    lot_number: vehicle.lot_number ?? '',
    container_number: vehicle.container_number ?? '',
    booking_number: vehicle.booking_number ?? '',
    receiver: vehicle.receiver ?? '',
    shipping_line: vehicle.shipping_line ?? '',
    notes: vehicle.notes ?? '',
  }
}

/** The columns the customer owns, as a patch. Nothing else is ever sent. */
function toEditablePatch(values: VehicleValues): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    year: values.year === '' ? null : Number(values.year),
    make: nullIfBlank(values.make),
    model: nullIfBlank(values.model),
    vin: nullIfBlank(values.vin)?.toUpperCase() ?? null,
    lot_number: nullIfBlank(values.lot_number),
    container_number: nullIfBlank(values.container_number),
    booking_number: nullIfBlank(values.booking_number),
    receiver: nullIfBlank(values.receiver),
    shipping_line: nullIfBlank(values.shipping_line),
    notes: nullIfBlank(values.notes),
  }

  // Anything not on the whitelist never leaves the browser. The database would
  // reject it anyway; dropping it here keeps the two lists honest with each
  // other and keeps a stray future field from turning into a failed save.
  for (const key of Object.keys(patch)) {
    if (!(EDITABLE_COLUMNS as readonly string[]).includes(key)) {
      delete patch[key]
    }
  }
  return patch
}

type PhotoStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'failed'

/** One picked file and where it has got to. `error` is already translated. */
interface PhotoItem {
  id: string
  file: File
  status: PhotoStatus
  error: string | null
  originalBytes: number
  /** Set once compression actually shrank the file, for the "5 MB -> 1.8 MB" line. */
  finalBytes: number | null
}

export function VehicleFormPage() {
  const { t } = useTranslation(['vehicles', 'common', 'photos'])
  const { session } = useAuth()
  const navigate = useNavigate()
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const userId = session?.user.id ?? null
  const isEdit = Boolean(vehicleId)

  const [items, setItems] = useState<PhotoItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)
  /*
    Set once the vehicle row exists -- immediately in edit mode, after the
    INSERT in add mode. Its presence is what lets the user retry only the failed
    photos without creating a second vehicle.
  */
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(
    vehicleId ?? null,
  )
  const [uploading, setUploading] = useState(false)

  // Edit mode only.
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [existingPhotos, setExistingPhotos] = useState<VehiclePhoto[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: EMPTY_VALUES,
  })

  /*
    Loads the vehicle being edited. RLS already limits this to the caller's own
    rows, so "not found" and "not yours" are deliberately the same message --
    telling the difference apart would confirm the existence of someone else's
    vehicle.
  */
  const loadVehicle = useCallback(async () => {
    if (!vehicleId) return
    setLoading(true)
    setLoadError(null)

    const [vehicleRes, photoRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle<Vehicle>(),
      supabase
        .from('vehicle_photos')
        .select('id, vehicle_id, url, created_at, category')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: true })
        .returns<VehiclePhoto[]>(),
    ])

    if (vehicleRes.error) {
      setLoadError(t('errLoadVehicle', { error: vehicleRes.error.message }))
      setLoading(false)
      return
    }
    if (!vehicleRes.data) {
      setLoadError(t('errVehicleNotFound'))
      setLoading(false)
      return
    }

    setVehicle(vehicleRes.data)
    reset(toFormValues(vehicleRes.data))
    setExistingPhotos(photoRes.error ? [] : (photoRes.data ?? []))
    setLoading(false)
  }, [vehicleId, reset, t])

  useEffect(() => {
    if (isEdit) void loadVehicle()
  }, [isEdit, loadVehicle])

  /*
    Every picked file becomes a row, valid or not. The old version threw the
    WHOLE selection away as soon as one file failed validation, which is what
    made "I picked ten photos and nothing happened" possible.
  */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = [...(event.target.files ?? [])]
    setItems((current) => [
      ...current,
      ...picked.map((file) => {
        const problem = validatePhoto(file)
        return {
          id: crypto.randomUUID(),
          file,
          status: problem ? ('failed' as const) : ('pending' as const),
          error: problem ? t(problem.key, problem.values) : null,
          originalBytes: file.size,
          finalBytes: null,
        }
      }),
    ])
    // Reset so re-picking the same file still fires a change event.
    event.target.value = ''
  }

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const patchItem = (id: string, patch: Partial<PhotoItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  /**
   * Compresses and uploads the given rows one at a time, reporting progress
   * per file. A failure is recorded on its own row and the loop continues --
   * one bad photo never costs the customer the other nine.
   */
  const runUploads = async (
    ownerId: string,
    targetVehicleId: string,
    queue: PhotoItem[],
  ): Promise<{ paths: string[]; failed: number }> => {
    const uploadedPaths: string[] = []
    let failed = 0

    for (const item of queue) {
      const problem = validatePhoto(item.file)
      if (problem) {
        failed += 1
        patchItem(item.id, {
          status: 'failed',
          error: t(problem.key, problem.values),
        })
        continue
      }

      patchItem(item.id, { status: 'compressing', error: null })
      const { file: toUpload, compressed } = await compressImage(item.file)

      // Re-check AFTER compressing: a file can still be over the ceiling.
      const afterProblem = validatePhoto(toUpload)
      if (afterProblem) {
        failed += 1
        patchItem(item.id, {
          status: 'failed',
          error: t(afterProblem.key, afterProblem.values),
        })
        continue
      }

      patchItem(item.id, {
        status: 'uploading',
        finalBytes: compressed ? toUpload.size : null,
      })

      const { path, error } = await uploadVehiclePhoto(
        ownerId,
        targetVehicleId,
        toUpload,
      )

      if (path) {
        uploadedPaths.push(path)
        patchItem(item.id, { status: 'done', error: null })
      } else {
        failed += 1
        patchItem(item.id, { status: 'failed', error })
      }
    }

    return { paths: uploadedPaths, failed }
  }

  /** Links uploaded storage paths to the vehicle. Returns a failure message. */
  const linkPhotos = async (
    targetVehicleId: string,
    paths: string[],
  ): Promise<string | null> => {
    if (paths.length === 0) return null
    const { data: photoRows, error: photoError } = await supabase
      .from('vehicle_photos')
      .insert(paths.map((path) => ({ vehicle_id: targetVehicleId, url: path })))
      .select()
      .returns<VehiclePhoto[]>()

    if (photoError) return photoError.message
    if ((photoRows?.length ?? 0) !== paths.length) {
      return 'Some photos uploaded but could not be linked to the vehicle.'
    }
    return null
  }

  /**
   * Detaches the photos the customer ticked off.
   *
   * The vehicle_photos row goes first and the storage object second: the row is
   * the RLS-guarded record, and if the object delete then fails the worst case
   * is an unreferenced file in the bucket. The other order would leave a row
   * pointing at nothing, which renders as a broken photo.
   */
  const applyRemovals = async (): Promise<string | null> => {
    if (removedIds.length === 0) return null

    const targets = existingPhotos.filter((photo) =>
      removedIds.includes(photo.id),
    )

    const { data, error } = await supabase
      .from('vehicle_photos')
      .delete()
      .in('id', removedIds)
      .select()
      .returns<VehiclePhoto[]>()

    // RLS refuses a delete by matching no rows, not by raising -- so an empty
    // result with no error is a refusal, not a no-op.
    if (error) return error.message
    if ((data?.length ?? 0) !== removedIds.length) {
      return t('errPhotoRemoveBlocked')
    }

    const storageError = await removeVehiclePhotos(
      targets
        .map((photo) => photo.url)
        .filter((url): url is string => url !== null),
    )
    if (storageError) return storageError

    setExistingPhotos((current) =>
      current.filter((photo) => !removedIds.includes(photo.id)),
    )
    setRemovedIds([])
    return null
  }

  /** Retries only the rows that failed, against the already-saved vehicle. */
  const retryFailed = async () => {
    if (!savedVehicleId || !userId) return
    const failed = items.filter((item) => item.status === 'failed')
    if (failed.length === 0) return

    setUploading(true)
    setPhotoWarning(null)
    const { paths } = await runUploads(userId, savedVehicleId, failed)
    const linkError = await linkPhotos(savedVehicleId, paths)
    setUploading(false)

    if (linkError) {
      setPhotoWarning(t('warnPhotos', { errors: linkError }))
    }
  }

  /** Add mode's INSERT. Returns the new id, or null after setting an error. */
  const insertVehicle = async (
    values: VehicleValues,
  ): Promise<string | null> => {
    if (!userId) return null

    /*
      Only the whitelisted columns plus user_id. status and every money column
      are deliberately absent -- the guard_customer_vehicle_insert trigger
      resets them to their defaults for a non-admin anyway, so sending them
      would be a lie about who owns them.
    */
    const { data: inserted, error: insertError } = await supabase
      .from('vehicles')
      .insert({ user_id: userId, ...toEditablePatch(values) })
      .select()
      .maybeSingle<Vehicle>()

    if (insertError) {
      setFormError(t('errSave', { error: insertError.message }))
      return null
    }

    // Read-back check: an RLS-filtered write can come back with no error and
    // no row. Treating that as success would strand the user on a vehicle
    // that does not exist.
    if (!inserted) {
      setFormError(t('errNotSaved'))
      return null
    }

    setSavedVehicleId(inserted.id)
    return inserted.id
  }

  const onSubmit = async (values: VehicleValues) => {
    setFormError(null)
    setPhotoWarning(null)

    if (!userId) {
      setFormError(t('errSession'))
      return
    }

    const targetId = isEdit ? (vehicleId ?? null) : await insertVehicle(values)
    if (!targetId) return

    if (isEdit) {
      /*
        Only EDITABLE_COLUMNS are sent. Even so, the read-back below is what
        proves the write landed: RLS and the column-whitelist trigger reject
        differently -- the trigger raises, RLS just matches no rows and returns
        success with nothing in it.
      */
      const { data, error } = await supabase
        .from('vehicles')
        .update(toEditablePatch(values))
        .eq('id', targetId)
        .select()
        .returns<Vehicle[]>()

      if (error) {
        setFormError(t('errUpdate', { error: error.message }))
        return
      }
      if (!data || data.length === 0) {
        setFormError(t('errNotUpdated'))
        return
      }
      setVehicle(data[0])

      const removalError = await applyRemovals()
      if (removalError) {
        setPhotoWarning(t('warnPhotoRemove', { error: removalError }))
        return
      }
    }

    if (items.length > 0) {
      setUploading(true)
      const { paths, failed } = await runUploads(userId, targetId, items)
      const linkError = await linkPhotos(targetId, paths)
      setUploading(false)

      if (linkError) {
        // The vehicle itself is saved, so this is a warning, not a failure.
        setPhotoWarning(t('warnPhotos', { errors: linkError }))
        return
      }

      /*
        Stay on the page when anything failed so the customer can retry just
        those files. Navigating away would silently lose them.
      */
      if (failed > 0) return
    }

    navigate('/vehicles', { replace: true })
  }

  const doneCount = items.filter((item) => item.status === 'done').length
  const failedCount = items.filter((item) => item.status === 'failed').length

  const photoStatusLabel = (item: PhotoItem): string => {
    switch (item.status) {
      case 'compressing':
        return t('photoStateCompressing')
      case 'uploading':
        return t('photoStateUploading')
      case 'done':
        return t('photoStateDone')
      case 'failed':
        return t('photoStateFailed')
      default:
        return t('photoStatePending')
    }
  }

  const textField = (
    name: keyof VehicleValues,
    label: string,
    placeholder?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        placeholder={placeholder}
        aria-invalid={Boolean(errors[name])}
        {...register(name)}
      />
      {errors[name] && (
        <p className="text-destructive text-sm">{t(errors[name]?.message ?? '')}</p>
      )}
    </div>
  )

  if (isEdit && loading) {
    return (
      <div className="flex items-center gap-2 py-10">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground">{t('loadingVehicle')}</span>
      </div>
    )
  }

  if (isEdit && loadError) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => navigate('/vehicles')}
        >
          {t('goToMyVehicles')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {isEdit ? t('editTitle') : t('addTitle')}
      </h1>

      <Card className="border-border/60 shadow-soft max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader>
            <CardTitle>{t('detailsTitle')}</CardTitle>
            <CardDescription>
              {isEdit ? t('editSubtitle') : t('detailsSubtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {textField('year', t('year'), '2021')}
              {textField('make', t('make'), 'Toyota')}
              {textField('model', t('model'), 'Camry')}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {textField('vin', t('vin'), '1HGCM82633A004352')}
              {textField('lot_number', t('lotNumber'))}
              {textField('container_number', t('containerNumber'))}
              {textField('booking_number', t('bookingNumber'))}
              {textField('receiver', t('receiver'))}
              {textField('shipping_line', t('shippingLine'))}

              {/*
                The total is DISPLAYED, never typed. Debt is total_amount -
                paid, so an input here would be an input for the customer's own
                debt -- and the database now resets the column on INSERT as well
                as UPDATE, so a field would have been a control that does
                nothing. In add mode there is no amount yet, so nothing shows.
              */}
              {isEdit && vehicle && (
                <div className="space-y-2">
                  <Label>{t('total')}</Label>
                  <p className="border-border/60 bg-secondary/40 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums">
                    {formatCurrency(vehicle.total_amount)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t('adminManagedField')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea id="notes" rows={4} {...register('notes')} />
              {errors.notes && (
                <p className="text-destructive text-sm">
                  {t(errors.notes.message ?? '')}
                </p>
              )}
            </div>

            {isEdit && existingPhotos.length > 0 && (
              <ExistingPhotos
                photos={existingPhotos}
                removedIds={removedIds}
                onToggle={(id) =>
                  setRemovedIds((current) =>
                    current.includes(id)
                      ? current.filter((other) => other !== id)
                      : [...current, id],
                  )
                }
                title={vehicle ? vehicleTitle(vehicle) : ''}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="photos">
                {isEdit ? t('photoAddMore') : t('photos')}
              </Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept={ACCEPTED_PHOTO_TYPES.join(',')}
                onChange={handleFileChange}
              />
              <p className="text-muted-foreground text-sm">
                {t('photoHint')}
              </p>

              {items.length > 0 && (
                <>
                  <p
                    className="text-muted-foreground pt-1 text-sm"
                    aria-live="polite"
                  >
                    {t('photoSelected', { count: items.length })}
                    {(doneCount > 0 || failedCount > 0) && (
                      <>
                        {' — '}
                        {t('photoSummary', {
                          done: doneCount,
                          total: items.length,
                          failed: failedCount,
                        })}
                      </>
                    )}
                  </p>

                  <ul className="space-y-1 pt-1">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="bg-secondary/50 border-border/60 rounded-lg border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{item.file.name}</span>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={
                                item.status === 'failed'
                                  ? 'text-destructive text-xs font-medium'
                                  : 'text-muted-foreground text-xs'
                              }
                            >
                              {photoStatusLabel(item)}
                            </span>

                            {item.status === 'done' && (
                              <Check
                                className="text-primary size-4"
                                aria-hidden="true"
                              />
                            )}
                            {(item.status === 'compressing' ||
                              item.status === 'uploading') && (
                              <Loader2
                                className="text-muted-foreground size-4 animate-spin"
                                aria-hidden="true"
                              />
                            )}

                            {!uploading && item.status !== 'done' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeItem(item.id)}
                                aria-label={t('photoRemove', {
                                  name: item.file.name,
                                })}
                              >
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {item.finalBytes !== null && (
                          <p className="text-muted-foreground pt-0.5 text-xs tabular-nums">
                            {t('photoCompressedTo', {
                              from: formatBytes(item.originalBytes),
                              to: formatBytes(item.finalBytes),
                            })}
                          </p>
                        )}

                        {item.error && (
                          <p className="text-destructive pt-0.5 text-xs">
                            {item.error}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {savedVehicleId && failedCount > 0 && !uploading && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full md:h-8"
                      onClick={retryFailed}
                    >
                      <RotateCcw className="size-4" />
                      {t('photoRetryFailed')}
                    </Button>
                  )}
                </>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {photoWarning && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-2">
                  <p>{photoWarning}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/vehicles', { replace: true })}
                  >
                    {t('goToMyVehicles')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="mt-6 gap-3">
            <Button
              type="submit"
              className="shadow-soft rounded-full px-6"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t('common:saveChanges') : t('saveVehicle')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full px-5"
              onClick={() => navigate('/vehicles')}
            >
              {t('common:cancel')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

/**
 * The photos already on the vehicle.
 *
 * Removal is staged, not immediate: ticking a photo marks it and Cancel throws
 * the marks away. Nothing is deleted until the form is saved, so a misclick
 * costs nothing.
 *
 * Clicking the photo itself opens the shared viewer -- the same URLs, signed
 * once by useSignedPhotos.
 */
function ExistingPhotos({
  photos,
  removedIds,
  onToggle,
  title,
}: {
  photos: VehiclePhoto[]
  removedIds: string[]
  onToggle: (id: string) => void
  title: string
}) {
  const { t } = useTranslation(['vehicles', 'photos'])
  const paths = photos
    .map((photo) => photo.url)
    .filter((url): url is string => url !== null)
  const { urls, refresh } = useSignedPhotos(paths)
  const viewer = usePhotoViewer()

  return (
    <div className="space-y-2">
      <Label>{t('currentPhotos')}</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => {
          const marked = removedIds.includes(photo.id)
          return (
            <div key={photo.id} className="space-y-1">
              <button
                type="button"
                onClick={(event) => viewer.open(index, event)}
                className={cn(
                  'bg-secondary focus-visible:ring-ring border-border/60 relative block aspect-4/3 w-full overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  marked && 'opacity-40',
                )}
                aria-label={t('photos:openViewer', {
                  index: index + 1,
                  total: photos.length,
                })}
              >
                {urls[index] ? (
                  <img
                    src={urls[index] ?? undefined}
                    alt=""
                    loading="lazy"
                    onError={refresh}
                    className="size-full object-cover"
                  />
                ) : null}
              </button>

              <Button
                type="button"
                variant="ghost"
                className={cn(
                  'h-11 w-full rounded-full text-xs md:h-9',
                  marked ? '' : 'text-destructive hover:text-destructive',
                )}
                onClick={() => onToggle(photo.id)}
              >
                {marked ? (
                  <>
                    <Undo2 className="size-4" aria-hidden="true" />
                    {t('photoUndoRemove')}
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t('photoRemoveExisting')}
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {removedIds.length > 0 && (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {t('photoRemovePending', { count: removedIds.length })}
        </p>
      )}

      <PhotoViewer
        urls={urls}
        index={viewer.index}
        onIndexChange={viewer.goTo}
        onClose={viewer.close}
        returnFocusRef={viewer.returnFocusRef}
        title={title}
        onExpired={refresh}
      />
    </div>
  )
}
