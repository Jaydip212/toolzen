/**
 * Page extraction decisions.
 *
 * Extraction is the mirror of deletion: the named pages go into a new
 * document, and the original is left exactly as it was.
 */

import { formatPageList, parsePageGroups } from '@/lib/pdf'

export interface ExtractPlan {
  ok: boolean
  error: string | null
  /** The pages to take, ascending. */
  taking: number[]
}

/** Plan an extraction from a page-range specification. */
export function planExtract(rangeText: string, pageCount: number): ExtractPlan {
  const parsed = parsePageGroups(rangeText, pageCount)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error ?? 'That page range could not be read.', taking: [] }
  }
  if (parsed.selected.length === 0) {
    return { ok: false, error: 'Enter at least one page to extract.', taking: [] }
  }
  return { ok: true, error: null, taking: parsed.selected }
}

/** A line describing the result, e.g. "4 pages extracted (1-3, 7)". */
export function extractSummary(plan: ExtractPlan, pageCount: number): string {
  if (!plan.ok) return 'Nothing will be extracted until a valid range is entered.'
  return `${plan.taking.length} page${plan.taking.length === 1 ? '' : 's'} of ${pageCount} ` +
    `extracted (${formatPageList(plan.taking)}).`
}

/** The name for the extracted file. */
export function extractName(fileName: string, pages: number[]): string {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  const fragment = formatPageList(pages).replace(/[^\d-]+/g, '-').replace(/^-|-$/g, '') || 'pages'
  return `${stem}-p${fragment}.pdf`
}
