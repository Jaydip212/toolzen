/**
 * Pure helpers for the Line Sorter.
 *
 * Sorting uses `Intl.Collator`, so alphabetical order is locale-aware and
 * "natural" order puts `file2` before `file10` the way a person expects.
 */

export type SortMode = 'alphabetical' | 'natural' | 'numeric' | 'length'
export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
  mode: SortMode
  direction: SortDirection
  /** When false, case is ignored for ordering and for duplicate detection. */
  caseSensitive: boolean
  removeDuplicates: boolean
  removeEmptyLines: boolean
  /** Trim each line before sorting. */
  trimLines: boolean
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  mode: 'alphabetical',
  direction: 'asc',
  caseSensitive: false,
  removeDuplicates: false,
  removeEmptyLines: false,
  trimLines: false,
}

export interface SortResult {
  text: string
  totalLines: number
  outputLines: number
  removedEmpty: number
  removedDuplicates: number
}

/** Split text into lines, normalising line endings. Empty text has no lines. */
export function splitLines(text: string): string[] {
  if (text === '') return []
  return text.replace(/\r\n?/g, '\n').split('\n')
}

/**
 * Read a line as a number, or `null` when it is not numeric.
 * Thousands separators are accepted; a leading `+` is allowed.
 */
export function numericValue(line: string): number | null {
  const trimmed = line.trim()
  if (trimmed === '') return null
  const normalised = trimmed.replace(/,/g, '')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(normalised)) return null
  const value = Number(normalised)
  return Number.isFinite(value) ? value : null
}

/** Build the collator used for alphabetical and natural ordering. */
function makeCollator(options: SortOptions): Intl.Collator {
  return new Intl.Collator(undefined, {
    numeric: options.mode === 'natural',
    sensitivity: options.caseSensitive ? 'variant' : 'base',
  })
}

/** Compare two lines, assuming neither has been filtered out. */
function compare(
  a: string,
  b: string,
  options: SortOptions,
  collator: Intl.Collator,
): number {
  if (options.mode === 'length') {
    return a.length - b.length || collator.compare(a, b)
  }
  if (options.mode === 'numeric') {
    const left = numericValue(a)
    const right = numericValue(b)
    // Both non-numeric at this point; fall back to text order.
    if (left === null || right === null) return collator.compare(a, b)
    return left - right
  }
  return collator.compare(a, b)
}

/** Sort the lines of `input` according to the supplied options. */
export function sortLines(input: string, options: SortOptions = DEFAULT_SORT_OPTIONS): SortResult {
  let lines = splitLines(input)
  const totalLines = lines.length

  if (options.trimLines) lines = lines.map((line) => line.trim())

  let removedEmpty = 0
  if (options.removeEmptyLines) {
    const before = lines.length
    lines = lines.filter((line) => line.trim() !== '')
    removedEmpty = before - lines.length
  }

  let removedDuplicates = 0
  if (options.removeDuplicates) {
    const seen = new Set<string>()
    const unique: string[] = []
    for (const line of lines) {
      const key = options.caseSensitive ? line : line.toLowerCase()
      if (seen.has(key)) {
        removedDuplicates += 1
        continue
      }
      seen.add(key)
      unique.push(line)
    }
    lines = unique
  }

  const collator = makeCollator(options)
  const direction = options.direction === 'desc' ? -1 : 1

  lines.sort((a, b) => {
    // Non-numeric lines always sink to the bottom in numeric mode, so the
    // direction setting never buries the numbers among the labels.
    if (options.mode === 'numeric') {
      const aNull = numericValue(a) === null
      const bNull = numericValue(b) === null
      if (aNull !== bNull) return aNull ? 1 : -1
    }
    return compare(a, b, options, collator) * direction
  })

  return {
    text: lines.join('\n'),
    totalLines,
    outputLines: lines.length,
    removedEmpty,
    removedDuplicates,
  }
}
