import { serializeCsv } from '@/lib/csv'

export interface JsonToCsvResult {
  csv: string
  error: string | null
  rows: number
  columns: number
}

/**
 * Turn a JSON array into CSV.
 *
 * Accepted shapes: an array of objects (keys become the header), an array of
 * arrays, or a single object (treated as one row). Nested objects and arrays
 * are serialised as JSON inside the cell rather than being silently flattened,
 * because flattening invents column names the user did not choose.
 */
export function jsonToCsv(
  text: string,
  options: { delimiter?: string; header?: boolean } = {},
): JsonToCsvResult {
  const delimiter = options.delimiter ?? ','
  const includeHeader = options.header ?? true
  const empty: JsonToCsvResult = { csv: '', error: null, rows: 0, columns: 0 }

  const trimmed = text.trim()
  if (trimmed === '') return empty

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ...empty, error: `That is not valid JSON. ${message}` }
  }

  const records = Array.isArray(parsed) ? parsed : [parsed]
  if (records.length === 0) return empty

  if (records.every((record) => Array.isArray(record))) {
    const rows = records as unknown[][]
    const columns = rows.reduce((widest, row) => Math.max(widest, row.length), 0)
    const cells = rows.map((row) => padRow(row.map(toCell), columns))
    const output = includeHeader
      ? [Array.from({ length: columns }, (_, index) => `column_${index + 1}`), ...cells]
      : cells
    return {
      csv: serializeCsv(output, delimiter),
      error: null,
      rows: cells.length,
      columns,
    }
  }

  if (!records.every((record) => record !== null && typeof record === 'object' && !Array.isArray(record))) {
    return {
      ...empty,
      error:
        'Expected an array of objects, an array of arrays, or a single object. The top-level value is a scalar or mixes shapes.',
    }
  }

  const objects = records as Array<Record<string, unknown>>
  // Preserve first-seen key order across every record, not just the first.
  const columns: string[] = []
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!columns.includes(key)) columns.push(key)
    }
  }

  const rows = objects.map((object) => columns.map((key) => toCell(object[key])))
  const output = includeHeader ? [columns, ...rows] : rows

  return {
    csv: serializeCsv(output, delimiter),
    error: null,
    rows: rows.length,
    columns: columns.length,
  }
}

function padRow(row: string[], length: number): string[] {
  if (row.length >= length) return row
  return [...row, ...Array.from({ length: length - row.length }, () => '')]
}

/** Render one JSON value as a CSV cell. */
export function toCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/** The distinct keys across a JSON array of objects, in first-seen order. */
export function collectKeys(records: Array<Record<string, unknown>>): string[] {
  const keys: string[] = []
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!keys.includes(key)) keys.push(key)
    }
  }
  return keys
}
