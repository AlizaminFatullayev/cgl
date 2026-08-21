import { supabase } from '@/lib/supabase'

export const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos'

/**
 * Mirrors the bucket limits declared in the storage migrations.
 *
 * 50 MB matches 0012_vehicle_photos_50mb.sql. It is a ceiling, not a target:
 * the browser downscales and re-encodes before upload (src/lib/image-compress.ts),
 * so a typical photo arrives around 2 MB. Keep this in step with the bucket --
 * a client limit above the bucket's just turns a friendly message into an
 * opaque storage error.
 */
export const MAX_PHOTO_BYTES = 50 * 1024 * 1024
export const ACCEPTED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

/**
 * Types worth naming in an error, because desktop users hit them constantly.
 * HEIC is what a Mac hands you when you drag a photo out of Photos, and no
 * amount of client code can decode it without a heavy wasm dependency.
 */
const KNOWN_UNSUPPORTED = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

function humanBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

/**
 * Client-side mirror of the bucket constraints.
 *
 * Returns an i18n key plus its interpolation values rather than a sentence, so
 * the message reaches the customer in their own language. The size message
 * names BOTH the actual size and the limit -- "too large" alone leaves the
 * customer with nothing to act on.
 */
export type PhotoProblem = {
  key: 'errPhotoHeic' | 'errPhotoType' | 'errPhotoTooLarge'
  values: Record<string, string>
}

export function validatePhoto(file: File): PhotoProblem | null {
  if (KNOWN_UNSUPPORTED.has(file.type)) {
    return { key: 'errPhotoHeic', values: { name: file.name } }
  }
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return {
      key: 'errPhotoType',
      values: { name: file.name, type: file.type || 'unknown' },
    }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return {
      key: 'errPhotoTooLarge',
      values: {
        name: file.name,
        size: humanBytes(file.size),
        limit: humanBytes(MAX_PHOTO_BYTES),
      },
    }
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
 * How long a signed photo URL stays valid.
 *
 * This was already the implicit default of signPhotoUrl(); it is named here so
 * the refresh timer in use-signed-photos.ts can be derived from it rather than
 * from a second hard-coded hour that could drift out of step.
 */
export const PHOTO_URL_TTL_SECONDS = 3600

/**
 * Turns a stored path into a temporary viewable URL.
 *
 * The bucket is private, so there is no permanent public URL. Returns null
 * when the path is missing or the signing call is refused (which is what a
 * user would see for a photo that is not theirs).
 */
export async function signPhotoUrl(
  path: string | null,
  expiresInSeconds = PHOTO_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}

/**
 * Signs a whole list of paths in ONE request, preserving order.
 *
 * Why this exists: the thumbnail and the full-size photo in the viewer must be
 * the same URL. Signing them separately would mean two round trips per photo
 * and two independent expiry clocks for the same image. A list of ten photos
 * used to be ten createSignedUrl() calls; it is now one.
 *
 * A path that cannot be signed comes back as null in its own slot rather than
 * collapsing the list, so indexes stay aligned with the caller's paths array.
 */
export async function signPhotoUrls(
  paths: readonly string[],
  expiresInSeconds = PHOTO_URL_TTL_SECONDS,
): Promise<(string | null)[]> {
  if (paths.length === 0) return []

  const { data, error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrls([...paths], expiresInSeconds)

  if (error || !data) return paths.map(() => null)

  // createSignedUrls does not promise input order, so match on path. Supabase
  // returns the requested path back on each row.
  const byPath = new Map<string, string | null>()
  for (const row of data) {
    if (row.path) byPath.set(row.path, row.signedUrl ?? null)
  }
  return paths.map((path) => byPath.get(path) ?? null)
}

/** Deletes photo objects from the bucket. Returns an error message, or null. */
export async function removeVehiclePhotos(
  paths: readonly string[],
): Promise<string | null> {
  if (paths.length === 0) return null
  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .remove([...paths])
  return error ? error.message : null
}
