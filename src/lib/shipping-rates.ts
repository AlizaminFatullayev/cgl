import { supabase } from '@/lib/supabase'
import type { ShippingRate } from '@/types/database'

export interface StateOption {
  code: string
  name: string
}

export interface BranchOption {
  branch: string
  rate: number
}

/**
 * Loads the whole rate table in one go.
 *
 * shipping_rates is small (a few hundred rows) and world-readable, so a
 * single fetch is cheaper than a round trip per dropdown. Rates always come
 * from here -- never hardcode one in the UI.
 */
export async function fetchShippingRates(): Promise<{
  rates: ShippingRate[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('id, state_code, state_name, branch, rate')
    .order('state_name', { ascending: true })
    .order('branch', { ascending: true })
    .returns<ShippingRate[]>()

  if (error) return { rates: [], error: error.message }
  return { rates: data ?? [], error: null }
}

/** Distinct states, ignoring rows with no usable state_code. */
export function deriveStates(rates: ShippingRate[]): StateOption[] {
  const byCode = new Map<string, string>()
  for (const rate of rates) {
    const code = rate.state_code?.trim()
    if (!code) continue
    const name = rate.state_name?.trim()
    // Keep the first non-empty name seen for this code.
    if (!byCode.has(code) || (byCode.get(code) === code && name)) {
      byCode.set(code, name && name !== '' ? name : code)
    }
  }
  return [...byCode.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Branches available in one state, with their rate.
 *
 * Rows without a usable rate are dropped: showing a branch that cannot
 * produce a price would be worse than not offering it.
 */
export function deriveBranches(
  rates: ShippingRate[],
  stateCode: string,
): BranchOption[] {
  const byBranch = new Map<string, number>()
  for (const rate of rates) {
    if (rate.state_code?.trim() !== stateCode) continue
    if (rate.rate === null || rate.rate === undefined) continue
    const branch = rate.branch?.trim()
    if (!branch) continue
    if (!byBranch.has(branch)) byBranch.set(branch, rate.rate)
  }
  return [...byBranch.entries()]
    .map(([branch, rate]) => ({ branch, rate }))
    .sort((a, b) => a.branch.localeCompare(b.branch))
}
