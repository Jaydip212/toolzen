/**
 * Pure discovery helpers for the Phase 8 UI pass.
 *
 * All honest-data rules live here so the UI cannot accidentally claim a
 * popularity ranking, an invented usage number, or a guide that does not
 * belong to a category. Kept dependency-free and unit-testable.
 */

/** Hero badge text, derived from the real live-tool count. */
export function heroBadgeLabel(liveCount: number): string {
  return `${liveCount} free online tools`
}

/** Category section summary, derived from the real category count. */
export function collectionSummary(categoryCount: number): string {
  const word = categoryCount === 1 ? 'collection' : 'collections'
  return `${categoryCount} focused ${word} covering documents, media, code, security, calculations and everyday productivity.`
}

/**
 * Tools to show in the visitor's personal section.
 * Favourites come first, then recent visits; unknown ids are dropped, and the
 * list never exceeds `limit`. No popularity data is invented here — recents
 * are the visitor's own, from localStorage.
 */
export function personalToolIds(
  favorites: string[],
  recent: string[],
  knownLiveIds: Set<string>,
  limit = 4,
): string[] {
  const result: string[] = []
  for (const id of [...favorites, ...recent]) {
    if (!knownLiveIds.has(id) || result.includes(id)) continue
    result.push(id)
    if (result.length >= limit) break
  }
  return result
}

/** Guides genuinely connected to a category, via their linked tool ids. */
export function guidesForCategory<T extends { toolIds: string[] }>(
  guides: T[],
  categoryToolIds: Set<string>,
  limit = 3,
): T[] {
  return guides
    .filter((guide) => guide.toolIds.some((id) => categoryToolIds.has(id)))
    .slice(0, limit)
}

/** Light, deterministic search over a tool-shaped list, used by category pages. */
export function filterToolsByQuery<T extends { name: string; description: string; keywords?: string[] }>(
  tools: T[],
  query: string,
): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return tools
  return tools.filter((tool) => {
    const haystack = `${tool.name} ${tool.description} ${(tool.keywords ?? []).join(' ')}`.toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

/** Related categories, ordered by how many live tools they hold (honest data). */
export function relatedCategories<T extends { id: string }>(
  categories: T[],
  currentId: string,
  countOf: (id: string) => number,
  limit = 4,
): T[] {
  return categories
    .filter((category) => category.id !== currentId)
    .sort((a, b) => countOf(b.id) - countOf(a.id) || a.id.localeCompare(b.id))
    .slice(0, limit)
}
