import { describe, expect, it } from 'vitest'
import {
  DURATION_UNITS,
  addToClock,
  formatClock,
  formatHms,
  formatHuman,
  formatRate,
  parseClock,
  parseDuration,
  rateFor,
  secondsToParts,
  subtractFromClock,
  toAllUnits,
} from './logic'

describe('parseDuration', () => {
  it('parses a unit-suffixed duration', () => {
    expect(parseDuration('2h 30m')).toEqual({ ok: true, seconds: 9000 })
  })

  it('parses a bare unit', () => {
    expect(parseDuration('90m')).toEqual({ ok: true, seconds: 5400 })
  })

  it('parses a decimal value', () => {
    expect(parseDuration('1.5h')).toEqual({ ok: true, seconds: 5400 })
  })

  it('parses a clock form with seconds', () => {
    expect(parseDuration('02:30:45')).toEqual({ ok: true, seconds: 9045 })
  })

  it('refuses an ambiguous two-part time instead of guessing', () => {
    const result = parseDuration('1:30')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Write 1h 30m')
  })

  it('parses comma-separated mixtures', () => {
    expect(parseDuration('1h, 15m, 30s')).toEqual({ ok: true, seconds: 4530 })
  })

  it('parses days and weeks', () => {
    expect(parseDuration('1d 12h')).toEqual({ ok: true, seconds: 129_600 })
    expect(parseDuration('2w')).toEqual({ ok: true, seconds: 1_209_600 })
  })

  it('accepts long unit names, with or without a space', () => {
    expect(parseDuration('45 minutes')).toEqual({ ok: true, seconds: 2700 })
    expect(parseDuration('45minutes')).toEqual({ ok: true, seconds: 2700 })
    expect(parseDuration('1 hour 30 minutes')).toEqual({ ok: true, seconds: 5400 })
    expect(parseDuration('1h 30m')).toEqual({ ok: true, seconds: 5400 })
  })

  it('accepts zero', () => {
    expect(parseDuration('0s')).toEqual({ ok: true, seconds: 0 })
  })

  it('rejects an empty value', () => {
    expect(parseDuration('  ')).toEqual({ ok: false, error: 'Enter a duration.' })
  })

  it('rejects a bare number rather than guessing a unit', () => {
    const result = parseDuration('90')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('has no unit')
  })

  it('rejects an unknown unit and names it', () => {
    const result = parseDuration('5x')
    if (!result.ok) expect(result.error).toContain('"x"')
    else throw new Error('should not parse')
  })

  it('rejects an unreadable token', () => {
    const result = parseDuration('about 3 hours')
    if (!result.ok) expect(result.error).toContain('Could not read')
    else throw new Error('should not parse')
  })

  it('rejects clock values above 59 minutes', () => {
    const result = parseDuration('02:75:00')
    if (!result.ok) expect(result.error).toContain('below 60')
    else throw new Error('should not parse')
  })
})

describe('formatting', () => {
  it('splits seconds into parts', () => {
    expect(secondsToParts(9045)).toEqual({ hours: 2, minutes: 30, seconds: 45 })
  })

  it('never reports a negative part', () => {
    expect(secondsToParts(-500)).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatHms(9045)).toBe('02:30:45')
  })

  it('drops the hour field below an hour', () => {
    expect(formatHms(1845)).toBe('30:45')
  })

  it('forces the hour field when asked', () => {
    expect(formatHms(1845, true)).toBe('00:30:45')
  })

  it('formats in words with correct plurals', () => {
    expect(formatHuman(9000)).toBe('2 hours 30 minutes')
    expect(formatHuman(3661)).toBe('1 hour 1 minute 1 second')
    expect(formatHuman(0)).toBe('0 seconds')
  })

  it('formats a duration in words', () => {
    expect(formatHuman(45)).toBe('45 seconds')
    expect(formatHuman(300)).toBe('5 minutes')
    expect(formatHuman(1)).toBe('1 second')
    expect(formatHuman(0)).toBe('0 seconds')
    expect(formatHuman(3600)).toBe('1 hour')
    expect(formatHuman(5400)).toBe('1 hour 30 minutes')
  })

  it('formats a rate for display', () => {
    expect(formatRate(12)).toBe('12')
    expect(formatRate(12.345)).toBe('12.35')
    expect(formatRate(1234.5)).toBe('1,234.5')
  })

  it('formats values in every unit', () => {
    const units = toAllUnits(3600)
    expect(units[0]).toEqual({ unit: 'seconds', label: 'Seconds', value: '3,600' })
    expect(units[1]).toEqual({ unit: 'minutes', label: 'Minutes', value: '60' })
    expect(units[2]).toEqual({ unit: 'hours', label: 'Hours', value: '1' })
    expect(DURATION_UNITS).toHaveLength(5)
  })
})

describe('parseClock', () => {
  it('parses a 24-hour time', () => {
    expect(parseClock('14:30')).toEqual({ ok: true, minutes: 870 })
  })

  it('parses a single-digit hour', () => {
    expect(parseClock('9:05')).toEqual({ ok: true, minutes: 545 })
  })

  it('parses am and pm', () => {
    expect(parseClock('2:30pm')).toEqual({ ok: true, minutes: 870 })
    expect(parseClock('9:30 AM')).toEqual({ ok: true, minutes: 570 })
  })

  it('handles midnight and noon', () => {
    expect(parseClock('12:00am')).toEqual({ ok: true, minutes: 0 })
    expect(parseClock('12:00pm')).toEqual({ ok: true, minutes: 720 })
  })

  it('accepts seconds and ignores them', () => {
    expect(parseClock('14:30:45')).toEqual({ ok: true, minutes: 870 })
  })

  it('rejects a bad format', () => {
    expect(parseClock('1430').ok).toBe(false)
    expect(parseClock('').ok).toBe(false)
  })

  it('rejects out-of-range values', () => {
    expect(parseClock('24:00').ok).toBe(false)
    expect(parseClock('14:75').ok).toBe(false)
    expect(parseClock('0:30pm').ok).toBe(false)
  })
})

describe('clock arithmetic', () => {
  it('formats a clock time', () => {
    expect(formatClock(870)).toBe('14:30')
    expect(formatClock(0)).toBe('00:00')
  })

  it('wraps past midnight', () => {
    expect(formatClock(1500)).toBe('01:00')
  })

  it('adds a duration within the same day', () => {
    const end = addToClock(9 * 60, 5400)
    expect(end.label).toBe('10:30')
    expect(end.crossesMidnight).toBe(false)
  })

  it('adds a duration across midnight and says so', () => {
    const end = addToClock(23 * 60, 3600)
    expect(end.label).toBe('00:00 (+1 day)')
    expect(end.dayOffset).toBe(1)
  })

  it('adds a multi-day duration', () => {
    expect(addToClock(8 * 60, 86_400 * 3).dayOffset).toBe(3)
  })

  it('keeps seconds when the shift is not whole minutes', () => {
    expect(addToClock(0, 90).label).toBe('00:01:30')
  })

  it('subtracts across midnight into the previous day', () => {
    const start = subtractFromClock(0, 3600)
    expect(start.label).toBe('23:00 (−1 day)')
    expect(start.crossesMidnight).toBe(true)
  })

  it('subtracts within the same day', () => {
    // 14:20 less 3h10m is 11:10.
    expect(subtractFromClock(14 * 60 + 20, 11_400).label).toBe('11:10')
  })
})

describe('rateFor', () => {
  it('computes a per-item rate', () => {
    const rate = rateFor(3600, 60)
    expect(rate?.secondsPerItem).toBe(60)
    expect(rate?.itemsPerHour).toBe(60)
  })

  it('returns null for a zero or invalid count', () => {
    expect(rateFor(3600, 0)).toBeNull()
    expect(rateFor(3600, -5)).toBeNull()
    expect(rateFor(3600, Number.NaN)).toBeNull()
  })

  it('returns null when the duration is zero', () => {
    expect(rateFor(0, 10)).toBeNull()
  })
})
