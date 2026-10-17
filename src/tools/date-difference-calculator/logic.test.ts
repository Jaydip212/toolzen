import { describe, expect, it } from 'vitest'
import {
  UNITS,
  addBusinessDays,
  businessDaysBetween,
  daysBetween,
  describeDifference,
  difference,
  formatDate,
  inUnit,
  isApproximate,
  isLeapYear,
  nextMilestone,
  parseDateInput,
  subtractBusinessDays,
} from './logic'

describe('isLeapYear and daysInMonth', () => {
  it('handles century rules', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2026)).toBe(false)
  })
})

describe('parseDateInput', () => {
  it('parses a valid date', () => {
    expect(parseDateInput('2026-10-17')?.getFullYear()).toBe(2026)
  })

  it('rejects bad formats and impossible dates', () => {
    expect(parseDateInput('2026-2-3')).toBeNull()
    expect(parseDateInput('2026-13-01')).toBeNull()
    expect(parseDateInput('2026-02-29')).toBeNull()
    expect(parseDateInput('not a date')).toBeNull()
  })

  it('accepts 29 February in a leap year', () => {
    expect(parseDateInput('2024-02-29')?.getMonth()).toBe(1)
  })
})

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(30)
  })

  it('counts a leap day inside the range', () => {
    expect(daysBetween(new Date(2024, 1, 28), new Date(2024, 2, 1))).toBe(2)
  })

  it('counts a full year correctly either side of a leap year', () => {
    expect(daysBetween(new Date(2024, 0, 1), new Date(2025, 0, 1))).toBe(366)
    expect(daysBetween(new Date(2025, 0, 1), new Date(2026, 0, 1))).toBe(365)
  })
})

describe('difference', () => {
  it('reports calendar years, months and days', () => {
    const diff = difference(new Date(2023, 0, 1), new Date(2026, 2, 6))
    expect(diff.years).toBe(3)
    expect(diff.months).toBe(2)
    expect(diff.days).toBe(5)
    expect(diff.totalDays).toBe(1160)
  })

  it('respects month lengths when borrowing days', () => {
    const diff = difference(new Date(2026, 0, 31), new Date(2026, 2, 1))
    expect(diff.months).toBe(1)
    expect(diff.days).toBe(1)
    expect(diff.totalDays).toBe(29)
  })

  it('returns zero for the same day', () => {
    const diff = difference(new Date(2026, 5, 1), new Date(2026, 5, 1))
    expect(diff.years + diff.months + diff.days).toBe(0)
    expect(diff.totalDays).toBe(0)
    expect(diff.businessDays).toBe(0)
  })

  it('flags a reversed range but still reports the size', () => {
    const diff = difference(new Date(2026, 5, 10), new Date(2026, 5, 1))
    expect(diff.reverse).toBe(true)
    expect(diff.totalDays).toBe(9)
  })

  it('counts weekend days alongside business days', () => {
    // Monday to the following Monday is 7 days: 5 business, 2 weekend.
    const diff = difference(new Date(2026, 9, 12), new Date(2026, 9, 19))
    expect(diff.totalDays).toBe(7)
    expect(diff.businessDays).toBe(5)
    expect(diff.weekendDays).toBe(2)
  })

  it('excludes the start day and includes the end day', () => {
    // A Saturday start, Sunday end: only the Sunday is counted, and it is a weekend day.
    const diff = difference(new Date(2026, 9, 17), new Date(2026, 9, 18))
    expect(diff.totalDays).toBe(1)
    expect(diff.businessDays).toBe(0)
    expect(diff.weekendDays).toBe(1)
  })

  it('counts leap days inside the range', () => {
    const diff = difference(new Date(2024, 0, 1), new Date(2025, 0, 1))
    expect(diff.leapDays).toBe(1)
    const none = difference(new Date(2026, 0, 1), new Date(2027, 0, 1))
    expect(none.leapDays).toBe(0)
  })

  it('rejects unreadable dates', () => {
    expect(() => difference(new Date('nope'), new Date(2026, 0, 1))).toThrow()
  })
})

describe('businessDaysBetween and addBusinessDays', () => {
  it('skips a weekend inside a working week', () => {
    // Monday 12 Oct 2026 to Friday 16 Oct 2026.
    expect(businessDaysBetween(new Date(2026, 9, 12), new Date(2026, 9, 16))).toBe(4)
  })

  it('counts across two weekends', () => {
    expect(businessDaysBetween(new Date(2026, 9, 12), new Date(2026, 9, 26))).toBe(10)
  })

  it('adds business days across a weekend', () => {
    // Five business days after Friday 16 October is Friday 23 October.
    const result = addBusinessDays(new Date(2026, 9, 16), 5)
    expect(formatDate(result)).toBe('23 October 2026')
  })

  it('adds one business day after a Friday as Monday', () => {
    expect(formatDate(addBusinessDays(new Date(2026, 9, 16), 1))).toBe('19 October 2026')
  })

  it('subtracts business days back across a weekend', () => {
    expect(formatDate(subtractBusinessDays(new Date(2026, 9, 19), 1))).toBe('16 October 2026')
  })

  it('ignores a zero count', () => {
    expect(formatDate(addBusinessDays(new Date(2026, 9, 16), 0))).toBe('16 October 2026')
  })
})

describe('units', () => {
  it('converts days to weeks exactly', () => {
    expect(inUnit(70, 'weeks')).toBe(10)
  })

  it('labels months and years as approximations', () => {
    expect(isApproximate('months')).toBe(true)
    expect(isApproximate('years')).toBe(true)
    expect(isApproximate('days')).toBe(false)
    expect(isApproximate('weeks')).toBe(false)
  })

  it('converts a year using the average Gregorian year', () => {
    expect(inUnit(365, 'years')).toBe(1)
    expect(inUnit(366, 'years')).toBe(1)
  })

  it('exposes four units', () => {
    expect(UNITS.map((unit) => unit.value)).toEqual(['days', 'weeks', 'months', 'years'])
  })
})

describe('describeDifference and nextMilestone', () => {
  it('summarises with the total', () => {
    const diff = difference(new Date(2023, 0, 1), new Date(2026, 2, 6))
    expect(describeDifference(diff)).toBe('3 years, 2 months, 5 days — 1,160 days in total')
  })

  it('notes a reversed range', () => {
    const diff = difference(new Date(2026, 5, 10), new Date(2026, 5, 1))
    expect(describeDifference(diff)).toContain('the second date is earlier')
  })

  it('finds the next milestone', () => {
    expect(nextMilestone(50)?.label).toBe('100 days')
    expect(nextMilestone(0)?.label).toBe('A day')
  })

  it('returns null past the largest milestone', () => {
    expect(nextMilestone(20_000)).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats without padding', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('5 January 2026')
  })
})
