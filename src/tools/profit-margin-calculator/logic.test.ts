import { describe, expect, it } from 'vitest'
import {
  MARGIN_VS_MARKUP,
  bothFor,
  breakeven,
  fromMargin,
  fromMarkup,
  fromRevenueCost,
  fromUnits,
  formatPercent,
} from './logic'

describe('fromRevenueCost', () => {
  it('computes margin and markup for the same money', () => {
    const result = fromRevenueCost(100, 60)
    expect(result.profit).toBe(40)
    expect(result.marginPercent).toBe(40)
    expect(result.markupPercent).toBeCloseTo(66.67, 1)
    expect(result.costSharePercent).toBe(60)
  })

  it('reports a zero cost as an infinite markup', () => {
    expect(fromRevenueCost(100, 0).markupPercent).toBe(Number.POSITIVE_INFINITY)
  })

  it('refuses a loss rather than reporting a negative margin', () => {
    expect(() => fromRevenueCost(100, 150)).toThrow(/no margin/)
  })

  it('rejects a non-positive revenue', () => {
    expect(() => fromRevenueCost(0, 10)).toThrow(/Revenue/)
    expect(() => fromRevenueCost(-100, 10)).toThrow(/Revenue/)
  })
})

describe('the margin and markup gap', () => {
  it('shows a 50% markup is a 33.3% margin', () => {
    const result = fromMarkup(100, 50)
    expect(result.revenue).toBe(150)
    expect(result.markupPercent).toBe(50)
    expect(result.marginPercent).toBeCloseTo(33.33, 1)
  })

  it('explains the difference in words', () => {
    expect(MARGIN_VS_MARKUP).toContain('share of the selling price')
    expect(MARGIN_VS_MARKUP).toContain('33.3%')
  })
})

describe('fromMargin', () => {
  it('works backwards from a target margin', () => {
    const result = fromMargin(200, 40)
    expect(result.profit).toBe(80)
    expect(result.cost).toBe(120)
    expect(result.markupPercent).toBeCloseTo(66.67, 1)
  })

  it('rejects a margin at or above 100%', () => {
    expect(() => fromMargin(200, 100)).toThrow(/just under 100/)
    expect(() => fromMargin(200, 120)).toThrow(/just under 100/)
  })

  it('rejects a negative margin', () => {
    expect(() => fromMargin(200, -5)).toThrow(/just under 100/)
  })

  it('round-trips through fromRevenueCost', () => {
    const target = fromMargin(500, 35)
    const check = fromRevenueCost(target.revenue, target.cost)
    expect(check.marginPercent).toBeCloseTo(35, 1)
  })
})

describe('fromMarkup', () => {
  it('works forwards from a target markup', () => {
    const result = fromMarkup(80, 25)
    expect(result.revenue).toBe(100)
    expect(result.profit).toBe(20)
    expect(result.marginPercent).toBe(20)
  })

  it('handles a zero markup', () => {
    expect(fromMarkup(80, 0)).toMatchObject({ revenue: 80, profit: 0 })
  })

  it('rejects a negative markup', () => {
    expect(() => fromMarkup(80, -10)).toThrow(/negative/)
  })
})

describe('fromUnits', () => {
  it('scales a per-unit profit to a run', () => {
    const result = fromUnits(250, 150, 100)
    expect(result.profit).toBe(10_000)
    expect(result.marginPercent).toBe(40)
    expect(result.quantity).toBe(100)
  })

  it('refuses to sell below cost', () => {
    expect(() => fromUnits(100, 150, 10)).toThrow(/no profit/)
  })

  it('rejects a zero or negative quantity', () => {
    expect(() => fromUnits(100, 50, 0)).toThrow(/Quantity/)
    expect(() => fromUnits(100, 50, -3)).toThrow(/Quantity/)
  })

  it('keeps a fractional quantity rather than flooring it', () => {
    const result = fromUnits(100, 60, 2.5)
    expect(result.quantity).toBe(2.5)
    expect(result.profit).toBe(100)
  })
})

describe('breakeven', () => {
  it('computes the units needed to cover fixed costs', () => {
    // ₹50,000 fixed, ₹100 contribution per unit → 500 units.
    expect(breakeven(50_000, 200, 100).units).toBe(500)
  })

  it('rounds up to a whole unit', () => {
    expect(breakeven(50_001, 200, 100).units).toBe(501)
  })

  it('reports zero units when there are no fixed costs', () => {
    expect(breakeven(0, 200, 100).units).toBe(0)
  })

  it('refuses when each unit loses money', () => {
    expect(() => breakeven(10_000, 100, 150)).toThrow(/loses money/)
  })

  it('reports the revenue at breakeven', () => {
    expect(breakeven(50_000, 200, 100).revenueAtBreakeven).toBe(100_000)
  })
})

describe('bothFor and formatPercent', () => {
  it('returns both figures together', () => {
    expect(bothFor(150, 100)).toEqual({ marginPercent: 33.33, markupPercent: 50 })
  })

  it('returns zeros instead of throwing for a loss', () => {
    expect(bothFor(100, 150)).toEqual({ marginPercent: 0, markupPercent: 0 })
  })

  it('formats a percentage', () => {
    expect(formatPercent(33.333)).toBe('33.33%')
    expect(formatPercent(40)).toBe('40%')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})
