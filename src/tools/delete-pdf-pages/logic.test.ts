import { describe, expect, it } from 'vitest'

import { deleteName, deleteSummary, planDelete } from './logic'

describe('planDelete', () => {
  it('keeps the complement of the removed pages', () => {
    const plan = planDelete('2, 4-5', 8)
    expect(plan.ok).toBe(true)
    expect(plan.removing).toEqual([2, 4, 5])
    expect(plan.keeping).toEqual([1, 3, 6, 7, 8])
  })

  it('refuses to leave an empty document, and says why', () => {
    const plan = planDelete('1-4', 4)
    expect(plan.ok).toBe(false)
    expect(plan.error).toContain('removes every page')
    expect(plan.error).toContain('at least one page')
  })

  it('passes a bad range through with its own reason', () => {
    expect(planDelete('9-2', 8).error).toContain('runs backwards')
    expect(planDelete('9', 8).error).toContain('no page 9')
    expect(planDelete('', 8).error).toContain('at least one page')
  })
})

describe('deleteSummary', () => {
  it('names the pages that go and the count that stays', () => {
    expect(deleteSummary(planDelete('2, 4-5', 8))).toBe('5 pages kept, 3 removed (2, 4-5).')
  })

  it('gets the singular right', () => {
    expect(deleteSummary(planDelete('2', 3))).toBe('2 pages kept, 1 removed (2).')
  })

  it('says nothing will happen before a valid range exists', () => {
    expect(deleteSummary(planDelete('nope', 3))).toContain('Nothing will be deleted')
  })
})

describe('deleteName', () => {
  it('marks the file as trimmed', () => {
    expect(deleteName('report.pdf')).toBe('report-trimmed.pdf')
    expect(deleteName('scan')).toBe('scan-trimmed.pdf')
  })
})
