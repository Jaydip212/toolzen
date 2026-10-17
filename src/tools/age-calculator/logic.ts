export interface AgeBreakdown {
  years: number
  months: number
  days: number
  /** Total whole months lived. */
  totalMonths: number
  totalWeeks: number
  totalDays: number
  totalHours: number
  /** Days until the next birthday, or 0 when today is the birthday. */
  daysToNextBirthday: number
  /** The date of the next birthday. */
  nextBirthday: Date
  /** True when today is the birthday. */
  isBirthday: boolean
  /** The weekday the person was born on. */
  bornOn: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** True for a leap year in the proleptic Gregorian calendar. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Days in a month, 1-based. */
export function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return lengths[month - 1] ?? 30
}

/** Midnight on the given date, in local time, so day maths is not skewed by the clock. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Whole days between two dates, ignoring time of day. */
export function daysBetween(from: Date, to: Date): number {
  const milliseconds = startOfDay(to).getTime() - startOfDay(from).getTime()
  return Math.round(milliseconds / 86_400_000)
}

/**
 * Add whole months to a date, clamping the day to the end of the target month.
 *
 * 31 January plus one month is 28 February (or 29 in a leap year), which is
 * exactly the rule used when reporting an age.
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const total = date.getMonth() + months
  const year = date.getFullYear() + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const day = Math.min(date.getDate(), daysInMonth(year, month + 1))
  return new Date(year, month, day)
}

/**
 * Exact age between two dates, in years, months and days.
 *
 * Months are counted first and the leftover days are measured from a clamped
 * month anchor, so 31 January to 1 March is 1 month and 1 day rather than a
 * day count that ignores month lengths. A reference date that lands on the
 * last day of its month counts as a whole month — which is what makes a
 * 29 February birthday fall due on 28 February in a non-leap year.
 */
export function ageBetween(birth: Date, reference: Date = new Date()): AgeBreakdown {
  const from = startOfDay(birth)
  const to = startOfDay(reference)

  if (Number.isNaN(from.getTime())) throw new Error('That birth date could not be read.')
  if (from.getTime() > to.getTime()) throw new Error('The birth date is in the future.')

  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  const endsOnLastDay = to.getDate() === daysInMonth(to.getFullYear(), to.getMonth() + 1)
  if (to.getDate() < from.getDate() && !endsOnLastDay) months -= 1
  if (months < 0) months = 0

  const anchor = addMonthsClamped(from, months)
  const days = daysBetween(anchor, to)
  const years = Math.floor(months / 12)
  const remainderMonths = months % 12

  const totalDays = daysBetween(from, to)
  const totalMonths = years * 12 + remainderMonths

  const nextBirthday = nextBirthdayDate(from, to)
  const daysToNextBirthday = daysBetween(to, nextBirthday)

  return {
    years,
    months: remainderMonths,
    days,
    totalMonths,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    totalHours: totalDays * 24,
    daysToNextBirthday,
    nextBirthday,
    isBirthday: daysToNextBirthday === 0,
    bornOn: WEEKDAYS[from.getDay()],
  }
}

/**
 * The next occurrence of the birthday on or after the reference date.
 *
 * A 29 February birthday falls on 28 February in a non-leap year, which is the
 * convention most legal systems use.
 */
export function nextBirthdayDate(birth: Date, reference: Date = new Date()): Date {
  const today = startOfDay(reference)
  const month = birth.getMonth()
  const day = birth.getDate()

  const candidate = (year: number): Date => {
    const clampedDay = Math.min(day, daysInMonth(year, month + 1))
    return new Date(year, month, clampedDay)
  }

  let next = candidate(today.getFullYear())
  if (next.getTime() < today.getTime()) next = candidate(today.getFullYear() + 1)
  return next
}

/** Parse a `YYYY-MM-DD` value from a date input. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null
  return new Date(year, month - 1, day)
}

/** Format a date as `17 October 2026`. */
export function formatDate(date: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

/** A one-line summary of the age. */
export function summariseAge(age: AgeBreakdown): string {
  const parts: string[] = []
  if (age.years > 0) parts.push(`${age.years} year${age.years === 1 ? '' : 's'}`)
  if (age.months > 0) parts.push(`${age.months} month${age.months === 1 ? '' : 's'}`)
  parts.push(`${age.days} day${age.days === 1 ? '' : 's'}`)
  return parts.join(', ')
}
