import { describe, expect, it } from 'vitest'
import {
  GST_RATES,
  addGst,
  describeInvoice,
  describeSupply,
  rateFrom,
  removeGst,
} from './logic'

describe('addGst', () => {
  it('splits the tax in half within a state', () => {
    const result = addGst(10_000, 18)
    expect(result.net).toBe(10_000)
    expect(result.tax).toBe(1800)
    expect(result.gross).toBe(11_800)
    expect(result.cgst).toBe(900)
    expect(result.sgst).toBe(900)
    expect(result.igst).toBe(0)
  })

  it('charges the full rate as IGST between states', () => {
    const result = addGst(10_000, 18, 'inter')
    expect(result.cgst).toBe(0)
    expect(result.sgst).toBe(0)
    expect(result.igst).toBe(1800)
    expect(result.gross).toBe(11_800)
  })

  it('adds nothing at a zero rate', () => {
    const result = addGst(5000, 0)
    expect(result.tax).toBe(0)
    expect(result.gross).toBe(5000)
  })

  it('rounds a half paise to the nearest paisa', () => {
    const result = addGst(333.33, 18)
    expect(result.tax).toBe(60)
    expect(result.gross).toBe(393.33)
  })

  it('keeps CGST and SGST adding up to the tax', () => {
    const result = addGst(1234.56, 12)
    expect(result.cgst + result.sgst).toBeCloseTo(result.tax, 1)
  })
})

describe('removeGst', () => {
  it('recovers the net from a gross figure', () => {
    const result = removeGst(11_800, 18)
    expect(result.net).toBe(10_000)
    expect(result.tax).toBe(1800)
  })

  it('does not overstate the tax the way a flat percentage would', () => {
    // 18% of 11,800 is 2,124 — wrong. The tax is 1,800.
    const result = removeGst(11_800, 18)
    expect(result.tax).toBe(1800)
    expect(result.tax).not.toBe(2124)
  })

  it('leaves a zero rate alone', () => {
    const result = removeGst(500, 0)
    expect(result.net).toBe(500)
    expect(result.tax).toBe(0)
  })

  it('splits a recovered tax in half within a state', () => {
    const result = removeGst(11_800, 18)
    expect(result.cgst).toBe(900)
    expect(result.sgst).toBe(900)
  })
})

describe('round-trip', () => {
  it('survives add then remove at every slab', () => {
    for (const rate of GST_RATES) {
      const gross = addGst(1234.56, rate).gross
      const back = removeGst(gross, rate).net
      expect(back).toBeCloseTo(1234.56, 1)
    }
  })
})

describe('validation', () => {
  it('rejects a negative amount', () => {
    expect(() => addGst(-1, 18)).toThrow(/zero or more/)
  })

  it('rejects an out-of-range rate', () => {
    expect(() => addGst(100, 120)).toThrow(/0% and 100%/)
    expect(() => addGst(100, -5)).toThrow(/0% and 100%/)
  })

  it('rejects a non-numeric amount', () => {
    expect(() => removeGst(Number.NaN, 18)).toThrow(/zero or more/)
  })
})

describe('descriptions', () => {
  it('explains the supply type', () => {
    expect(describeSupply('intra')).toContain('CGST and SGST')
    expect(describeSupply('inter')).toContain('IGST')
  })

  it('summarises an invoice line', () => {
    expect(describeInvoice(addGst(10_000, 18))).toBe(
      'Taxable value ₹10,000 + CGST + SGST ₹1,800 @ 18% = ₹11,800',
    )
    expect(describeInvoice(addGst(10_000, 18, 'inter'))).toContain('IGST ₹1,800')
  })
})

describe('rateFrom', () => {
  it('recovers a rate from net and gross', () => {
    expect(rateFrom(10_000, 11_800)).toBe(18)
  })

  it('returns null when the numbers cannot be a rate', () => {
    expect(rateFrom(0, 100)).toBeNull()
    expect(rateFrom(100, 50)).toBeNull()
    expect(rateFrom(Number.NaN, 100)).toBeNull()
  })
})

describe('GST_RATES', () => {
  it('is ascending and includes the common slabs', () => {
    expect([...GST_RATES].sort((a, b) => a - b)).toEqual(GST_RATES)
    expect(GST_RATES).toContain(5)
    expect(GST_RATES).toContain(18)
    expect(GST_RATES).toContain(28)
  })
})
