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
