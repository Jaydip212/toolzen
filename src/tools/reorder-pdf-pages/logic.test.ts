import { describe, expect, it } from 'vitest'

import { identityOrder, isReordered, planReorder, reorderSummary } from './logic'

describe('planReorder', () => {
  it('accepts a full permutation', () => {
    const plan = planReorder('3, 1, 2', 3)
    expect(plan.ok).toBe(true)
    expect(plan.order).toEqual([3, 1, 2])
  })

  it('names the page that is missing', () => {
    const plan = planReorder('3, 1', 3)
    expect(plan.ok).toBe(false)
    expect(plan.error).toContain('Page 2 is missing')
    expect(plan.order).toEqual([])
  })

  it('names the page that appears twice, and how often', () => {
    const plan = planReorder('1, 1, 2', 3)
    expect(plan.ok).toBe(false)
    expect(plan.error).toContain('Page 1 appears 2 times')
  })

  it('rejects a page beyond the document, naming the count', () => {
    expect(planReorder('1, 2, 9', 3).error).toContain('3 pages, so it has no page 9')
  })

  it('rejects zero, text and doubled commas', () => {
    expect(planReorder('0, 1, 2, 3', 3).error).toContain('start at 1')
    expect(planReorder('one, two', 2).error).toContain('not a page number')
    expect(planReorder('1,, 2', 2).error).toContain('doubled comma')
    expect(planReorder('', 3).error).toContain('new order')
  })

  it('refuses a document with no pages', () => {
    expect(planReorder('1', 0).error).toContain('no pages')
  })
})

describe('identityOrder', () => {
  it('is the document untouched', () => {
    expect(identityOrder(4)).toEqual([1, 2, 3, 4])
    expect(identityOrder(1)).toEqual([1])
  })
})

describe('isReordered', () => {
  it('is false for the document’s own order', () => {
    expect(isReordered([1, 2, 3], 3)).toBe(false)
  })

  it('is true once anything has moved', () => {
    expect(isReordered([2, 1, 3], 3)).toBe(true)
  })

  it('is false for an incomplete order, which cannot be applied anyway', () => {
    expect(isReordered([1, 2], 3)).toBe(false)
  })
})

describe('reorderSummary', () => {
  it('counts the pages and says the content is untouched', () => {
    expect(reorderSummary(5)).toContain('5 pages in the order you list')
    expect(reorderSummary(1)).toContain('1 page in the order you list')
    expect(reorderSummary(5)).toContain('content is not touched')
  })

  it('says so for an empty document', () => {
    expect(reorderSummary(0)).toBe('Nothing to reorder yet.')
  })
})
