/**
 * Text matching for the option pickers.
 *
 * The calculator used to rely on the Select primitive's built-in typeahead,
 * which is prefix-only and resets on a timer -- that is what made "AL" find
 * Alabama sometimes and Louisiana other times. Everything here is a pure
 * function of (haystack, query) so the same input always produces the same
 * result.
 */

/**
 * Lowercases, strips diacritics and collapses whitespace.
 *
 * NFD splits "á" into "a" + U+0301, and the range below removes the combining
 * marks, so "Anchorage" and "Ánchoráge" normalise to the same string. Azeri
 * and Russian labels go through the same path, which is why this is a general
 * normaliser rather than an ASCII fold.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * True when every whitespace-separated term in `query` appears somewhere in
 * one of the `fields`. Substring, not prefix: "lab" finds Alabama, and so
 * does "AL" -- matched against the state code field.
 *
 * Multi-term is deliberate: "birm al" finds the Birmingham branch in Alabama
 * without the user having to guess the field order.
 */
export function matchesQuery(fields: readonly string[], query: string): boolean {
  const normalizedQuery = normalizeForSearch(query)
  if (normalizedQuery === '') return true

  const haystack = fields.map(normalizeForSearch).join(' ')
  return normalizedQuery
    .split(' ')
    .every((term) => term === '' || haystack.includes(term))
}

/** Fixed collator: alphabetical order must not depend on the user's locale. */
const collator = new Intl.Collator('en')

/**
 * How well one option matches the query. Lower is better.
 *
 *   0  no query -- everything ranks equal (the alphabetical tiebreak applies)
 *   1  exact match on the value (the state CODE for states; the branch name
 *      itself for branches, which have no code)
 *   2  the label starts with the query ("Alab" -> Alabama)
 *   3  a word inside the label starts with the query
 *   4  the query appears anywhere in the label ("al" inside California)
 *   5  matches, but only through another field or term combination
 *      (multi-term queries like "birm al", or a code substring) -- matched
 *      entries that miss tiers 1-4 land here rather than dropping off the list
 *   6  does not match at all -- the combobox filter will drop it
 *
 * Tiers 1-4 compare the WHOLE query against the whole label. A multi-term
 * query therefore naturally falls to tier 5, which is fine: it still matches
 * (matchesQuery is untouched) and still appears, just after the direct hits.
 */
export function matchTier(
  fields: { label: string; value: string; code: string },
  query: string,
): number {
  const q = normalizeForSearch(query)
  if (q === '') return 0

  const value = normalizeForSearch(fields.value)
  const label = normalizeForSearch(fields.label)

  if (value !== '' && value === q) return 1
  if (label.startsWith(q)) return 2
  if (label.split(' ').some((word) => word.startsWith(q))) return 3
  if (label.includes(q)) return 4
  if (matchesQuery([fields.label, fields.value, fields.code], query)) return 5
  return 6
}

/**
 * Returns a NEW array sorted best-match-first: tier ascending, then
 * alphabetical by label, then by value, so identical input always yields the
 * identical order. Non-matching entries sink to the bottom -- the combobox
 * filter removes them from the rendered list, but keeping them in the array
 * leaves `items` total and deterministic.
 */
export function rankOptions<T extends { label: string; value: string; code: string }>(
  items: readonly T[],
  query: string,
): T[] {
  return [...items].sort((a, b) => {
    const tierA = matchTier(a, query)
    const tierB = matchTier(b, query)
    if (tierA !== tierB) return tierA - tierB
    const byLabel = collator.compare(a.label, b.label)
    if (byLabel !== 0) return byLabel
    return collator.compare(a.value, b.value)
  })
}
