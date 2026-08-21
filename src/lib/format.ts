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

/**
 * Formats a bare `date` column (YYYY-MM-DD), which has no time and no zone.
 *
 * NOT the same as formatDate(): `new Date('2026-01-15')` is parsed as UTC
 * midnight, so west of Greenwich it renders as the 14th. The 0013 columns
 * (auction_date, departure_date, …) are all bare dates, and an auction date
 * that shifts by a day depending on where the customer is standing is a bug.
 * Splitting the string and building a local date sidesteps the zone entirely.
 */
export function formatDateOnly(
  value: string | null | undefined,
  fallback = EM_DASH,
): string {
  if (!value) return fallback
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  // Anything that is not a bare date (a full timestamp, say) goes the old way.
  if (!match) return formatDate(value, fallback)

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString(currentIntlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Formats a timestamptz string as a date AND time, for registration stamps. */
export function formatDateTime(
  value: string | null | undefined,
  fallback = EM_DASH,
): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleString(currentIntlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * What the customer still owes on one vehicle.
 *
 * Computed, never stored -- a `debt` column would drift out of step with the
 * two columns it is derived from. Clamped at zero per vehicle: overpaying one
 * car must not silently cancel out the debt on another. This mirrors the same
 * `greatest(..., 0)` rule the admin_overview_stats() RPC uses in SQL.
 */
export function vehicleDebt(vehicle: {
  total_amount: number | null
  paid: number | null
}): number {
  const total = Number(vehicle.total_amount ?? 0)
  const paid = Number(vehicle.paid ?? 0)
  if (Number.isNaN(total) || Number.isNaN(paid)) return 0
  return Math.max(total - paid, 0)
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

/**
 * The same three parts in the order the reference "My Cars" table uses:
 * year, then model, then manufacturer -- "2019 Equinox CHEVROLET".
 *
 * Deliberately separate from vehicleTitle() rather than replacing it: the rest
 * of the app reads "2019 CHEVROLET Equinox", and quietly reordering it
 * everywhere would be a change nobody asked for. Used only on the My Cars page.
 */
export function carLabel(vehicle: {
  year: number | null
  make: string | null
  model: string | null
}): string {
  const parts = [
    vehicle.year === null ? null : String(vehicle.year),
    vehicle.model,
    vehicle.make,
  ].filter((part): part is string => {
    return part !== null && part.trim() !== ''
  })
  return parts.length > 0 ? parts.join(' ') : i18n.t('vehicles:untitled')
}
