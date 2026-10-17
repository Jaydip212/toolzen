import { describe, expect, it } from 'vitest'

import {
  DECIMAL_BINARY_GAP,
  SIZE_UNITS,
  convertSize,
  explainGap,
  findUnit,
  formatSizeValue,
  summarise,
  toBytes,
} from './logic'

describe('findUnit', () => {
  it('finds a unit by id', () => {
    expect(findUnit('MB')?.bytes).toBe(1_000_000)
  })

  it('is case-insensitive', () => {
    expect(findUnit('mb')?.id).toBe('MB')
  })

  it('returns undefined for an unknown unit', () => {
    expect(findUnit('XB')).toBeUndefined()
  })
})

describe('convertSize', () => {
  it('converts one megabyte into every unit', () => {
    const rows = convertSize(1, 'MB')
    const byId = Object.fromEntries(rows.map((row) => [row.unit.id, row.value]))
    expect(byId.B).toBe(1_000_000)
    expect(byId.KB).toBe(1000)
    expect(byId.MB).toBe(1)
    expect(byId.GB).toBeCloseTo(0.001)
    expect(byId.KiB).toBeCloseTo(976.5625)
  })

  it('returns nine rows', () => {
    expect(convertSize(1, 'MB')).toHaveLength(SIZE_UNITS.length)
  })

  it('converts from bytes', () => {
    const rows = convertSize(1024, 'B')
    expect(rows.find((row) => row.unit.id === 'KiB')?.value).toBe(1)
    expect(rows.find((row) => row.unit.id === 'KB')?.value).toBeCloseTo(1.024)
  })

  it('handles zero', () => {
    const rows = convertSize(0, 'GB')
    for (const row of rows) expect(row.value).toBe(0)
  })

  it('rejects a negative value', () => {
    expect(() => convertSize(-1, 'MB')).toThrow(/negative/)
  })

  it('rejects a non-finite value', () => {
    expect(() => convertSize(Number.NaN, 'MB')).toThrow(/finite/)
    expect(() => convertSize(Number.POSITIVE_INFINITY, 'MB')).toThrow(/finite/)
  })

  it('rejects an unknown unit', () => {
    expect(() => convertSize(1, 'XB')).toThrow(/not a supported unit/)
  })

  it('round-trips through bytes', () => {
    const rows = convertSize(2, 'GiB')
    const bytes = rows.find((row) => row.unit.id === 'B')?.value ?? 0
    expect(bytes).toBe(2 * 1024 ** 3)
  })

  it('produces a display string for every row', () => {
    for (const row of convertSize(1, 'TB')) expect(row.display.length).toBeGreaterThan(0)
  })
})

describe('formatSizeValue', () => {
  it('groups thousands', () => {
    expect(formatSizeValue(1500)).toBe('1,500')
  })

  it('keeps two decimals for a value above one', () => {
    expect(formatSizeValue(1.234)).toBe('1.23')
  })

  it('drops decimals for a whole number', () => {
    expect(formatSizeValue(3)).toBe('3')
  })

  it('keeps four decimals for a small value', () => {
    expect(formatSizeValue(0.001234)).toBe('0.0012')
  })

  it('uses exponential notation for very small values', () => {
    expect(formatSizeValue(0.0000001)).toContain('e-')
  })

  it('handles zero', () => {
    expect(formatSizeValue(0)).toBe('0')
  })

  it('handles a non-finite value', () => {
    expect(formatSizeValue(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('toBytes', () => {
  it('multiplies by the unit size', () => {
    expect(toBytes(2, 'KiB')).toBe(2048)
  })

  it('throws for an unknown unit', () => {
    expect(() => toBytes(1, 'XB')).toThrow()
  })
})

describe('DECIMAL_BINARY_GAP', () => {
  it('is about 0.93 for the gigabyte ratio', () => {
    expect(DECIMAL_BINARY_GAP).toBeCloseTo(0.9313, 3)
  })
})

describe('explainGap', () => {
  it('names both unit families and the rough percentage', () => {
    const text = explainGap()
    expect(text).toContain('1 GB')
    expect(text).toContain('1 GiB')
    expect(text).toContain('7%')
  })
})

describe('summarise', () => {
  it('shows the value and the byte count', () => {
    expect(summarise(1.5, 'MB')).toBe('1.50 MB (1,500,000 bytes)')
  })

  it('returns a dash for an unknown unit', () => {
    expect(summarise(1, 'XB')).toBe('—')
  })
})
