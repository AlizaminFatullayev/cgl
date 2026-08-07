/**
 * Display helpers. Every column on vehicles/profiles is nullable, so raw
 * interpolation would put "null" or "undefined" on screen. These always
 * return a printable string.
 */

const EM_DASH = '—'

/** Renders any nullable text, falling back to an em dash. */
export function displayText(
  value: string | null | undefined,
  fallback = EM_DASH,
): string {
  if (value === null || value === undefined) return fallback
  const trimmed = value.trim()
  return trimmed === '' ? fallback : trimmed
}

/** Renders a nullable number, falling back to an em dash. */
export function displayNumber(
  value: number | null | undefined,
  fallback = EM_DASH,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback
  }
  return String(value)
}

/** Formats a nullable amount as USD. Treats null as unknown, not as zero. */
export function formatCurrency(
  value: number | string | null | undefined,
  fallback = EM_DASH,
): string {
  if (value === null || value === undefined || value === '') return fallback
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return fallback
  return numeric.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

/** Formats a timestamptz string as a short date. */
export function formatDate(
  value: string | null | undefined,
  fallback = EM_DASH,
): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Builds "2021 Toyota Camry" from parts that may each be missing. */
export function vehicleTitle(vehicle: {
  year: number | null
  make: string | null
  model: string | null
}): string {
  const parts = [
    vehicle.year === null ? null : String(vehicle.year),
    vehicle.make,
    vehicle.model,
  ].filter((part): part is string => {
    return part !== null && part.trim() !== ''
  })
  return parts.length > 0 ? parts.join(' ') : 'Untitled vehicle'
}
