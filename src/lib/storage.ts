import { supabase } from '@/lib/supabase'

export const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos'

/** Mirrors the bucket limits declared in 0008_vehicle_photos_storage.sql. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const ACCEPTED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName
  return file.type === 'image/png' ? 'png' : 'jpg'
}

/**
 * Builds the storage path the RLS policies expect:
 *   <userId>/<vehicleId>/<random>.<ext>
 * The leading userId segment is what storage.foldername(name)[1] checks.
 */
export function buildPhotoPath(
  userId: string,
  vehicleId: string,
  file: File,
): string {
  return `${userId}/${vehicleId}/${crypto.randomUUID()}.${fileExtension(file)}`
}

/** Client-side mirror of the bucket constraints, for a friendlier message. */
export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return `${file.name}: unsupported type (use JPEG, PNG, WebP or AVIF)`
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `${file.name}: larger than 10 MB`
  }
  return null
}

/** Uploads one file and returns its storage path, or an error message. */
export async function uploadVehiclePhoto(
  userId: string,
  vehicleId: string,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  const path = buildPhotoPath(userId, vehicleId, file)
  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { path: null, error: `${file.name}: ${error.message}` }
  return { path, error: null }
}

/**
 * Turns a stored path into a temporary viewable URL.
 *
 * The bucket is private, so there is no permanent public URL. Returns null
 * when the path is missing or the signing call is refused (which is what a
 * user would see for a photo that is not theirs).
 */
export async function signPhotoUrl(
  path: string | null,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}
