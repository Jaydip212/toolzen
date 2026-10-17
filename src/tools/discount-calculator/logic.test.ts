import { describe, expect, it } from 'vitest'
import {
  applyPercent,
  applyStacked,
  compareUnits,
  originalPrice,
  savedPercent,
  withTax,
} from './logic'

describe('applyPercent', () => {
  it('computes a single discount', () => {
    const result = applyPercent(1000, 20)
    expect(result.saved).toBe(200)
    expect(result.final).toBe(800)
  })

  it('handles a zero percent and a zero price', () => {
    expect(applyPercent(1000, 0)).toMatchObject({ saved: 0, final: 1000 })
    expect(applyPercent(0, 50)).toMatchObject({ saved: 0, final: 0 })
  })

  it('rejects an out-of-range percentage', () => {
    expect(() => applyPercent(100, 120)).toThrow(/0% and 100%/)
    expect(() => applyPercent(100, -5)).toThrow(/0% and 100%/)
  })

  it('rejects a negative price', () => {
    expect(() => applyPercent(-100, 10)).toThrow(/zero or more/)
  })

  it('handles a 100% discount', () => {
    expect(applyPercent(500, 100)).toMatchObject({ saved: 500, final: 0 })
  })
})

describe('applyStacked', () => {
  it('applies discounts one after another, not additively', () => {
    const result = applyStacked(1000, [20, 10])
    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].price).toBe(800)
    expect(result.steps[1].price).toBe(720)
    expect(result.final).toBe(720)
    expect(result.saved).toBe(280)
  })

  it('reports the effective single percentage', () => {
    // 20% then 10% is 28% off, not 30%.
    expect(applyStacked(1000, [20, 10]).effectivePercent).toBe(28)
    expect(applyStacked(1000, [20, 10]).naiveFinal).toBe(700)
  })

  it('shows the gap between stacked and flat', () => {
    const result = applyStacked(1000, [20, 10])
    expect(result.final).toBeGreaterThan(result.naiveFinal)
  })

  it('treats an empty list as no discount', () => {
    expect(applyStacked(1000, [])).toMatchObject({ final: 1000, saved: 0, effectivePercent: 0 })
  })

  it('ignores zero and blank entries', () => {
    expect(applyStacked(1000, [0, 20, 0]).final).toBe(800)
  })

  it('still validates out-of-range entries', () => {
    expect(() => applyStacked(1000, [20, 150])).toThrow(/0% and 100%/)
  })

  it('handles three stacked discounts', () => {
    // 1000 → 900 → 765 → 688.5
    const result = applyStacked(1000, [10, 15, 10])
    expect(result.final).toBe(688.5)
    expect(result.steps).toHaveLength(3)
  })
})

describe('originalPrice', () => {
  it('reverses a discount', () => {
    const result = originalPrice(800, 20)
    expect(result.original).toBe(1000)
    expect(result.saved).toBe(200)
  })

  it('refuses a 100% discount', () => {
    expect(() => originalPrice(0, 100)).toThrow(/nothing to reverse/)
  })
})

describe('compareUnits', () => {
  const offers = [
    { label: '500 g pack', price: 120, size: 500, unit: 'g' },
    { label: '750 g pack', price: 165, size: 750, unit: 'g' },
  ]

  it('picks the cheaper pack per unit', () => {
    const comparison = compareUnits(offers)
    expect(comparison.best?.offer.label).toBe('750 g pack')
    expect(comparison.best?.pricePerUnit).toBe(0.22)
    expect(comparison.tied).toBe(false)
  })

  it('reports the premium of the dearer option', () => {
    const comparison = compareUnits(offers)
    const dearer = comparison.rows.find((row) => row.offer.label === '500 g pack')
    // ₹0.24/g against ₹0.22/g is a 9.1% premium, not the 37.5% the sticker
    // prices alone would suggest.
    expect(dearer?.premiumPercent).toBeCloseTo(9.1, 1)
  })

  it('flags a tie', () => {
    const comparison = compareUnits([
      { label: 'A', price: 100, size: 500, unit: 'g' },
      { label: 'B', price: 200, size: 1000, unit: 'g' },
    ])
    expect(comparison.tied).toBe(true)
  })

  it('skips an offer with no usable size', () => {
    const comparison = compareUnits([...offers, { label: 'Broken', price: 50, size: 0, unit: 'g' }])
    expect(comparison.rows).toHaveLength(2)
  })

  it('returns nothing rather than guessing when all sizes are missing', () => {
    expect(compareUnits([])).toEqual({ rows: [], best: null, tied: false })
    expect(compareUnits([{ label: 'A', price: 10, size: 0, unit: 'g' }]).best).toBeNull()
  })
})

describe('withTax and savedPercent', () => {
  it('adds tax', () => {
    expect(withTax(1000, 18)).toEqual({ tax: 180, total: 1180 })
  })

  it('computes a saving percentage', () => {
    expect(savedPercent(1000, 800)).toBe(20)
    expect(savedPercent(0, 0)).toBe(0)
  })
})
