import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Loader2, RotateCcw, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import type { Vehicle, VehiclePhoto } from '@/types/database'
import {
  ACCEPTED_PHOTO_TYPES,
  uploadVehiclePhoto,
  validatePhoto,
} from '@/lib/storage'
import { compressImage, formatBytes } from '@/lib/image-compress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Values are kept as strings and converted on submit -- more predictable than
 * coercion, and it lets "leave it blank" mean NULL rather than 0.
 *
 * NOTE: there is intentionally no `status` field here or anywhere else on the
 * customer side. Status is admin-only, enforced by RLS plus the
 * guard_vehicle_status trigger; the insert below omits it so the column
 * default ('At Auction') applies.
 */
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
  total_amount: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      'vAmount',
    ),
  notes: optionalText(2000),
})

type VehicleValues = z.infer<typeof vehicleSchema>

/** '' -> null, so blank fields stay NULL instead of becoming empty strings. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
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

export function AddVehiclePage() {
  const { t } = useTranslation(['vehicles', 'common'])
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id ?? null

  const [items, setItems] = useState<PhotoItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)
  /*
    Set once the vehicle row exists. Its presence is what lets the user retry
    only the failed photos without creating a second vehicle.
  */
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: '',
      make: '',
      model: '',
      vin: '',
      lot_number: '',
      container_number: '',
      booking_number: '',
      receiver: '',
      shipping_line: '',
      total_amount: '',
      notes: '',
    },
  })

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
    vehicleId: string,
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
        vehicleId,
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
    vehicleId: string,
    paths: string[],
  ): Promise<string | null> => {
    if (paths.length === 0) return null
    const { data: photoRows, error: photoError } = await supabase
      .from('vehicle_photos')
      .insert(paths.map((path) => ({ vehicle_id: vehicleId, url: path })))
      .select()
      .returns<VehiclePhoto[]>()

    if (photoError) return photoError.message
    if ((photoRows?.length ?? 0) !== paths.length) {
      return 'Some photos uploaded but could not be linked to the vehicle.'
    }
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

  const onSubmit = async (values: VehicleValues) => {
    setFormError(null)
    setPhotoWarning(null)

    if (!userId) {
      setFormError(t('errSession'))
      return
    }

    // status is deliberately absent -- the column default applies.
    const { data: inserted, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        user_id: userId,
        year: values.year === '' ? null : Number(values.year),
        make: nullIfBlank(values.make),
        model: nullIfBlank(values.model),
        vin: nullIfBlank(values.vin)?.toUpperCase() ?? null,
        lot_number: nullIfBlank(values.lot_number),
        container_number: nullIfBlank(values.container_number),
        booking_number: nullIfBlank(values.booking_number),
        receiver: nullIfBlank(values.receiver),
        shipping_line: nullIfBlank(values.shipping_line),
        total_amount: values.total_amount === '' ? 0 : Number(values.total_amount),
        notes: nullIfBlank(values.notes),
      })
      .select()
      .maybeSingle<Vehicle>()

    if (insertError) {
      setFormError(t('errSave', { error: insertError.message }))
      return
    }

    // Read-back check: an RLS-filtered write can come back with no error and
    // no row. Treating that as success would strand the user on a vehicle
    // that does not exist.
    if (!inserted) {
      setFormError(t('errNotSaved'))
      return
    }

    setSavedVehicleId(inserted.id)

    if (items.length > 0) {
      setUploading(true)
      const { paths, failed } = await runUploads(userId, inserted.id, items)
      const linkError = await linkPhotos(inserted.id, paths)
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('addTitle')}</h1>

      <Card className="border-border/60 shadow-soft max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader>
            <CardTitle>{t('detailsTitle')}</CardTitle>
            <CardDescription>{t('detailsSubtitle')}</CardDescription>
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
              {textField('total_amount', t('totalAmount'), '0.00')}
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

            <div className="space-y-2">
              <Label htmlFor="photos">{t('photos')}</Label>
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
              {t('saveVehicle')}
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
