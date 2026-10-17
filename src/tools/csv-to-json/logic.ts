import { csvToObjects, detectDelimiter, parseCsv } from '@/lib/csv'

export { detectDelimiter }

export type CsvJsonMode = 'objects' | 'arrays'

export interface CsvToJsonResult {
  json: string
  error: string | null
  rows: number
  columns: number
  delimiter: string
}

/**
 * Convert CSV to JSON.
 *
 * In `objects` mode the first row supplies the keys. A duplicate header would
 * silently overwrite data, so duplicates are renamed `name`, `name_2`, … and
 * the tool reports that it did so.
 */
export function csvToJson(
  text: string,
  options: { mode?: CsvJsonMode; delimiter?: string; pretty?: boolean } = {},
): CsvToJsonResult {
  const mode = options.mode ?? 'objects'
  const delimiter = options.delimiter && options.delimiter !== 'auto' ? options.delimiter : detectDelimiter(text)
  const parsed = parseCsv(text, delimiter)
  const empty: CsvToJsonResult = { json: '', error: null, rows: 0, columns: 0, delimiter }

  if (parsed.length === 0) return empty

  const columns = parsed.reduce((widest, row) => Math.max(widest, row.length), 0)

  if (mode === 'arrays') {
    const data = parsed.map((row) => padRow(row, columns))
    return {
      json: JSON.stringify(data, null, options.pretty === false ? undefined : 2),
      error: null,
      rows: data.length,
      columns,
      delimiter,
    }
  }

  if (parsed.length < 2) {
    return {
      ...empty,
      columns,
      error: 'Object mode needs a header row plus at least one data row. The input has only one row.',
    }
  }

  const headers = uniqueHeaders(parsed[0])
  const rows = parsed.slice(1).map((row) => padRow(row, headers.length))
  const objects = csvToObjects([headers, ...rows])

  return {
    json: JSON.stringify(objects, null, options.pretty === false ? undefined : 2),
    error: null,
    rows: rows.length,
    columns: headers.length,
    delimiter,
  }
}

function padRow(row: string[], length: number): string[] {
  if (row.length >= length) return row
  return [...row, ...Array.from({ length: length - row.length }, () => '')]
}

/**
 * Make header names unique and non-empty.
 *
 * An empty header becomes `column_N`; a repeat gets a numeric suffix. Without
 * this, `csvToObjects` would overwrite the earlier value.
 */
export function uniqueHeaders(raw: string[]): string[] {
  const seen = new Map<string, number>()
  return raw.map((header, index) => {
    const base = header.trim() === '' ? `column_${index + 1}` : header.trim()
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}_${count + 1}`
  })
}

/** Headers that had to be renamed, for a warning in the UI. */
export function renamedHeaders(raw: string[]): Array<{ from: string; to: string }> {
  const unique = uniqueHeaders(raw)
  const changes: Array<{ from: string; to: string }> = []
  raw.forEach((header, index) => {
    if (unique[index] !== header) changes.push({ from: header, to: unique[index] })
  })
  return changes
}

/** Byte length of the produced JSON. */
export function jsonSize(json: string): number {
  return new TextEncoder().encode(json).length
}
