import { detectDelimiter, parseCsv, serializeCsv, CSV_DELIMITERS } from '@/lib/csv'

export { CSV_DELIMITERS, detectDelimiter }

export interface CsvTable {
  headers: string[]
  rows: string[][]
  /** Total data rows in the file, before any display limit. */
  totalRows: number
  columns: number
  delimiter: string
  /** True when `rows` holds fewer rows than the file contains. */
  truncated: boolean
}

export const MAX_DISPLAY_ROWS = 200

/**
 * Parse CSV into a table.
 *
 * The first row becomes the header when `hasHeader` is true; otherwise a
 * synthetic `Column 1…n` header is generated so the table still lines up.
 */
export function viewCsv(
  text: string,
  options: { delimiter?: string; hasHeader?: boolean; maxRows?: number } = {},
): CsvTable {
  const delimiter = options.delimiter && options.delimiter !== 'auto' ? options.delimiter : detectDelimiter(text)
  const parsed = parseCsv(text, delimiter)
  const maxRows = options.maxRows ?? MAX_DISPLAY_ROWS

  if (parsed.length === 0) {
    return { headers: [], rows: [], totalRows: 0, columns: 0, delimiter, truncated: false }
  }

  const hasHeader = options.hasHeader ?? true
  const columns = parsed.reduce((widest, row) => Math.max(widest, row.length), 0)

  const headers = hasHeader
    ? padRow(parsed[0], columns)
    : Array.from({ length: columns }, (_, index) => `Column ${index + 1}`)

  const dataRows = hasHeader ? parsed.slice(1) : parsed
  const visible = dataRows.slice(0, maxRows).map((row) => padRow(row, columns))

  return {
    headers,
    rows: visible,
    totalRows: dataRows.length,
    columns,
    delimiter,
    truncated: dataRows.length > maxRows,
  }
}

function padRow(row: string[], length: number): string[] {
  if (row.length >= length) return row
  return [...row, ...Array.from({ length: length - row.length }, () => '')]
}

/** A human name for a delimiter character. */
export function delimiterName(delimiter: string): string {
  if (delimiter === '\t') return 'Tab'
  if (delimiter === ';') return 'Semicolon'
  if (delimiter === '|') return 'Pipe'
  if (delimiter === ',') return 'Comma'
  return `“${delimiter}”`
}

/** Classify a cell so the table can right-align numbers. */
export function cellType(value: string): 'empty' | 'number' | 'date' | 'text' {
  const trimmed = value.trim()
  if (trimmed === '') return 'empty'
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return 'number'
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/.test(trimmed)) return 'date'
  return 'text'
}

/** Re-serialise the parsed table, so the download is normalised. */
export function normalisedCsv(table: CsvTable): string {
  return serializeCsv([table.headers, ...table.rows], table.delimiter)
}

/** A one-line summary of the table's shape. */
export function describeTable(table: CsvTable): string {
  if (table.totalRows === 0) return 'No data rows.'
  return `${table.totalRows} row${table.totalRows === 1 ? '' : 's'} × ${table.columns} column${table.columns === 1 ? '' : 's'}`
}
