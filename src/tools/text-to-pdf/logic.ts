/**
 * Text layout decisions for turning plain text into a PDF.
 *
 * The arithmetic is deliberately simple and stated: characters are counted to
 * fit a line, not measured, so the caller knows the wide character caveat
 * before it shows up in the output.
 */

/** The page sizes on offer, in PDF points. */
export const PAGE_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297 mm)', width: 595.28, height: 841.89 },
  { value: 'letter', label: 'US Letter (8.5 × 11 in)', width: 612, height: 792 },
] as const

export type PageSizeId = (typeof PAGE_SIZES)[number]['value']

/** The margin around the text, in points. */
export const MARGIN = 56

/** The body text size, in points. */
export const FONT_SIZE = 11

/** The space between lines, as a multiple of the font size. */
export const LINE_SPACING = 1.35

/** How many characters fit on one line at the given size and page width. */
export function charactersPerLine(pageWidth: number, fontSize = FONT_SIZE): number {
  // The average glyph is roughly half the point size wide for the standard
  // fonts pdf-lib embeds. This is an average, not a measurement.
  const usable = pageWidth - MARGIN * 2
  return Math.max(10, Math.floor(usable / (fontSize * 0.5)))
}

/** How many lines fit on one page. */
export function linesPerPage(pageHeight: number, fontSize = FONT_SIZE): number {
  const usable = pageHeight - MARGIN * 2
  return Math.max(1, Math.floor(usable / (fontSize * LINE_SPACING)))
}

/**
 * Wrap text into lines of at most `width` characters.
 *
 * Long words are broken rather than dropped, because silently discarding a
 * URL in a printed document is worse than an ugly break. Tabs are turned into
 * single spaces, because the font used here cannot draw a tab and would
 * otherwise refuse the line.
 */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.replace(/\t/g, ' ').split(/\r?\n/)) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of paragraph.split(/\s+/)) {
      if (current === '') {
        current = word
      } else if (`${current} ${word}`.length <= width) {
        current = `${current} ${word}`
      } else {
        lines.push(current)
        current = word
      }
      while (current.length > width) {
        lines.push(current.slice(0, width))
        current = current.slice(width)
      }
    }
    lines.push(current)
  }
  return lines
}

/** The lines that go on one page, and which page holds the rest. */
export interface Pagination {
  pages: string[][]
  /** The total number of lines, including any the last page left room for. */
  lineCount: number
}

/** Break wrapped lines into pages. */
export function paginate(lines: string[], perPage: number): Pagination {
  const pages: string[][] = []
  for (let index = 0; index < lines.length; index += perPage) {
    pages.push(lines.slice(index, index + perPage))
  }
  return { pages: pages.length > 0 ? pages : [[]], lineCount: lines.length }
}

/** The full layout for a piece of text on a given page size. */
export function layoutFor(text: string, size: PageSizeId): Pagination & { perLine: number; perPage: number } {
  const page = PAGE_SIZES.find((entry) => entry.value === size) ?? PAGE_SIZES[0]
  const perLine = charactersPerLine(page.width)
  const perPage = linesPerPage(page.height)
  const lines = wrapText(text, perLine)
  return { ...paginate(lines, perPage), perLine, perPage }
}

/** A line describing the result, e.g. "412 words on 2 pages". */
export function layoutSummary(text: string, pagination: Pagination): string {
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const pages = pagination.pages.length
  const wordLabel = words === 1 ? '1 word' : `${words} words`
  return `${wordLabel} on ${pages} page${pages === 1 ? '' : 's'}.`
}

/** Why a document cannot be built, or null when it can. */
export function layoutError(text: string): string | null {
  if (text.trim() === '') return 'Enter the text you want in the PDF.'
  return encodingError(text)
}

/**
 * The code points beyond Latin-1 that the standard PDF fonts can draw.
 *
 * These are the twenty-seven characters Windows-1252 adds over Latin-1: the
 * curly quotes, the dashes, the euro sign, the trademark mark and friends.
 * The full set was checked against the encoder, because a partial list here
 * would reject prose that would otherwise have printed fine.
 */
const WIN_ANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
])

/**
 * Whether a single code point can be drawn in a standard PDF font.
 *
 * The font set is Windows-1252, so Latin-1 works, the extras above work, and
 * everything else — Cyrillic, Greek, CJK, emoji, and every control character
 * including the tab — does not. The encoder throws for those, so this check
 * exists to name them before the build rather than failing inside it.
 */
export function isEncodable(codePoint: number): boolean {
  if (codePoint === 0x0a || codePoint === 0x0d) return true
  if (codePoint < 0x20 || codePoint === 0x7f) return false
  if (codePoint <= 0xff) return true
  return WIN_ANSI_EXTRAS.has(codePoint)
}

/** The characters this tool cannot draw, each listed once, in the order met. */
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

/** The error to show before building, or null when every character is drawable. */
export function encodingError(text: string): string | null {
  const bad = unsupportedCharacters(text)
  if (bad.length === 0) return null
  const shown = bad.slice(0, 8)
  const listed = shown
    .map((character) => `“${character}” (U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')})`)
    .join(', ')
  const rest = bad.length - shown.length
  const more = rest === 0 ? '' : rest === 1 ? ' and 1 more character' : ` and ${rest} more characters`
  return (
    `The PDF fonts used here cannot draw ${listed}${more}. ` +
    'That usually means a non-Latin script, an emoji, or a tab. Replace those characters and build again.'
  )
}

/**
 * The caveat that belongs on the page.
 *
 * Character counting is not measuring: a line of wide capitals wraps earlier
 * than the estimate, and a line of thin punctuation later. Saying so is better
 * than a PDF that overflows its margin without explanation.
 */
export const LAYOUT_NOTE =
  'Lines are sized by character count, not by measuring each glyph, so a line of wide capitals may wrap earlier than expected. The margin is fixed, so text never runs off the page.'
