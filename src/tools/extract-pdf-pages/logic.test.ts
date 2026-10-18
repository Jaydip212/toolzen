import { describe, expect, it } from 'vitest'

import { extractName, extractSummary, planExtract } from './logic'

describe('planExtract', () => {
  it('takes the pages named, in ascending order', () => {
    const plan = planExtract('8, 1-3', 10)
    expect(plan.ok).toBe(true)
    expect(plan.taking).toEqual([1, 2, 3, 8])
  })

  it('passes a bad range through with its own reason', () => {
    expect(planExtract('2-1', 10).error).toContain('runs backwards')
    expect(planExtract('11', 10).error).toContain('no page 11')
  })

  it('asks for something before doing nothing', () => {
    expect(planExtract('', 10).error).toContain('at least one page')
  })
})

describe('extractSummary', () => {
  it('reports what was taken out of what', () => {
    expect(extractSummary(planExtract('1-3, 8', 10), 10)).toBe('4 pages of 10 extracted (1-3, 8).')
  })

  it('gets the singular right', () => {
    expect(extractSummary(planExtract('4', 10), 10)).toBe('1 page of 10 extracted (4).')
  })

  it('says nothing will happen before a valid range exists', () => {
    expect(extractSummary(planExtract('x', 10), 10)).toContain('Nothing will be extracted')
  })
})

describe('extractName', () => {
  it('names the file after the pages it holds, in range shorthand', () => {
    expect(extractName('report.pdf', [1, 2, 3, 8])).toBe('report-p1-3-8.pdf')
    expect(extractName('report.pdf', [4])).toBe('report-p4.pdf')
  })

  it('still names a file when the range text is unusable', () => {
    expect(extractName('report.pdf', [])).toBe('report-ppages.pdf')
  })

  it('adds a PDF extension when the file had none', () => {
    expect(extractName('scan', [2])).toBe('scan-p2.pdf')
  })
})
