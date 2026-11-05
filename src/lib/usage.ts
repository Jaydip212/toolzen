/**
 * Local usage memory: favourites and recently used tools.
 *
 * Everything here lives in the visitor's browser (localStorage) and never
 * leaves it — no account, no server, no sync. Only registry tool ids are
 * stored; never file contents, search text or anything a user typed. All
 * storage access is guarded because private-browsing modes throw on writes.
 */

const FAVORITES_KEY = 'toolzen:favorites'
const RECENT_KEY = 'toolzen:recent'
const RECENT_DISABLED_KEY = 'toolzen:recent-disabled'

/** How many recently used ids are remembered. Deliberately small. */
export const RECENT_LIMIT = 10

export interface RecentEntry {
  id: string
  /** Epoch milliseconds of the most recent visit. */
  at: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (quota, private mode) — favourites simply will not
    // persist, and nothing about that is worth crashing a tool over.
  }
}

// --- Favourites -------------------------------------------------------------

export function getFavorites(): string[] {
  const stored = readJson<unknown>(FAVORITES_KEY, [])
  if (!Array.isArray(stored)) return []
  return stored.filter((entry): entry is string => typeof entry === 'string')
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId)
}

/** Toggle a favourite; returns the new state. */
export function toggleFavorite(toolId: string): boolean {
  const current = getFavorites()
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [...current, toolId]
  writeJson(FAVORITES_KEY, next)
  return next.includes(toolId)
}

export function clearFavorites(): void {
  writeJson(FAVORITES_KEY, [])
}

// --- Recently used ----------------------------------------------------------

export function isRecentDisabled(): boolean {
  try {
    return window.localStorage.getItem(RECENT_DISABLED_KEY) === 'true'
  } catch {
    return false
  }
}

export function setRecentDisabled(disabled: boolean): void {
  try {
    if (disabled) {
      window.localStorage.setItem(RECENT_DISABLED_KEY, 'true')
      window.localStorage.removeItem(RECENT_KEY)
    } else {
      window.localStorage.removeItem(RECENT_DISABLED_KEY)
    }
  } catch {
    // Same story as favourites.
  }
}

/** Record a tool visit, newest first, capped at RECENT_LIMIT. */
export function touchRecent(toolId: string): void {
  if (isRecentDisabled()) return
  const rest = getRecent().filter((entry) => entry.id !== toolId)
  writeJson(RECENT_KEY, [{ id: toolId, at: Date.now() }, ...rest].slice(0, RECENT_LIMIT))
}

export function getRecent(): RecentEntry[] {
  const stored = readJson<unknown>(RECENT_KEY, [])
  if (!Array.isArray(stored)) return []
  return stored.filter(
    (entry): entry is RecentEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as RecentEntry).id === 'string' &&
      typeof (entry as RecentEntry).at === 'number',
  )
}

export function clearRecent(): void {
  writeJson(RECENT_KEY, [])
}

/**
 * Drop entries whose ids are no longer in the registry (or are not live), so
 * the UI never renders a favourite or history row that 404s.
 */
export function filterKnown(ids: string[], knownIds: Set<string>): string[] {
  return ids.filter((id) => knownIds.has(id))
}
