/**
 * Presentation decisions for a PDF's metadata.
 *
 * The tool reads what the document's information dictionary says. When a field
 * is missing, that is reported as missing — a PDF with no author is a fact
 * about the file, not a gap to fill with a guess.
 */

/** A field read from the document, ready to display. */
export interface MetadataRow {
  label: string
  value: string
  /** True when the document does not state this field. */
  missing: boolean
}

/** The raw values the reader can extract, before presentation. */
export interface RawMetadata {
  title: string | null
  author: string | null
  subject: string | null
  keywords: string | null
  producer: string | null
  creator: string | null
  creationDate: Date | null
  modificationDate: Date | null
  pageCount: number
  /** Whether the file carries an XMP packet, which pdf-lib does not read. */
  hasXmp: boolean
  /** Document-level permissions as reported by the reader, e.g. "Printing: no". */
  permissions: string[]
}

const NOT_STATED = 'not stated in the document'

/** Turn the raw values into display rows, marking the missing ones. */
export function toRows(raw: RawMetadata): MetadataRow[] {
  const rows: MetadataRow[] = []
  const add = (label: string, value: string | null) => {
    const empty = value === null || value.trim() === ''
    rows.push({ label, value: empty ? NOT_STATED : (value as string), missing: empty })
  }

  add('Title', raw.title)
  add('Author', raw.author)
  add('Subject', raw.subject)
  add('Keywords', raw.keywords)
  add('Producer', raw.producer)
  add('Creator', raw.creator)
  add('Created', raw.creationDate ? formatDate(raw.creationDate) : null)
  add('Modified', raw.modificationDate ? formatDate(raw.modificationDate) : null)

  return rows
}

/**
 * Format a PDF date for display.
 *
 * The PDF date format begins "D:20240307142231" and carries no timezone, so
 * the wall clock reading is shown as-is rather than being presented as a UTC
 * instant. A date with an offset attached states that offset separately.
 */
export function formatDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** A line summarising the document, e.g. "12 pages, 5 of 8 fields stated". */
export function metadataSummary(rows: MetadataRow[], pageCount: number): string {
  const stated = rows.filter((row) => !row.missing).length
  const pages = pageCount === 1 ? '1 page' : `${pageCount} pages`
  return `${pages}, ${stated} of ${rows.length} fields stated.`
}

/** Why a field being missing is not a failure of the tool. */
export const MISSING_NOTE =
  'Fields marked “not stated in the document” are absent from the file itself. A PDF written by a tool that never set an author has no author to show, and nothing here invents one.'

/**
 * What the reader cannot see.
 *
 * XMP metadata lives in a separate packet, and permissions are advisory flags
 * that a viewer may ignore. Both are stated so the report is not mistaken for
 * a complete audit of the file.
 */
export const SCOPE_NOTE =
  'This reads the document information dictionary. An XMP metadata packet is reported as present or absent but is not decoded here, and permission flags are advisory — a viewer may still respect or ignore them.'

/** Whether the file has any metadata at all, for the empty-state message. */
export function isEmptyMetadata(rows: MetadataRow[]): boolean {
  return rows.every((row) => row.missing)
}
