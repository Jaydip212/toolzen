/**
 * Page reordering decisions.
 *
 * Reordering is the one page operation where the user supplies the whole
 * answer: a list of every page in the new order. Anything less is ambiguous —
 * a list that skips a page does not say where that page goes — so the list is
 * checked to be a permutation of the document's pages before it is used.
 */

export interface ReorderPlan {
  ok: boolean
  error: string | null
  /** The new page order, one-based, in the sequence the user typed. */
  order: number[]
}

/** Plan a reorder from a comma-separated list of every page. */
export function planReorder(input: string, pageCount: number): ReorderPlan {
  const fail = (error: string): ReorderPlan => ({ ok: false, error, order: [] })

  if (pageCount < 1) return fail('This PDF has no pages to reorder.')
  const trimmed = input.trim()
  if (!trimmed) return fail('Enter the new order, one page number per comma, ending with every page listed.')

  const seen: number[] = []
  const counts = new Map<number, number>()
  for (const part of trimmed.split(',').map((entry) => entry.trim())) {
    if (!part) return fail('There is an empty part in that order. Check for a doubled comma.')
    const page = Number(part)
    if (!Number.isInteger(page)) {
      return fail(`“${part}” is not a page number. Use digits only, one page per comma.`)
    }
    if (page < 1) return fail(`Page numbers start at 1, and “${part}” is 0.`)
    if (page > pageCount) {
      return fail(`This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}, so it has no page ${page}.`)
    }
    seen.push(page)
    counts.set(page, (counts.get(page) ?? 0) + 1)
  }

  for (let page = 1; page <= pageCount; page += 1) {
    const times = counts.get(page) ?? 0
    if (times === 0) return fail(`Page ${page} is missing from the order, and every page has to be listed once.`)
    if (times > 1) return fail(`Page ${page} appears ${times} times. Every page has to be listed exactly once.`)
  }

  return { ok: true, error: null, order: seen }
}

/**
 * The order to use when nothing has been typed yet: the document's own.
 *
 * Starting from the identity means the preview shows the real document before
 * the user has edited anything.
 */
export function identityOrder(pageCount: number): number[] {
  const order: number[] = []
  for (let page = 1; page <= pageCount; page += 1) order.push(page)
  return order
}

/** Whether an order differs from the document's own, and so is worth applying. */
export function isReordered(order: number[], pageCount: number): boolean {
  return order.length === pageCount && order.some((page, index) => page !== index + 1)
}

/** A line describing the change, e.g. "10 pages reordered (3 moved to the front)". */
export function reorderSummary(pageCount: number): string {
  if (pageCount < 1) return 'Nothing to reorder yet.'
  return `${pageCount} page${pageCount === 1 ? '' : 's'} in the order you list. Page content is not touched.`
}
