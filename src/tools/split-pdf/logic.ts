/**
 * Split decisions: which pages become which document.
 *
 * Both modes are computed before any file is written, so the user sees the
 * exact list of output files — names, page counts and all — before pressing
 * the button.
 */

import { nameForRange, parsePageGroups, type PageGroup } from '@/lib/pdf'

/** How a PDF can be split: by ranges the user writes, or into single pages. */
export type SplitMode = 'ranges' | 'every-page'

export interface SplitPart {
  label: string
  pages: number[]
  /** The file name this part downloads as. */
  fileName: string
}

export interface SplitPlan {
  ok: boolean
  error: string | null
  parts: SplitPart[]
}

/** Plan a split without touching a PDF. */
export function planSplit(mode: SplitMode, rangeText: string, pageCount: number, baseName: string): SplitPlan {
  const fail = (error: string): SplitPlan => ({ ok: false, error, parts: [] })

  if (mode === 'every-page') {
    if (pageCount < 1) return fail('This PDF has no pages to split.')
    const parts: SplitPart[] = []
    for (let page = 1; page <= pageCount; page += 1) {
      parts.push({
        label: String(page),
        pages: [page],
        fileName: nameForRange(baseName, String(page)),
      })
    }
    return { ok: true, error: null, parts }
  }

  const parsed = parsePageGroups(rangeText, pageCount)
  if (!parsed.ok) return fail(parsed.error ?? 'That page range could not be read.')

  const parts: SplitPart[] = parsed.groups.map((group: PageGroup) => ({
    label: group.label,
    pages: group.pages,
    fileName: nameForRange(baseName, group.label),
  }))
  return { ok: true, error: null, parts }
}

/** The most files a single-page split may produce. */
export const MAX_SPLIT_PARTS = 200

/** Why a split cannot start, or null when it can. */
export function splitError(pageCount: number, partCount: number): string | null {
  if (pageCount < 1) return 'This PDF has no pages to split.'
  if (partCount < 1) return 'Enter at least one page range to split by.'
  if (partCount > MAX_SPLIT_PARTS) {
    return `This split would produce ${partCount} files, over the ${MAX_SPLIT_PARTS}-file limit for one download batch. Split into ranges instead.`
  }
  return null
}

/** A line describing the result, e.g. "3 files, 24 pages total". */
export function splitSummary(parts: SplitPart[]): string {
  const pages = parts.reduce((total, part) => total + part.pages.length, 0)
  if (parts.length === 0) return 'No output files yet.'
  return `${parts.length} file${parts.length === 1 ? '' : 's'}, ${pages} page${pages === 1 ? '' : 's'} in total.`
}
