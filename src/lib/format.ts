import i18n from '@/i18n'
import { currentIntlLocale } from '@/i18n/use-locale'

/**
 * Display helpers. Every column on vehicles/profiles is nullable, so raw
 * interpolation would put "null" or "undefined" on screen. These always
 * return a printable string.
 *
 * Dates and numbers follow the active locale. Currency is ALWAYS USD -- the
 * locale changes how an amount is written, never what it is worth. No
 * conversion happens anywhere.
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
  return numeric.toLocaleString(currentIntlLocale(), {
    style: 'currency',
    // USD everywhere -- formatting only, never conversion.
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
  return date.toLocaleDateString(currentIntlLocale(), {
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
  // Year/make/model are user data and are never translated; only the
  // fallback label for a vehicle with none of them is localised.
  return parts.length > 0 ? parts.join(' ') : i18n.t('vehicles:untitled')
}
