import i18n from './index'
import type { VehicleStatus } from '@/types/database'

/**
 * Render-time labels for values that are STORED IN THE DATABASE.
 *
 * ============================ READ THIS ============================
 * The stored value is ALWAYS the English string. These helpers translate for
 * display only, keyed by that English value.
 *
 * vehicles.status is constrained by a CHECK on the exact strings
 * 'At Auction' | 'In Transit' | 'At Port' | 'On Ocean' | 'Delivered', and the
 * guard_vehicle_status trigger compares against them. Putting a translated
 * string into a query, a filter value, an insert, an update or a comparison
 * will break RLS and silently corrupt data.
 *
 * The same rule covers invoice status and role ('user' / 'admin').
 *
 * NOT translated at all, anywhere: shipping_rates.state_name and .branch
 * (US place names), VIN, lot, container and booking numbers.
 * ===================================================================
 */

/** Display label for a stored vehicles.status value. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return i18n.t('common:status.unknown')
  // Key is the stored English value; a miss falls back to showing it raw.
  return i18n.t(`common:status.${status as VehicleStatus}`, {
    defaultValue: status,
  })
}

/** Display label for a stored invoices.status value. */
export function invoiceStatusLabel(status: string | null | undefined): string {
  if (!status) return i18n.t('common:notAvailable')
  return i18n.t(`common:invoiceStatus.${status}`, { defaultValue: status })
}

/** Display label for a stored profiles.role value. */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return i18n.t('common:notAvailable')
  return i18n.t(`common:role.${role}`, { defaultValue: role })
}
