/**
 * CSV parsing and serialisation following RFC 4180.
 *
 * Handles quoted fields, escaped double quotes (`""`), embedded newlines and
 * CRLF line endings, so spreadsheets round-trip without corruption.
 */

/** Delimiters offered by the CSV tools. */
export const CSV_DELIMITERS = [
  { id: ',', label: 'Comma ( , )' },
  { id: ';', label: 'Semicolon ( ; )' },
  { id: '\t', label: 'Tab ( \\t )' },
  { id: '|', label: 'Pipe ( | )' },
] as const

export type CsvDelimiter = (typeof CSV_DELIMITERS)[number]['id']

/**
 * Parse CSV text into a grid of strings.
 * Every row has the same length; short rows are padded with empty strings.
 */
export function parseCsv(input: string, delimiter: string = ','): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []

  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  while (index < text.length) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      index += 1
      continue
    }
    if (char === delimiter) {
      endField()
      index += 1
      continue
    }
    if (char === '\r') {
      if (text[index + 1] === '\n') index += 1
      endRow()
      index += 1
      continue
    }
    if (char === '\n') {
      endRow()
      index += 1
      continue
    }

    field += char
    index += 1
  }

  // Flush the final field/row unless the input ended on a line break.
  if (field.length > 0 || row.length > 0) endRow()

  const width = rows.reduce((max, current) => Math.max(max, current.length), 0)
  return rows.map((current) =>
    current.length === width ? current : [...current, ...Array(width - current.length).fill('')],
  )
}

/** Quote a single cell only when it contains something that needs escaping. */
function formatCell(value: unknown, delimiter: string): string {
  const text = value === null || value === undefined ? '' : String(value)
  const needsQuotes =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    /^\s|\s$/.test(text)
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text
}

/** Serialise a grid of values back to CSV text with CRLF line endings. */
export function serializeCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>, delimiter = ','): string {
  return rows
    .map((row) => row.map((cell) => formatCell(cell, delimiter)).join(delimiter))
    .join('\r\n')
}

/** Turn a parsed grid into objects keyed by the first row. */
export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return []
  const [header, ...body] = rows
  return body.map((row) => {
    const record: Record<string, string> = {}
    header.forEach((key, index) => {
      // De-duplicate blank or repeated headers so no column is lost.
      const safeKey = key.trim() === '' ? `column_${index + 1}` : key
      record[safeKey] = row[index] ?? ''
    })
    return record
  })
}

/** Turn objects back into a grid, using the union of all keys as the header. */
export function objectsToCsv(records: Record<string, unknown>[]): string[][] {
  const header: string[] = []
  const seen = new Set<string>()
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key)
        header.push(key)
      }
    }
  }
  const body = records.map((record) =>
    header.map((key) => {
      const value = record[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }),
  )
  return [header, ...body]
}

/** Guess the delimiter by counting candidates on the first line. */
export function detectDelimiter(input: string): string {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? ''
  let best = ','
  let bestCount = 0
  for (const { id } of CSV_DELIMITERS) {
    const count = firstLine.split(id).length - 1
    if (count > bestCount) {
      best = id
      bestCount = count
    }
  }
  return best
}
