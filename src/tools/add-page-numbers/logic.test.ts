import { describe, expect, it } from 'vitest'

import {
  FORMATS,
  POSITIONS,
  edgeMargin,
  fontSizeFor,
  labelFor,
  numberingError,
  numberingSummary,
  positionOf,
  totalNote,
} from './logic'

describe('labelFor', () => {
  it('formats each way the tool offers', () => {
    expect(labelFor(3, 12, 'plain')).toBe('3')
    expect(labelFor(3, 12, 'page')).toBe('Page 3')
    expect(labelFor(3, 12, 'page-of')).toBe('Page 3 of 12')
    expect(labelFor(3, 12, 'slash')).toBe('3 / 12')
  })
})

describe('edgeMargin', () => {
  it('is a share of the shorter side, so it scales with the page', () => {
    expect(edgeMargin(595, 842)).toBeCloseTo(595 * 0.04, 5)
    expect(edgeMargin(2245, 3179)).toBeCloseTo(2245 * 0.04, 5)
  })
})

describe('fontSizeFor', () => {
  it('scales with the page but never below legible', () => {
    expect(fontSizeFor(595, 842)).toBeCloseTo(13.09, 2)
    expect(fontSizeFor(200, 300)).toBeCloseTo(8, 5)
    expect(fontSizeFor(3000, 4000)).toBeCloseTo(66, 5)
  })

  it('never returns a size a printer would drop', () => {
    expect(fontSizeFor(10, 10)).toBe(8)
  })
})

describe('positionOf', () => {
  const page = { w: 600, h: 800, tw: 40, th: 12 }

  it('centres horizontally for the centre positions', () => {
    expect(positionOf(page.w, page.h, page.tw, page.th, 'bottom-center').x).toBe(280)
    expect(positionOf(page.w, page.h, page.tw, page.th, 'top-center').x).toBe(280)
  })

  it('puts bottom numbers near the bottom, which is the PDF origin side', () => {
    expect(positionOf(page.w, page.h, page.tw, page.th, 'bottom-right')).toEqual({ x: 536, y: 24 })
  })

  it('puts top numbers near the top, which is height minus the margin', () => {
    const at = positionOf(page.w, page.h, page.tw, page.th, 'top-right')
    expect(at).toEqual({ x: 536, y: 800 - 24 - 12 })
  })

  it('keeps the left number inside the margin', () => {
    expect(positionOf(page.w, page.h, page.tw, page.th, 'bottom-left').x).toBe(24)
  })
})

describe('numberingSummary', () => {
  it('names the pages, the start and the position', () => {
    expect(numberingSummary(12, 1, 'bottom-center')).toBe('12 pages numbered from 1, bottom centre.')
    expect(numberingSummary(1, 1, 'top-center')).toBe('1 page numbered from 1, top centre.')
  })

  it('says the start when it is not one', () => {
    expect(numberingSummary(5, 3, 'bottom-left')).toContain('starting at 3')
  })
})

describe('numberingError', () => {
  it('allows a normal case', () => {
    expect(numberingError(10, 1)).toBeNull()
  })

  it('refuses a page-less document', () => {
    expect(numberingError(0, 1)).toContain('no pages')
  })

  it('refuses a start below one, and a fraction', () => {
    expect(numberingError(10, 0)).toContain('begins at 1')
    expect(numberingError(10, 2.5)).toContain('whole number')
  })

  it('refuses an absurd start rather than printing it', () => {
    expect(numberingError(10, 999999)).toContain('too large')
  })
})

describe('totalNote', () => {
  it('says nothing when numbering starts at the first page', () => {
    expect(totalNote(1, 12)).toBeNull()
  })

  it('explains the total when numbering starts elsewhere', () => {
    expect(totalNote(3, 12)).toContain('The total stays 12')
  })
})

describe('the option lists', () => {
  it('offers five positions and four formats, each distinct', () => {
    expect(new Set(POSITIONS.map((entry) => entry.value)).size).toBe(5)
    expect(new Set(FORMATS.map((entry) => entry.value)).size).toBe(4)
  })
})
