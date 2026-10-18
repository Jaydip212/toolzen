/**
 * Text extraction decisions.
 *
 * pdfjs hands back positioned text items. The decisions here are which of
 * those items are worth keeping, how they become paragraphs, and what the tool
 * says when a page has no text at all — which is the common case for a scan.
 */

/** One item as pdfjs reports it. */
export interface TextItem {
  str: string
  /** Whether the item ended a line in the original layout. */
  hasEOL: boolean
}

/** The result of reading a page's text layer. */
export interface PageText {
  pageNumber: number
  text: string
  /** The number of items pdfjs returned, including the empty ones. */
  items: number
}

/**
 * Join the items of one page into readable text.
 *
 * Items that carry no string and end no line are dropped, because a layout's
 * spacing is often expressed as empty items and keeping them would scatter
 * blank gaps through the output. An empty item that *does* end a line is a
 * line the document drew with nothing on it — a paragraph break — so one blank
 * line is kept, but never two in a row. Line ends are kept where the original
 * had them, so a heading stays on its own line.
 */
export function joinItems(items: TextItem[]): string {
  const lines: string[] = []
  let current = ''

  for (const item of items) {
    if (item.str === '') {
      // A spacer: no text, and no line end either. Skipping it is what keeps
      // one line from becoming two.
      if (!item.hasEOL) continue
      // A line that was drawn empty is a paragraph break the author meant.
      if (current !== '') {
        lines.push(current)
        current = ''
      }
      // Only one blank line, and never a leading one.
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

  // Trailing spaces on each line are invisible and only get in the way when
  // the text is pasted somewhere else.
  return lines.map((line) => line.replace(/\s+$/, '')).join('\n')
}

/** The whole document's text, with a page marker between pages. */
export function documentText(pages: PageText[], withPageMarkers: boolean): string {
  const chunks: string[] = []
  for (const page of pages) {
    if (withPageMarkers) {
      chunks.push(page.text.trim() === '' ? `[Page ${page.pageNumber}]` : `[Page ${page.pageNumber}]\n${page.text}`)
    } else if (page.text.trim() !== '') {
      chunks.push(page.text)
    }
  }
  return chunks.join('\n\n')
}

/** A line describing what was extracted. */
export function extractionSummary(pages: PageText[]): string {
  const words = pages.reduce((total, page) => total + countWords(page.text), 0)
  const blank = pages.filter((page) => page.text.trim() === '').length
  const pageLabel = pages.length === 1 ? '1 page' : `${pages.length} pages`
  const summary = `${wordLabel(words)} from ${pageLabel}.`
  return blank === 0 ? summary : `${summary} ${blank} page${blank === 1 ? '' : 's'} had no text layer.`
}

function wordLabel(words: number): string {
  return words === 1 ? '1 word' : `${words} words`
}

/** Count words the way a reader would, ignoring runs of whitespace. */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

/**
 * Why a page has no text.
 *
 * A scanned page is an image of writing, so there is nothing for the extractor
 * to find. Naming that is more useful than returning an empty file with no
 * explanation, and it is the single most common question this tool gets.
 */
export const SCAN_NOTE =
  'Pages with no text layer are almost always scans: they are photographs of writing, and the words exist only as pixels. This tool does not run optical character recognition, because that needs a server-side model and your file stays in this tab.'

/** The name for the extracted file. */
export function textName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  return `${stem}.txt`
}
