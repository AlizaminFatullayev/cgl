import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import type { Vehicle, VehiclePhoto } from '@/types/database'
import {
  ACCEPTED_PHOTO_TYPES,
  uploadVehiclePhoto,
  validatePhoto,
} from '@/lib/storage'
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
      'Enter a 4-digit year between 1900 and 2100',
    ),
  make: optionalText(80),
  model: optionalText(80),
  vin: z
    .string()
    .trim()
    .refine((v) => v === '' || v.length <= 17, 'A VIN is at most 17 characters'),
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
      'Enter a non-negative amount',
    ),
  notes: optionalText(2000),
})

type VehicleValues = z.infer<typeof vehicleSchema>

/** '' -> null, so blank fields stay NULL instead of becoming empty strings. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

export function AddVehiclePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id ?? null

  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const picked = [...(event.target.files ?? [])]
    const problems = picked.map(validatePhoto).filter((p): p is string => p !== null)
    if (problems.length > 0) {
      setFileError(problems.join('; '))
      return
    }
    setFiles((current) => [...current, ...picked])
    // Reset so re-picking the same file still fires a change event.
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: VehicleValues) => {
    setFormError(null)
    setPhotoWarning(null)

    if (!userId) {
      setFormError('Your session expired. Please sign in again.')
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
      setFormError(`Could not save the vehicle: ${insertError.message}`)
      return
    }

    // Read-back check: an RLS-filtered write can come back with no error and
    // no row. Treating that as success would strand the user on a vehicle
    // that does not exist.
    if (!inserted) {
      setFormError(
        'The vehicle was not saved. Your account may not have permission to ' +
          'add vehicles — please contact support.',
      )
      return
    }

    if (files.length > 0) {
      const uploadedPaths: string[] = []
      const failures: string[] = []

      for (const file of files) {
        const { path, error } = await uploadVehiclePhoto(
          userId,
          inserted.id,
          file,
        )
        if (path) uploadedPaths.push(path)
        if (error) failures.push(error)
      }

      if (uploadedPaths.length > 0) {
        const { data: photoRows, error: photoError } = await supabase
          .from('vehicle_photos')
          .insert(uploadedPaths.map((path) => ({
            vehicle_id: inserted.id,
            url: path,
          })))
          .select()
          .returns<VehiclePhoto[]>()

        if (photoError) {
          failures.push(photoError.message)
        } else if ((photoRows?.length ?? 0) !== uploadedPaths.length) {
          failures.push(
            'Some photos uploaded but could not be linked to the vehicle.',
          )
        }
      }

      if (failures.length > 0) {
        // The vehicle itself is saved, so this is a warning, not a failure.
        setPhotoWarning(
          `The vehicle was saved, but some photos did not attach: ${failures.join('; ')}`,
        )
        return
      }
    }

    navigate('/vehicles', { replace: true })
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
        <p className="text-destructive text-sm">{errors[name]?.message}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add a vehicle</h1>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardHeader>
            <CardTitle>Vehicle details</CardTitle>
            <CardDescription>
              New vehicles start at status “At Auction”. Only our staff can move
              a vehicle to the next status.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {textField('year', 'Year', '2021')}
              {textField('make', 'Make', 'Toyota')}
              {textField('model', 'Model', 'Camry')}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {textField('vin', 'VIN', '1HGCM82633A004352')}
              {textField('lot_number', 'Lot number')}
              {textField('container_number', 'Container number')}
              {textField('booking_number', 'Booking number')}
              {textField('receiver', 'Receiver')}
              {textField('shipping_line', 'Shipping line')}
              {textField('total_amount', 'Total amount (USD)', '0.00')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={4} {...register('notes')} />
              {errors.notes && (
                <p className="text-destructive text-sm">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photos">Photos</Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept={ACCEPTED_PHOTO_TYPES.join(',')}
                onChange={handleFileChange}
              />
              <p className="text-muted-foreground text-sm">
                JPEG, PNG, WebP or AVIF. Up to 10 MB each.
              </p>
              {fileError && (
                <p className="text-destructive text-sm">{fileError}</p>
              )}
              {files.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
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
                    Go to my vehicles
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="mt-6 gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save vehicle
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/vehicles')}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
