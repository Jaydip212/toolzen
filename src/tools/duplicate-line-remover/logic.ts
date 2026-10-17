/**
 * Pure helpers for the Duplicate Line Remover.
 *
 * Duplicates are matched on a comparison key derived from each line, so the
 * tool can optionally ignore letter case and surrounding whitespace.
 */

export interface DedupeOptions {
  /** Treat “Hello” and “hello” as the same line. */
  caseSensitive: boolean
  /** Ignore leading and trailing whitespace when comparing. */
  trimLines: boolean
  /** Never remove blank lines, and never count them as duplicates. */
  ignoreBlankLines: boolean
  /** Keep the first or the last occurrence of each duplicated line. */
  keep: 'first' | 'last'
}

export const DEFAULT_DEDUPE_OPTIONS: DedupeOptions = {
  caseSensitive: true,
  trimLines: false,
  ignoreBlankLines: true,
  keep: 'first',
}

export interface DedupeResult {
  /** The de-duplicated text. */
  text: string
  /** Lines in the input. */
  totalLines: number
  /** Lines in the output. */
  outputLines: number
  /** How many lines were removed. */
  removedCount: number
  /** How many distinct values appeared more than once. */
  duplicateGroups: number
}

/** Split text into lines, normalising line endings. Empty text has no lines. */
export function splitLines(text: string): string[] {
  if (text === '') return []
  return text.replace(/\r\n?/g, '\n').split('\n')
}

/** Remove duplicate lines according to the supplied options. */
export function removeDuplicateLines(
  input: string,
  options: DedupeOptions = DEFAULT_DEDUPE_OPTIONS,
): DedupeResult {
  const lines = splitLines(input)
  const isBlank = (line: string) => line.trim() === ''

  const keyOf = (line: string) => {
    let value = options.trimLines ? line.trim() : line
    if (!options.caseSensitive) value = value.toLowerCase()
    return value
  }

  /** Blank lines that must survive de-duplication. */
  const protectedBlank = (line: string) => options.ignoreBlankLines && isBlank(line)

  const keep = new Set<number>()

  if (options.keep === 'first') {
    const seen = new Set<string>()
    lines.forEach((line, index) => {
      if (protectedBlank(line)) {
        keep.add(index)
        return
      }
      const key = keyOf(line)
      if (!seen.has(key)) {
        seen.add(key)
        keep.add(index)
      }
    })
  } else {
    const lastIndex = new Map<string, number>()
    lines.forEach((line, index) => {
      if (protectedBlank(line)) return
      lastIndex.set(keyOf(line), index)
    })
    lines.forEach((line, index) => {
      if (protectedBlank(line)) {
        keep.add(index)
        return
      }
      if (lastIndex.get(keyOf(line)) === index) keep.add(index)
    })
  }

  const output = lines.filter((_, index) => keep.has(index))

  // Count distinct values that occurred more than once.
  const counts = new Map<string, number>()
  for (const line of lines) {
    if (protectedBlank(line)) continue
    const key = keyOf(line)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const duplicateGroups = [...counts.values()].filter((count) => count > 1).length

  return {
    text: output.join('\n'),
    totalLines: lines.length,
    outputLines: output.length,
    removedCount: lines.length - output.length,
    duplicateGroups,
  }
}
