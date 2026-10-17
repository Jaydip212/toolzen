export type IndentStyle = 2 | 4 | 'tab'

export interface JsonError {
  message: string
  /** 1-based line number, when it could be derived. */
  line: number | null
  /** 1-based column number. */
  column: number | null
}

export interface JsonResult {
  ok: boolean
  output: string
  error: JsonError | null
}

export interface JsonStats {
  keys: number
  objects: number
  arrays: number
  depth: number
  bytes: number
  lines: number
}

const INDENTS: Record<string, string> = { '2': '  ', '4': '    ', tab: '\t' }

/** The indent string for a style. */
export function indentString(style: IndentStyle): string {
  return INDENTS[String(style)] ?? '  '
}

/**
 * Turn a `JSON.parse` failure into a line and column.
 *
 * V8 reports `... at position 42` (and newer versions add `line 3 column 5`).
 * Both forms are handled; when neither is present the position is `null`.
 */
export function describeJsonError(error: unknown, text: string): JsonError {
  const message = error instanceof Error ? error.message : String(error)

  const lineColumn = /line (\d+) column (\d+)/i.exec(message)
  if (lineColumn) {
    return { message, line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
  }

  const position = /position (\d+)/i.exec(message)
  if (position) {
    const offset = Math.min(Number(position[1]), text.length)
    const before = text.slice(0, offset)
    const line = before.split('\n').length
    const column = offset - before.lastIndexOf('\n')
    return { message, line, column }
  }

  return { message, line: null, column: null }
}

/** Recursively sort object keys, leaving arrays in their original order. */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    const sorted: Record<string, unknown> = {}
    for (const [key, entry] of entries) sorted[key] = sortKeysDeep(entry)
    return sorted
  }
  return value
}

/** Format JSON with the chosen indent, optionally sorting keys. */
export function formatJson(
  text: string,
  options: { indent?: IndentStyle; sortKeys?: boolean } = {},
): JsonResult {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: true, output: '', error: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    return { ok: false, output: '', error: describeJsonError(error, trimmed) }
  }

  const value = options.sortKeys ? sortKeysDeep(parsed) : parsed
  return { ok: true, output: JSON.stringify(value, null, indentString(options.indent ?? 2)), error: null }
}

/** Remove all insignificant whitespace. */
export function minifyJson(text: string): JsonResult {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: true, output: '', error: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    return { ok: false, output: '', error: describeJsonError(error, trimmed) }
  }

  return { ok: true, output: JSON.stringify(parsed), error: null }
}

/** Validate without producing output. */
export function validateJson(text: string): JsonError | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  try {
    JSON.parse(trimmed)
    return null
  } catch (error) {
    return describeJsonError(error, trimmed)
  }
}

/**
 * Count keys, containers and nesting depth.
 *
 * Depth is the number of nested containers, so `{"a":1}` has depth 1.
 */
export function jsonStats(text: string): JsonStats {
  const bytes = new TextEncoder().encode(text).length
  const lines = text === '' ? 0 : text.split('\n').length
  const empty: JsonStats = { keys: 0, objects: 0, arrays: 0, depth: 0, bytes, lines }

  const trimmed = text.trim()
  if (trimmed === '') return empty

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return empty
  }

  let keys = 0
  let objects = 0
  let arrays = 0

  // `depth` is the level of the container being visited, starting at 1.
  const walk = (value: unknown, depth: number): number => {
    if (Array.isArray(value)) {
      arrays += 1
      let deepest = depth
      for (const entry of value) deepest = Math.max(deepest, walk(entry, depth + 1))
      return deepest
    }
    if (value !== null && typeof value === 'object') {
      objects += 1
      let deepest = depth
      for (const entry of Object.values(value as Record<string, unknown>)) {
        keys += 1
        deepest = Math.max(deepest, walk(entry, depth + 1))
      }
      return deepest
    }
    // A scalar sits one level below its container, so it adds no depth itself.
    return depth - 1
  }

  const depth = walk(parsed, 1)
  return { keys, objects, arrays, depth, bytes, lines }
}

/** A compact one-line description of the root value's type. */
export function describeRoot(text: string): string {
  const trimmed = text.trim()
  if (trimmed === '') return 'empty'
  try {
    const value = JSON.parse(trimmed)
    if (Array.isArray(value)) return `array of ${value.length}`
    if (value === null) return 'null'
    return typeof value
  } catch {
    return 'invalid'
  }
}
