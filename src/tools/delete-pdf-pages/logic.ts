/**
 * Page deletion decisions.
 *
 * The plan is computed before anything is written, so the user is shown the
 * pages that stay and the pages that go, rather than discovering one of those
 * afterwards.
 */

import { complementOf, formatPageList, parsePageGroups } from '@/lib/pdf'

export interface DeletePlan {
  ok: boolean
  error: string | null
  /** The pages being removed, ascending. */
  removing: number[]
  /** The pages that will remain, ascending. */
  keeping: number[]
}

/** Plan a deletion from a page-range specification. */
export function planDelete(rangeText: string, pageCount: number): DeletePlan {
  const empty: DeletePlan = { ok: false, error: null, removing: [], keeping: [] }

  const parsed = parsePageGroups(rangeText, pageCount)
  if (!parsed.ok) {
    return { ...empty, error: parsed.error ?? 'That page range could not be read.' }
  }
  if (parsed.selected.length === 0) {
    return { ...empty, error: 'Enter at least one page to delete.' }
  }
  if (parsed.selected.length === pageCount) {
    return {
      ...empty,
      error:
        'That selection removes every page, which would leave an empty document. Leave at least one page in.',
    }
  }

  const keeping = complementOf(parsed.selected, pageCount)
  return { ok: true, error: null, removing: parsed.selected, keeping }
}

/** A line describing the result, e.g. "9 pages kept, 2 removed (4, 7)". */
export function deleteSummary(plan: DeletePlan): string {
  if (!plan.ok) return 'Nothing will be deleted until a valid range is entered.'
  return `${plan.keeping.length} page${plan.keeping.length === 1 ? '' : 's'} kept, ` +
    `${plan.removing.length} removed (${formatPageList(plan.removing)}).`
}

/** The name for the cleaned-up file. */
export function deleteName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  return `${stem}-trimmed.pdf`
}
