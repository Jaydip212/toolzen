/**
 * Word-to-PDF conversion logic.
 *
 * A .docx file is a ZIP containing XML parts. The text lives in
 * word/document.xml, where paragraphs are `<w:p>` elements and runs within
 * them are `<w:r>` elements containing `<w:t>` text nodes.
 *
 * This module parses that structure with the browser's DOMParser — not a
 * streaming parser — because a .docx from a word processor is typically a few
 * hundred kilobytes, and the DOM is both correct and readable.
 *
 * What is preserved: paragraphs and line breaks within them. What is not:
 * fonts, colours, bold, italic, headings, tables, images, headers, footers,
 * footnotes, columns and page breaks. The tool states this rather than
 * pretending to be a layout engine.
 */

/** A paragraph extracted from the document, split into lines. */
export interface WordParagraph {
  lines: string[]
}

/** The text of every paragraph, in document order. */
export function extractParagraphs(documentXml: string): WordParagraph[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(documentXml, 'application/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    throw new Error('The document XML could not be parsed. The file may be corrupted.')
  }

  // Namespace queries use a prefix wildcard because the `w:` prefix is
  // conventional but not mandatory — some writers use a different prefix.
  const paragraphs = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p')
  const result: WordParagraph[] = []

  for (let i = 0; i < paragraphs.length; i += 1) {
    const para = paragraphs[i]!
    const lines = paragraphLines(para)
    result.push({ lines })
  }

  return result
}

/**
 * Extract the lines from one paragraph.
 *
 * A paragraph is a sequence of runs (`<w:r>`). Each run can contain text
 * (`<w:t>`) and break elements (`<w:br/>`). A break starts a new line within
 * the same paragraph, so the text between breaks becomes one line.
 */
function paragraphLines(para: Element): string[] {
  const wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const runs = para.getElementsByTagNameNS(wNs, 'r')
  // Also handle text that is directly in the paragraph without a run wrapper,
  // which some minimal docx generators produce.
  const directText = para.getElementsByTagNameNS(wNs, 't')

  const segments: string[] = []
  let currentLine = ''

  // Walk runs in order, collecting text and watching for breaks.
  const allRuns = [...Array.from(runs)]
  if (allRuns.length === 0 && directText.length > 0) {
    // No runs — gather text nodes directly under the paragraph.
    for (let i = 0; i < directText.length; i += 1) {
      currentLine += directText[i]!.textContent ?? ''
    }
    if (currentLine !== '') segments.push(currentLine)
    return segments.length > 0 ? segments : ['']
  }

  for (const run of allRuns) {
    const children = [...run.childNodes]
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element
        if (el.localName === 'br') {
          segments.push(currentLine)
          currentLine = ''
        } else if (el.localName === 't' || el.localName === 'tab') {
          const text = el.localName === 'tab' ? '\t' : (el.textContent ?? '')
          currentLine += text
        }
      }
    }
  }
  segments.push(currentLine)

  // Filter trailing empty line caused by a break at the end.
  if (segments.length > 1 && segments[segments.length - 1] === '') {
    segments.pop()
  }

  return segments.length > 0 ? segments : ['']
}

/** Flatten paragraphs into plain text for display and PDF building. */
export function paragraphsAsText(paragraphs: WordParagraph[]): string {
  return paragraphs
    .map((para) => para.lines.join('\n'))
    .join('\n\n')
}

/** Count words across all paragraphs. */
export function countWords(paragraphs: WordParagraph[]): number {
  const text = paragraphsAsText(paragraphs)
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

/** The .docx magic bytes, checked before unzipping. */
const DOCX_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

/** Whether bytes start with the ZIP signature a .docx must have. */
export function isDocxFile(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  return (
    bytes[0] === DOCX_SIGNATURE[0] &&
    bytes[1] === DOCX_SIGNATURE[1] &&
    bytes[2] === DOCX_SIGNATURE[2] &&
    bytes[3] === DOCX_SIGNATURE[3]
  )
}

/** The PDF output filename for a Word-to-PDF conversion. */
export function pdfName(docxName: string): string {
  const dot = docxName.lastIndexOf('.')
  const stem = dot > 0 ? docxName.slice(0, dot) : docxName
  return `${stem}.pdf`
}

/**
 * Characters the standard PDF fonts can draw.
 *
 * Re-declared here rather than imported from text-to-pdf so this module is
 * self-contained and testable without pulling in the text-to-pdf tool.
 */
const WIN_ANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
])

/** Whether a code point can be drawn in a standard PDF font. */
function isEncodable(codePoint: number): boolean {
  if (codePoint === 0x0a || codePoint === 0x0d) return true
  if (codePoint < 0x20 || codePoint === 0x7f) return false
  if (codePoint <= 0xff) return true
  return WIN_ANSI_EXTRAS.has(codePoint)
}

/** List unsupported characters, each once, in order of first appearance. */
export function unsupportedCharacters(text: string): string[] {
  const found: string[] = []
  const seen = new Set<number>()
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0
    if (isEncodable(codePoint) || seen.has(codePoint)) continue
    seen.add(codePoint)
    found.push(character)
  }
  return found
}

/** An error message for unsupported characters, or null when all are drawable. */
export function encodingError(text: string): string | null {
  const bad = unsupportedCharacters(text)
  if (bad.length === 0) return null
  const shown = bad.slice(0, 8)
  const listed = shown
    .map((c) => `“${c}” (U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')})`)
    .join(', ')
  const rest = bad.length - shown.length
  const more = rest === 0 ? '' : rest === 1 ? ' and 1 more character' : ` and ${rest} more characters`
  return (
    `The PDF fonts cannot draw ${listed}${more}. ` +
    'That usually means a non-Latin script or an emoji. Those characters will be skipped in the PDF.'
  )
}
