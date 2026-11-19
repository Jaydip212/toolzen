/**
 * PDF-to-Word conversion logic.
 *
 * The text extraction reuses pdfjs's text layer — the same source the
 * PDF-to-Text tool reads from — and the paragraph splitting is shared with
 * the docx builder. What lives here is the mapping from pages to paragraphs
 * and the honest reporting of what was and was not extracted.
 */

/** One page's extracted text, mirroring the structure from pdf-to-text. */
export interface PageText {
  pageNumber: number
  text: string
  items: number
}

/** Why a page has no text. */
export const SCAN_NOTE =
  'Pages with no text layer are almost always scans: they are photographs of writing, and the words exist only as pixels. This tool does not run optical character recognition, because that needs a server-side model and your file stays in this tab.'

/**
 * Join the items of one page into readable text.
 *
 * This mirrors the PDF-to-Text tool's joiner so both tools produce the same
 * text for the same PDF — the only difference is where the text goes next.
 */
export function joinItems(items: Array<{ str: string; hasEOL: boolean }>): string {
  const lines: string[] = []
  let current = ''

  for (const item of items) {
    if (item.str === '') {
      if (!item.hasEOL) continue
      if (current !== '') {
        lines.push(current)
        current = ''
      }
      if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
      continue
    }
    current += item.str
    if (item.hasEOL) {
      lines.push(current)
      current = ''
    }
  }
  if (current !== '') lines.push(current)

  return lines.map((line) => line.replace(/\s+$/, '')).join('\n')
}

/** The full document text, with page breaks between pages. */
export function documentText(pages: PageText[]): string {
  const chunks: string[] = []
  for (const page of pages) {
    if (page.text.trim() !== '') chunks.push(page.text)
  }
  return chunks.join('\n\n')
}

/** Count words the way a reader would. */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

/** A summary line for the result panel. */
export function extractionSummary(pages: PageText[]): string {
  const words = pages.reduce((total, page) => total + countWords(page.text), 0)
  const blank = pages.filter((page) => page.text.trim() === '').length
  const pageLabel = pages.length === 1 ? '1 page' : `${pages.length} pages`
  const summary = `${words === 1 ? '1 word' : `${words} words`} from ${pageLabel}.`
  return blank === 0 ? summary : `${summary} ${blank} page${blank === 1 ? '' : 's'} had no text layer.`
}
