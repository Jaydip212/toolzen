/**
 * Rotation decisions for PDF pages.
 *
 * A PDF page has a stored rectangle and a separate rotation angle. Viewers
 * show the rectangle turned by that angle, so a quarter turn swaps the width
 * and height a reader actually sees — which is worth telling the user before
 * they download, not after.
 */

import { normaliseAngle } from '@/lib/pdf'

/** The turns the tool offers, in the order they appear. */
export const TURNS: Array<{ value: number; label: string }> = [
  { value: 90, label: '90° left (counter-clockwise)' },
  { value: -90, label: '90° right (clockwise)' },
  { value: 180, label: '180°' },
]

/** The angle a page shows after being turned, from the angle it shows now. */
export function angleAfterTurn(current: number, turn: number): number {
  return normaliseAngle(current + turn)
}

/** The label for a turn value, or an empty string for one the tool does not offer. */
export function turnLabel(turn: number): string {
  return TURNS.find((entry) => entry.value === turn)?.label ?? `${turn}°`
}

/**
 * A line describing what the rotation will do.
 *
 * `pageCount` is the number of pages being turned, which may be the whole
 * document or a selection.
 */
export function rotationSummary(turn: number, pageCount: number): string {
  const what = turn === 180 ? 'turned upside down' : `turned ${turnLabel(turn)}`
  const noun = pageCount === 1 ? '1 page' : `${pageCount} pages`
  return `${noun} ${what}. Any page that ends at 90° or 270° swaps its width and height.`
}

/** A note when the turn would change every page's orientation, or null. */
export function orientationNote(turn: number, pageCount: number): string | null {
  if (turn === 90 || turn === -90) {
    return pageCount === 0
      ? null
      : 'A quarter turn swaps width and height on the pages it touches, so a portrait page reads as landscape afterwards.'
  }
  return null
}

/** The rotation angles to apply, given the scope of the change. */
export function pagesToRotate(pageCount: number, selection: number[]): number[] {
  if (selection.length === 0) return []
  const inRange = selection.filter((page) => page >= 1 && page <= pageCount)
  return [...new Set(inRange)].sort((a, b) => a - b)
}
