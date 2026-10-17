import { describe, expect, it } from 'vitest'
import {
  ageBetween,
  daysBetween,
  daysInMonth,
  formatDate,
  isLeapYear,
  nextBirthdayDate,
  parseDateInput,
  startOfDay,
  summariseAge,
} from './logic'

describe('isLeapYear', () => {
  it('accepts ordinary leap years', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(1996)).toBe(true)
  })

  it('rejects century years that are not divisible by 400', () => {
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2100)).toBe(false)
  })

  it('accepts century years divisible by 400', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(2400)).toBe(true)
  })
})

describe('daysInMonth', () => {
  it('knows February in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2023, 2)).toBe(28)
  })

  it('knows 30 and 31 day months', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 1)).toBe(31)
    expect(daysInMonth(2026, 12)).toBe(31)
  })
})

describe('startOfDay and daysBetween', () => {
  it('strips the time of day', () => {
    const date = startOfDay(new Date(2026, 9, 17, 23, 59, 59))
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })

  it('counts whole days across a month boundary', () => {
    expect(daysBetween(new Date(2026, 0, 31), new Date(2026, 1, 1))).toBe(1)
  })

  it('ignores the clock when counting', () => {
    expect(daysBetween(new Date(2026, 0, 1, 23, 0), new Date(2026, 0, 2, 1, 0))).toBe(1)
  })

  it('returns a negative count when the range is reversed', () => {
    expect(daysBetween(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBe(-1)
  })

  it('counts a full non-leap year as 365 days', () => {
    expect(daysBetween(new Date(2025, 0, 1), new Date(2026, 0, 1))).toBe(365)
  })

  it('counts a leap year as 366 days', () => {
    expect(daysBetween(new Date(2024, 0, 1), new Date(2025, 0, 1))).toBe(366)
  })
})

describe('ageBetween', () => {
  it('computes an exact age on the birthday', () => {
    const age = ageBetween(new Date(1990, 4, 15), new Date(2026, 4, 15))
    expect(age.years).toBe(36)
    expect(age.months).toBe(0)
    expect(age.days).toBe(0)
    expect(age.isBirthday).toBe(true)
  })

  it('computes an age the day before the birthday', () => {
    const age = ageBetween(new Date(1990, 4, 15), new Date(2026, 4, 14))
    expect(age.years).toBe(35)
    expect(age.months).toBe(11)
    // 15 April to 14 May is 29 days, not 30 — April has 30 days.
    expect(age.days).toBe(29)
  })

  it('borrows days from the previous month', () => {
    const age = ageBetween(new Date(1990, 0, 31), new Date(2026, 2, 1))
    expect(age.years).toBe(36)
    expect(age.months).toBe(1)
    expect(age.days).toBe(1)
  })

  it('handles a birth on 29 February in a non-leap year', () => {
    const age = ageBetween(new Date(2000, 1, 29), new Date(2026, 1, 28))
    expect(age.years).toBe(26)
    expect(age.months).toBe(0)
    expect(age.days).toBe(0)
    expect(age.isBirthday).toBe(true)
  })

  it('reports totals consistently', () => {
    const age = ageBetween(new Date(2000, 0, 1), new Date(2026, 9, 17))
    expect(age.totalDays).toBe(daysBetween(new Date(2000, 0, 1), new Date(2026, 9, 17)))
    expect(age.totalWeeks).toBe(Math.floor(age.totalDays / 7))
    expect(age.totalHours).toBe(age.totalDays * 24)
    expect(age.totalMonths).toBe(age.years * 12 + age.months)
  })

  it('names the weekday of birth', () => {
    expect(ageBetween(new Date(2000, 0, 1), new Date(2026, 0, 1)).bornOn).toBe('Saturday')
  })

  it('reports zero days to the next birthday when today is the birthday', () => {
    const age = ageBetween(new Date(1990, 9, 17), new Date(2026, 9, 17))
    expect(age.daysToNextBirthday).toBe(0)
    expect(age.nextBirthday.getTime()).toBe(new Date(2026, 9, 17).getTime())
  })

  it('counts down to next year when this year has passed', () => {
    const age = ageBetween(new Date(1990, 9, 17), new Date(2026, 9, 18))
    expect(age.daysToNextBirthday).toBe(364)
    expect(age.nextBirthday.getFullYear()).toBe(2027)
  })

  it('rejects a future birth date', () => {
    expect(() => ageBetween(new Date(2030, 0, 1), new Date(2026, 0, 1))).toThrow(/future/)
  })

  it('rejects an unreadable date', () => {
    expect(() => ageBetween(new Date('nope'), new Date(2026, 0, 1))).toThrow(/could not be read/)
  })
})

describe('nextBirthdayDate', () => {
  it('falls back to 28 February for a 29 February birthday in a non-leap year', () => {
    const next = nextBirthdayDate(new Date(2000, 1, 29), new Date(2026, 0, 1))
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28)
    expect(next.getFullYear()).toBe(2026)
  })

  it('uses 29 February in a leap year', () => {
    const next = nextBirthdayDate(new Date(2000, 1, 29), new Date(2028, 0, 1))
    expect(next.getDate()).toBe(29)
  })
})

describe('parseDateInput', () => {
  it('parses a valid date', () => {
    const parsed = parseDateInput('2026-10-17')
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(9)
    expect(parsed?.getDate()).toBe(17)
  })

  it('rejects an impossible day', () => {
    expect(parseDateInput('2026-02-30')).toBeNull()
  })

  it('rejects a 29 February outside a leap year', () => {
    expect(parseDateInput('2026-02-29')).toBeNull()
  })

  it('rejects a bad format', () => {
    expect(parseDateInput('17/10/2026')).toBeNull()
    expect(parseDateInput('')).toBeNull()
  })

  it('rejects a month out of range', () => {
    expect(parseDateInput('2026-13-01')).toBeNull()
  })
})

describe('formatDate and summariseAge', () => {
  it('formats a date readably', () => {
    expect(formatDate(new Date(2026, 9, 17))).toBe('17 October 2026')
  })

  it('summarises years, months and days', () => {
    const age = ageBetween(new Date(1990, 0, 15), new Date(2026, 9, 17))
    expect(summariseAge(age)).toBe('36 years, 9 months, 2 days')
  })

  it('omits zero years and months', () => {
    const age = ageBetween(new Date(2026, 9, 17), new Date(2026, 9, 17))
    expect(summariseAge(age)).toBe('0 days')
  })

  it('uses singular units for one', () => {
    const age = ageBetween(new Date(2025, 8, 16), new Date(2026, 9, 17))
    expect(summariseAge(age)).toBe('1 year, 1 month, 1 day')
  })
})
