import { describe, expect, it } from 'vitest'
import { calculateSplitBill, calculateTip, formatCents, splitCents } from './money'

describe('splitCents', () => {
  it('always sums back to the exact total', () => {
    for (const total of [1000, 1001, 999, 0, 12345]) {
      for (const people of [1, 2, 3, 7, 11]) {
        const shares = splitCents(total, people)
        expect(shares).toHaveLength(people)
        expect(shares.reduce((sum, share) => sum + share, 0)).toBe(total)
      }
    }
  })

  it('distributes the leftover pennies to the first shares', () => {
    expect(splitCents(1001, 3)).toEqual([334, 334, 333])
    const shares = splitCents(1001, 3)
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1)
  })
})

describe('calculateTip', () => {
  it('computes a standard 15% tip, in exact cents', () => {
    const result = calculateTip({ bill: 100, tipPercent: 15, people: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.billCents).toBe(10000)
    expect(result.result.tipCents).toBe(1500)
    expect(result.result.totalCents).toBe(11500)
  })

  it('handles decimal bills without float drift', () => {
    const result = calculateTip({ bill: 0.1 + 0.2, tipPercent: 10, people: 1 })
    expect(result.ok && result.result.billCents).toBe(30)
    expect(result.ok && result.result.tipCents).toBe(3)
  })

  it('splits the total exactly among people', () => {
    const result = calculateTip({ bill: 100, tipPercent: 0, people: 3 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.perPersonCents).toEqual([3334, 3333, 3333])
  })

  it('rejects negative bills, out-of-range percentages and bad people counts', () => {
    expect(calculateTip({ bill: -1, tipPercent: 10, people: 1 }).ok).toBe(false)
    expect(calculateTip({ bill: 10, tipPercent: 101, people: 1 }).ok).toBe(false)
    expect(calculateTip({ bill: 10, tipPercent: 10, people: 0 }).ok).toBe(false)
    expect(calculateTip({ bill: 10, tipPercent: 10, people: 2.5 }).ok).toBe(false)
    expect(calculateTip({ bill: Number.NaN, tipPercent: 10, people: 1 }).ok).toBe(false)
  })

  it('accepts zero', () => {
    expect(calculateTip({ bill: 0, tipPercent: 0, people: 1 })).toMatchObject({ ok: true })
  })
})

describe('calculateSplitBill', () => {
  it('adds the tip before splitting', () => {
    const result = calculateSplitBill({ total: 90, people: 2, tipPercent: 20 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.tipCents).toBe(1800)
    expect(result.result.totalCents).toBe(10800)
    expect(result.result.perPersonCents).toEqual([5400, 5400])
  })

  it('rejects invalid inputs', () => {
    expect(calculateSplitBill({ total: -5, people: 2, tipPercent: 0 }).ok).toBe(false)
    expect(calculateSplitBill({ total: 50, people: 0, tipPercent: 0 }).ok).toBe(false)
    expect(calculateSplitBill({ total: 50, people: 2, tipPercent: -1 }).ok).toBe(false)
  })
})

describe('formatCents', () => {
  it('formats cents as a two-decimal string', () => {
    expect(formatCents(12345)).toBe('123.45')
    expect(formatCents(5)).toBe('0.05')
  })
})
