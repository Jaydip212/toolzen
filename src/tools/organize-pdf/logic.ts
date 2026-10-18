/**
 * The organise tool combines the three page operations in one place: remove,
 * reorder and rotate. Its logic is the data model that the page grid edits,
 * plus one rule that matters — an emptied grid must not produce a document.
 */

import { normaliseAngle } from '@/lib/pdf'

export interface OrganizePlan {
  ok: boolean
  error: string | null
  /** The pages that survive, in the order they will appear. */
  keep: number[]
  /** The extra rotation, in degrees, for each kept page — same indexing as `keep`. */
  turns: number[]
}

/**
 * Turn a grid state into a plan.
 *
 * `order` is every page in its current slot order, `removed` the pages taken
 * out, and `turns` the extra rotation applied to a page since it was opened.
 * The turn is added to whatever rotation the page already had, so a page that
 * arrived rotated stays rotated unless the user levels it.
 */
export function planOrganize(order: number[], removed: number[], turns: Map<number, number>): OrganizePlan {
  const dropped = new Set(removed)
  const keep: number[] = []
  const turnList: number[] = []

  for (const page of order) {
    if (dropped.has(page)) continue
    keep.push(page)
    turnList.push(normaliseAngle(turns.get(page) ?? 0))
  }

  if (keep.length === 0) {
    return {
      ok: false,
      error: 'Every page has been removed. Keep at least one page to build a document.',
      keep: [],
      turns: [],
    }
  }

  return { ok: true, error: null, keep, turns: turnList }
}

/** A line describing what the grid will build. */
export function organizeSummary(keep: number[], removed: number[], turns: number): string {
  const pages = keep.length
  const what = `${pages} page${pages === 1 ? '' : 's'}`
  if (removed.length === 0 && turns === 0) return `${what}, unchanged order.`
  const parts: string[] = []
  if (removed.length > 0) parts.push(`${removed.length} removed`)
  if (turns > 0) parts.push(`${turns} turned`)
  parts.push('order applied')
  return `${what} kept — ${parts.join(', ')}.`
}

/** How many pages in the grid are turned away from upright. */
export function countTurns(turns: Map<number, number>): number {
  let turned = 0
  for (const value of turns.values()) if (normaliseAngle(value) !== 0) turned += 1
  return turned
}
