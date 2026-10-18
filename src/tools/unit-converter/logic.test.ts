import { describe, expect, it } from 'vitest'
import { CATEGORIES, convert, convertTemperature, formatValue, temperatureWarning } from './logic'

describe('convert (factor categories)', () => {
  it('converts length across the chain', () => {
    expect(convert('length', 1, 'km', 'm')).toBe(1000)
    expect(convert('length', 1, 'in', 'cm')).toBeCloseTo(2.54, 10)
    expect(convert('length', 1, 'mi', 'ft')).toBeCloseTo(5280, 6)
  })

  it('converts weight', () => {
    expect(convert('mass', 1, 'kg', 'g')).toBe(1000)
    expect(convert('mass', 1, 'lb', 'oz')).toBeCloseTo(16, 6)
  })

  it('converts both data size families without mixing them', () => {
    expect(convert('data', 1, 'kb', 'b')).toBe(1000)
    expect(convert('data', 1, 'kib', 'b')).toBe(1024)
    expect(convert('data', 1, 'mb', 'kb')).toBe(1000)
    expect(convert('data', 1, 'mib', 'kib')).toBe(1024)
  })

  it('returns the same number for identical units', () => {
    expect(convert('length', 12.5, 'm', 'm')).toBe(12.5)
  })

  it('handles zero', () => {
    expect(convert('mass', 0, 'kg', 'lb')).toBe(0)
  })

  it('returns null for unknown units or categories', () => {
    expect(convert('length', 1, 'm', 'stone')).toBeNull()
    expect(convert('power', 1, 'w', 'kw')).toBeNull()
  })
})

describe('convertTemperature', () => {
  it('freezes and boils water where it should', () => {
    expect(convertTemperature(0, 'c', 'f')).toBe(32)
    expect(convertTemperature(100, 'c', 'f')).toBeCloseTo(212, 10)
    expect(convertTemperature(32, 'f', 'c')).toBe(0)
  })

  it('routes through Celsius correctly for kelvin', () => {
    expect(convertTemperature(0, 'c', 'k')).toBeCloseTo(273.15, 10)
    expect(convertTemperature(273.15, 'k', 'c')).toBeCloseTo(0, 10)
    expect(convertTemperature(-40, 'f', 'k')).toBeCloseTo(233.15, 6)
  })

  it('is the identity within one unit', () => {
    expect(convertTemperature(123.4, 'c', 'c')).toBe(123.4)
  })

  it('keeps negative values negative in Celsius', () => {
    expect(convertTemperature(-40, 'c', 'f')).toBeCloseTo(-40, 10)
  })
})

describe('temperatureWarning', () => {
  it('flags below absolute zero in any input unit', () => {
    expect(temperatureWarning(-300, 'c')).toContain('absolute zero')
    expect(temperatureWarning(-500, 'f')).toContain('absolute zero')
    expect(temperatureWarning(-1, 'k')).toContain('absolute zero')
  })

  it('accepts physically possible values, including absolute zero itself', () => {
    expect(temperatureWarning(-273.15, 'c')).toBeNull()
    expect(temperatureWarning(0, 'k')).toBeNull()
    expect(temperatureWarning(20, 'c')).toBeNull()
  })
})

describe('formatValue', () => {
  it('formats ordinary numbers readably', () => {
    expect(formatValue(1000)).toBe('1,000')
  })

  it('uses exponential notation for extremes only', () => {
    expect(formatValue(1e-12)).toContain('e')
    expect(formatValue(0.5)).toBe('0.5')
  })

  it('shows a dash for non-finite values', () => {
    expect(formatValue(Number.NaN)).toBe('—')
    expect(formatValue(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('dataset integrity', () => {
  it('has unique unit ids inside every category', () => {
    for (const category of CATEGORIES) {
      const ids = category.units.map((unit) => unit.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('uses base-unit factor 1 exactly once per category', () => {
    for (const category of CATEGORIES) {
      expect(category.units.filter((unit) => unit.factor === 1)).toHaveLength(1)
    }
  })
})
