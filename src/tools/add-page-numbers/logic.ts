/**
 * Page numbering decisions.
 *
 * Everything a number stamp needs is decided here: the text, its format, where
 * it sits on the page, and how big it is relative to the page it sits on.
 */

/** Where a number can go, named as a reader would say it. */
export const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom centre' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-center', label: 'Top centre' },
  { value: 'top-right', label: 'Top right' },
] as const

export type NumberPosition = (typeof POSITIONS)[number]['value']

/** The formats a number can take. */
export const FORMATS = [
  { value: 'plain', label: '3' },
  { value: 'page', label: 'Page 3' },
  { value: 'page-of', label: 'Page 3 of 12' },
  { value: 'slash', label: '3 / 12' },
] as const

export type NumberFormat = (typeof FORMATS)[number]['value']

/** The label printed for one page. */
export function labelFor(pageNumber: number, total: number, format: NumberFormat): string {
  switch (format) {
    case 'plain':
      return String(pageNumber)
    case 'page':
      return `Page ${pageNumber}`
    case 'page-of':
      return `Page ${pageNumber} of ${total}`
    case 'slash':
      return `${pageNumber} / ${total}`
  }
}

/** The margin from the page edge, in points, for a page of the given size. */
export function edgeMargin(pageWidth: number, pageHeight: number): number {
  return Math.min(pageWidth, pageHeight) * 0.04
}

/** The font size for a number, scaled to the page so it reads the same on A4 and on a postcard. */
export function fontSizeFor(pageWidth: number, pageHeight: number): number {
  return Math.max(8, Math.min(pageWidth, pageHeight) * 0.022)
}

/**
 * Where the number's baseline-anchored box goes.
 *
 * PDF coordinates start at the bottom left, so "top" means the height minus
 * the margin, which is the part a reader calls the top of the page.
 */
export function positionOf(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  position: NumberPosition,
): { x: number; y: number } {
  const margin = edgeMargin(pageWidth, pageHeight)
  const centred = (pageWidth - textWidth) / 2

  switch (position) {
    case 'bottom-center':
      return { x: centred, y: margin }
    case 'bottom-right':
      return { x: pageWidth - margin - textWidth, y: margin }
    case 'bottom-left':
      return { x: margin, y: margin }
    case 'top-center':
      return { x: centred, y: pageHeight - margin - textHeight }
    case 'top-right':
      return { x: pageWidth - margin - textWidth, y: pageHeight - margin - textHeight }
  }
}

/** A line describing the stamp, e.g. "12 pages numbered from 1, bottom centre". */
export function numberingSummary(pageCount: number, startAt: number, position: NumberPosition): string {
  const label = POSITIONS.find((entry) => entry.value === position)?.label ?? position
  const pages = pageCount === 1 ? '1 page' : `${pageCount} pages`
  const from = startAt === 1 ? 'from 1' : `starting at ${startAt}`
  return `${pages} numbered ${from}, ${label.toLowerCase()}.`
}

/** Why a number cannot be applied, or null when it can. */
export function numberingError(pageCount: number, startAt: number): string | null {
  if (pageCount < 1) return 'This PDF has no pages to number.'
  if (!Number.isInteger(startAt)) return 'The starting number has to be a whole number.'
  if (startAt < 1) return 'The starting number has to be 1 or more. Page numbering begins at 1.'
  if (startAt > 100000) return 'That starting number is too large to be sensible on a page.'
  return null
}

/**
 * The note a custom starting number earns.
 *
 * "Page 5 of 12" implies twelve pages exist. When numbering starts somewhere
 * other than 1, the total is still the document's own page count, and saying so
 * is better than silently producing a number that reads wrong.
 */
export function totalNote(startAt: number, total: number): string | null {
  if (startAt === 1) return null
  return `The total stays ${total}, the number of pages in the document, so the count reads consistently throughout.`
}
