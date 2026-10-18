/**
 * Watermark placement decisions for PDF pages.
 *
 * The rule that matters: a watermark is stamped on top of content, so its
 * strength is the difference between marking a page and hiding it. The
 * position and size are pure geometry; the warning is honesty.
 */

/** Where a stamp can go, named as a reader would say it. */
export const POSITIONS = [
  { value: 'diagonal', label: 'Diagonal across the whole page' },
  { value: 'center', label: 'Dead centre' },
  { value: 'tiled', label: 'Tiled across the page' },
  { value: 'bottom-right', label: 'Bottom right' },
] as const

export type WatermarkPosition = (typeof POSITIONS)[number]['value']

/** The angle a diagonal stamp sits at, in degrees. */
export const DIAGONAL_ANGLE = 45

/**
 * Where one stamp goes, in page coordinates.
 *
 * `textWidth` and `textHeight` are the measured size of the drawn stamp. For
 * the diagonal and tiled modes the anchor is the page centre, because the
 * rotation happens around it.
 */
export function stampOrigin(
  pageWidth: number,
  pageHeight: number,
  stampWidth: number,
  stampHeight: number,
  position: WatermarkPosition,
): { x: number; y: number; rotate: boolean } {
  const centreX = pageWidth / 2
  const centreY = pageHeight / 2

  switch (position) {
    case 'diagonal':
      return { x: centreX, y: centreY, rotate: true }
    case 'center':
      return { x: centreX - stampWidth / 2, y: centreY - stampHeight / 2, rotate: false }
    case 'tiled':
      return { x: centreX, y: centreY, rotate: true }
    case 'bottom-right': {
      const margin = Math.min(pageWidth, pageHeight) * 0.04
      return { x: pageWidth - margin - stampWidth, y: margin, rotate: false }
    }
  }
}

/**
 * The step between tiles, as a multiple of the stamp's own size.
 *
 * A gap of half the stamp in each direction reads as a deliberate grid rather
 * than a wall of text, and it means the user tunes one number, not two.
 */
export function tileStep(stampWidth: number, stampHeight: number): { x: number; y: number } {
  return { x: stampWidth * 1.5, y: stampHeight * 2.5 }
}

/** How many tiles fit across a page — used to warn about heavy grids. */
export function tileCount(
  pageWidth: number,
  pageHeight: number,
  stampWidth: number,
  stampHeight: number,
): number {
  if (stampWidth <= 0 || stampHeight <= 0) return 0
  const step = tileStep(stampWidth, stampHeight)
  return Math.max(1, Math.floor(pageWidth / step.x)) * Math.max(1, Math.floor(pageHeight / step.y))
}

/**
 * The warning a strength earns.
 *
 * A stamp above roughly 60% opacity covers the page it is meant to label, and
 * one below 10% disappears on a dark scan. Both are reported rather than
 * silently applied.
 */
export function strengthWarning(opacity: number): string | null {
  if (opacity >= 0.6) {
    return 'At this strength the watermark covers the page underneath it. Around 10 to 30% marks a document without hiding it.'
  }
  if (opacity > 0 && opacity < 0.1) {
    return 'At this strength the watermark may be invisible on a dark or busy page. Around 10 to 30% is a safer range.'
  }
  return null
}

/** A line describing what the stamp will do. */
export function watermarkSummary(pageCount: number, position: WatermarkPosition): string {
  const label = POSITIONS.find((entry) => entry.value === position)?.label ?? position
  const pages = pageCount === 1 ? '1 page' : `${pageCount} pages`
  return `${pages} stamped, ${label.toLowerCase()}.`
}

/** Why a stamp cannot be applied, or null when it can. */
export function watermarkError(pageCount: number, text: string, opacity: number): string | null {
  if (pageCount < 1) return 'This PDF has no pages to stamp.'
  if (text.trim() === '') return 'Enter the text to stamp.'
  if (opacity <= 0 || opacity > 1) return 'The strength has to be between 1% and 100%.'
  return null
}
