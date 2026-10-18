import { describe, expect, it } from 'vitest'

import { MAX_SPLIT_PARTS, planSplit, splitError, splitSummary } from './logic'

describe('planSplit by ranges', () => {
  it('names one output file per range', () => {
    const plan = planSplit('ranges', '1-2, 5, 8-9', 10, 'report')
    expect(plan.ok).toBe(true)
    expect(plan.parts).toEqual([
      { label: '1-2', pages: [1, 2], fileName: 'report-p1-2.pdf' },
      { label: '5', pages: [5], fileName: 'report-p5.pdf' },
      { label: '8-9', pages: [8, 9], fileName: 'report-p8-9.pdf' },
    ])
  })

  it('passes the range error through verbatim', () => {
    const plan = planSplit('ranges', '9-2', 10, 'report')
    expect(plan.ok).toBe(false)
    expect(plan.error).toContain('runs backwards')
    expect(plan.parts).toEqual([])
  })

  it('rejects a range past the end of the document', () => {
    expect(planSplit('ranges', '3-12', 10, 'r').error).toContain('runs past the last page')
  })
})

describe('planSplit into every page', () => {
  it('produces one single-page file per page, numbered', () => {
    const plan = planSplit('every-page', '', 3, 'book')
    expect(plan.ok).toBe(true)
    expect(plan.parts.map((part) => part.fileName)).toEqual([
      'book-p1.pdf',
      'book-p2.pdf',
      'book-p3.pdf',
    ])
    expect(plan.parts.every((part) => part.pages.length === 1)).toBe(true)
  })

  it('ignores the range text entirely, because it is not used', () => {
    const plan = planSplit('every-page', 'garbage', 2, 'book')
    expect(plan.ok).toBe(true)
    expect(plan.parts).toHaveLength(2)
  })

  it('refuses a document with no pages instead of producing nothing', () => {
    expect(planSplit('every-page', '', 0, 'book').error).toContain('no pages')
  })
})

describe('splitError', () => {
  it('passes when there is at least one part and a page', () => {
    expect(splitError(10, 1)).toBeNull()
  })

  it('asks for a range when none was given', () => {
    expect(splitError(10, 0)).toContain('at least one page range')
  })

  it('caps the number of output files', () => {
    expect(splitError(MAX_SPLIT_PARTS + 5, MAX_SPLIT_PARTS + 5)).toContain(String(MAX_SPLIT_PARTS))
  })

  it('refuses a page-less document', () => {
    expect(splitError(0, 1)).toContain('no pages')
  })
})

describe('splitSummary', () => {
  it('counts files and total pages', () => {
    const plan = planSplit('ranges', '1-3, 7', 10, 'r')
    expect(splitSummary(plan.parts)).toBe('2 files, 4 pages in total.')
  })

  it('says so before anything is planned', () => {
    expect(splitSummary([])).toBe('No output files yet.')
  })
})
