import { describe, expect, it } from 'vitest'

import {
  DIAGONAL_ANGLE,
  POSITIONS,
  stampOrigin,
  strengthWarning,
  tileCount,
  tileStep,
  watermarkError,
  watermarkSummary,
} from './logic'

describe('stampOrigin', () => {
  it('anchors a diagonal stamp at the page centre, because that is where it turns', () => {
    expect(stampOrigin(600, 800, 100, 20, 'diagonal')).toEqual({ x: 300, y: 400, rotate: true })
  })

  it('centres a plain stamp in its own box', () => {
    expect(stampOrigin(600, 800, 100, 20, 'center')).toEqual({ x: 250, y: 390, rotate: false })
  })

  it('keeps a corner stamp inside the margin', () => {
    const at = stampOrigin(600, 800, 100, 20, 'bottom-right')
    expect(at.x + 100).toBe(600 - 24)
    expect(at.y).toBe(24)
    expect(at.rotate).toBe(false)
  })
})

describe('tileStep', () => {
  it('spaces tiles by their own size, so one number controls the grid', () => {
    expect(tileStep(100, 20)).toEqual({ x: 150, y: 50 })
  })
})

describe('tileCount', () => {
  it('counts the tiles an A4 page would hold', () => {
    // A4 is 595 x 842; a 200x40 stamp steps by 300 and 100.
    expect(tileCount(595, 842, 200, 40)).toBe(1 * 8)
  })

  it('never reports zero columns or rows for a usable stamp', () => {
    // A stamp wider than the page still tiles once across, and down as often
    // as the page allows — a floor of one keeps the grid from vanishing.
    expect(tileCount(595, 842, 5000, 40)).toBe(8)
  })

  it('returns zero for a stamp with no size', () => {
    expect(tileCount(595, 842, 0, 40)).toBe(0)
  })
})

describe('strengthWarning', () => {
  it('warns that a strong stamp covers the page', () => {
    expect(strengthWarning(0.6)).toContain('covers the page')
    expect(strengthWarning(0.9)).toContain('covers the page')
  })

  it('warns that a weak stamp disappears', () => {
    expect(strengthWarning(0.05)).toContain('invisible')
  })

  it('says nothing for the sensible middle', () => {
    expect(strengthWarning(0.2)).toBeNull()
    expect(strengthWarning(0.1)).toBeNull()
    expect(strengthWarning(0.59)).toBeNull()
  })
})

describe('watermarkSummary', () => {
  it('counts the pages and names the position', () => {
    expect(watermarkSummary(4, 'bottom-right')).toBe('4 pages stamped, bottom right.')
    expect(watermarkSummary(1, 'diagonal')).toBe('1 page stamped, diagonal across the whole page.')
  })
})

describe('watermarkError', () => {
  it('allows a normal stamp', () => {
    expect(watermarkError(3, 'DRAFT', 0.2)).toBeNull()
  })

  it('asks for text rather than stamping nothing', () => {
    expect(watermarkError(3, '   ', 0.2)).toContain('Enter the text')
  })

  it('refuses a page-less document and an impossible strength', () => {
    expect(watermarkError(0, 'DRAFT', 0.2)).toContain('no pages')
    expect(watermarkError(3, 'DRAFT', 0)).toContain('between 1% and 100%')
    expect(watermarkError(3, 'DRAFT', 1.2)).toContain('between 1% and 100%')
  })
})

describe('DIAGONAL_ANGLE', () => {
  it('is the angle that reads as a stamp', () => {
    expect(DIAGONAL_ANGLE).toBe(45)
  })
})

describe('POSITIONS', () => {
  it('offers four distinct placements', () => {
    expect(new Set(POSITIONS.map((entry) => entry.value)).size).toBe(4)
  })
})
