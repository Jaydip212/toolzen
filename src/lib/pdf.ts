/**
 * PDF plumbing shared by the PDF tools.
 *
 * Two rules run through this file:
 *
 *  1. Everything happens in the browser. `pdf-lib` reads, edits and writes the
 *     document; nothing is uploaded.
 *  2. Failures are named. A PDF that is encrypted, or a page range that does
 *     not exist, produces a sentence saying exactly which, rather than a
 *     generic error or a silently empty output.
 */

import { PDFDocument } from 'pdf-lib'

/** The magic bytes every PDF starts with. */
const PDF_SIGNATURE = '%PDF-'

/** How far into the file the header is allowed to sit, per the PDF spec. */
const HEADER_SEARCH_WINDOW = 1024

export interface PdfHeader {
  ok: boolean
  /** The specification version, e.g. "1.7", when one was found. */
  version: string | null
  /** Why the header was rejected, when it was. */
  error: string | null
}

/**
 * Read the version out of a PDF header.
 *
 * The spec allows the signature to sit up to 1024 bytes in, because some
 * writers prepend junk, but a file without it anywhere in that window is not
 * a PDF and is rejected before the parser sees it.
 */
export function readPdfHeader(bytes: Uint8Array): PdfHeader {
  const limit = Math.min(bytes.length, HEADER_SEARCH_WINDOW)
  let text = ''
  for (let i = 0; i < limit; i += 1) text += String.fromCharCode(bytes[i])
  const at = text.indexOf(PDF_SIGNATURE)
  if (at === -1) {
    return {
      ok: false,
      version: null,
      error: 'This file does not start with a PDF header. It may be a different format, or the upload was incomplete.',
    }
  }
  const version = text.slice(at + PDF_SIGNATURE.length, at + PDF_SIGNATURE.length + 3)
  const normalised = /^[0-9]\.[0-9]$/.test(version) ? version : null
  return {
    ok: true,
    version: normalised,
    error: normalised ? null : 'The header is present but the version number is unusual. Loading may still work.',
  }
}

/** The error pdf-lib raises for an encrypted document. */
export function isEncryptedPdfError(cause: unknown): boolean {
  if (!(cause instanceof Error)) return false
  return /encrypt/i.test(cause.message) || /EncryptedPDFError/.test(cause.name)
}

/**
 * Open a PDF, or explain why it could not be opened.
 *
 * Loading is the one operation that can fail for reasons outside the user's
 * control — an encrypted file, a truncated download — so it returns a message
 * rather than throwing into the UI.
 */
export async function openPdf(
  bytes: Uint8Array,
): Promise<{ ok: true; document: PDFDocument } | { ok: false; error: string }> {
  const header = readPdfHeader(bytes)
  if (!header.ok) {
    return { ok: false, error: header.error ?? 'This file could not be read as a PDF.' }
  }

  try {
    const document = await PDFDocument.load(bytes, { ignoreEncryption: false })
    return { ok: true, document }
  } catch (cause) {
    if (isEncryptedPdfError(cause)) {
      return {
        ok: false,
        error:
          'This PDF is password-protected, and TOOLZEN cannot remove a password in the browser. Open it with the password first, save an unprotected copy, then use that file here.',
      }
    }
    return {
      ok: false,
      error:
        'The PDF could not be read. The file may be damaged, truncated, or use a feature this reader does not support.',
    }
  }
}

/** How many pages a document has. */
export function pageCountOf(document: PDFDocument): number {
  return document.getPageCount()
}

/** Serialise a document to bytes, ready to download. */
export async function savePdf(document: PDFDocument): Promise<Uint8Array> {
  return document.save()
}

/* ------------------------------------------------------------------ */
/* Page ranges                                                         */
/* ------------------------------------------------------------------ */

export interface PageGroup {
  /** The text the user wrote, e.g. "2-5". Also the file-name fragment. */
  label: string
  /** One-based page numbers, in the order the user listed them. */
  pages: number[]
}

export interface RangeParse {
  ok: boolean
  groups: PageGroup[]
  /** Every page mentioned, deduplicated and ascending — for previews. */
  selected: number[]
  error: string | null
}

/**
 * Parse a page specification such as `1-3, 7, 9-` into groups.
 *
 * Each comma-separated part becomes one group, which is what a split needs.
 * The same groups flatten into `selected` for tools that work on the whole
 * set, such as extract and delete.
 *
 * Rejected, with a reason: empty input, a start after an end, a page number
 * of zero, and any page beyond the document's length.
 */
export function parsePageGroups(input: string, pageCount: number): RangeParse {
  const trimmed = input.trim()
  const fail = (error: string): RangeParse => ({ ok: false, groups: [], selected: [], error })

  if (!trimmed) return fail('Enter at least one page or range, for example 1-3, 7, 9.')
  if (pageCount < 1) return fail('This PDF has no pages to select.')

  const parts = trimmed.split(',').map((part) => part.trim())
  const groups: PageGroup[] = []
  const seen = new Set<number>()

  for (const part of parts) {
    if (!part) return fail('There is an empty part in that specification. Check for a doubled comma.')

    const label = part
    let start: number
    let end: number

    if (part.endsWith('-') && !part.startsWith('-')) {
      // "4-" means from 4 to the last page.
      start = Number(part.slice(0, -1))
      end = pageCount
    } else if (part.startsWith('-')) {
      // "-3" means from the first page to 3.
      start = 1
      end = Number(part.slice(1))
    } else if (part.includes('-')) {
      const [from, to] = part.split('-')
      start = Number(from)
      end = Number(to)
    } else {
      start = Number(part)
      end = start
    }

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return fail(`“${part}” is not a page number or a range. Use digits, for example 2 or 2-5.`)
    }
    if (start < 1 || end < 1) {
      return fail(`Page numbers start at 1, and “${part}” includes 0.`)
    }
    if (start > end) {
      return fail(`“${part}” runs backwards. Write it as ${end}-${start} instead.`)
    }
    if (start > pageCount) {
      return fail(
        `This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}, so it has no page ${start}.`,
      )
    }
    if (end > pageCount) {
      return fail(
        `This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}, so “${part}” runs past the last page.`,
      )
    }

    const pages: number[] = []
    for (let page = start; page <= end; page += 1) {
      pages.push(page)
      seen.add(page)
    }
    groups.push({ label, pages })
  }

  return {
    ok: true,
    groups,
    selected: [...seen].sort((a, b) => a - b),
    error: null,
  }
}

/** Render a list of pages as compact range text, e.g. `1-3, 7`. */
export function formatPageList(pages: number[]): string {
  if (pages.length === 0) return ''
  const sorted = [...pages].sort((a, b) => a - b)
  const runs: Array<[number, number]> = []
  for (const page of sorted) {
    const last = runs[runs.length - 1]
    if (last && page === last[1] + 1) last[1] = page
    else runs.push([page, page])
  }
  return runs.map(([from, to]) => (from === to ? String(from) : `${from}-${to}`)).join(', ')
}

/** The pages of a document that are *not* in the given set. */
export function complementOf(pages: number[], pageCount: number): number[] {
  const skip = new Set(pages)
  const kept: number[] = []
  for (let page = 1; page <= pageCount; page += 1) {
    if (!skip.has(page)) kept.push(page)
  }
  return kept
}

/* ------------------------------------------------------------------ */
/* Naming                                                              */
/* ------------------------------------------------------------------ */

/** A file name fragment for one output document, e.g. `report-p2-5.pdf`. */
export function nameForRange(baseName: string, label: string): string {
  const safe = label.replace(/[^\d-]+/g, '')
  return safe ? `${baseName}-p${safe}.pdf` : `${baseName}-pages.pdf`
}

/** A new file name from an old one, inserting `suffix` before the extension. */
export function withSuffix(fileName: string, suffix: string): string {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  const extension = dot > 0 ? fileName.slice(dot) : '.pdf'
  return `${stem}${suffix}${extension.toLowerCase() === '.pdf' ? '.pdf' : extension}`
}

/** A default name for an output that is not tied to a page range. */
export function outputName(fileName: string, what: string): string {
  return withSuffix(fileName, `-${what}`)
}
