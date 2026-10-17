export interface DateDifference {
  years: number
  months: number
  days: number
  /** Whole days from the start date to the end date. */
  totalDays: number
  weeks: number
  /** Weekdays in the range, counting the end date but not the start date. */
  businessDays: number
  weekendDays: number
  leapDays: number
  /** True when the end date is earlier than the start date. */
  reverse: boolean
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

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return lengths[month - 1] ?? 30
}

/** Midnight on the given date, so the clock cannot skew a whole-day count. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Whole days from `from` to `to`, negative when `to` is earlier. */
export function daysBetween(from: Date, to: Date): number {
  const milliseconds = startOfDay(to).getTime() - startOfDay(from).getTime()
  return Math.round(milliseconds / 86_400_000)
}

/** True for Saturday and Sunday. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Weekdays in the half-open range (from, to] — the convention used by payment
 * terms and delivery estimates, where the start day itself is not counted.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  const total = daysBetween(from, to)
  if (total <= 0) return 0
  let count = 0
  for (let offset = 1; offset <= total; offset += 1) {
    const date = new Date(startOfDay(from))
    date.setDate(date.getDate() + offset)
    if (!isWeekend(date)) count += 1
  }
  return count
}

/** 29 Februarys in the half-open range (from, to]. */
export function leapDaysBetween(from: Date, to: Date): number {
  const total = daysBetween(from, to)
  if (total <= 0) return 0
  let count = 0
  for (let offset = 1; offset <= total; offset += 1) {
    const date = new Date(startOfDay(from))
    date.setDate(date.getDate() + offset)
    if (date.getMonth() === 1 && date.getDate() === 29) count += 1
  }
  return count
}

/** Add months, clamping the day to the last day of the target month. */
export function addMonthsClamped(date: Date, months: number): Date {
  const total = date.getMonth() + months
  const year = date.getFullYear() + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const day = Math.min(date.getDate(), daysInMonth(year, month + 1))
  return new Date(year, month, day)
}

/**
 * The gap between two dates in calendar years, months and days, plus counts.
 *
 * The calendar breakdown comes from a clamped month anchor rather than by
 * dividing days, so month lengths are respected.
 */
export function difference(from: Date, to: Date): DateDifference {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('Both dates have to be readable.')
  }

  const reverse = startOfDay(to).getTime() < startOfDay(from).getTime()
  const start = reverse ? startOfDay(to) : startOfDay(from)
  const end = reverse ? startOfDay(from) : startOfDay(to)

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  const endsOnLastDay = end.getDate() === daysInMonth(end.getFullYear(), end.getMonth() + 1)
  if (end.getDate() < start.getDate() && !endsOnLastDay) months -= 1
  if (months < 0) months = 0

  const anchor = addMonthsClamped(start, months)
  const days = daysBetween(anchor, end)
  const totalDays = daysBetween(start, end)

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    totalDays,
    weeks: Math.floor(totalDays / 7),
    businessDays: businessDaysBetween(start, end),
    weekendDays: totalDays - businessDaysBetween(start, end),
    leapDays: leapDaysBetween(start, end),
    reverse,
  }
}

/**
 * Week, month and year conversions.
 *
 * Only "days" and "weeks" are exact. Months and years are averages, and the
 * labels say so — a 30-day answer is not the same as "one month".
 */
export const UNITS: Array<{ value: UnitKey; label: string; divisor: number }> = [
  { value: 'days', label: 'Days', divisor: 1 },
  { value: 'weeks', label: 'Weeks', divisor: 7 },
  { value: 'months', label: 'Months', divisor: 30.436875 },
  { value: 'years', label: 'Years', divisor: 365.2425 },
]

export type UnitKey = 'days' | 'weeks' | 'months' | 'years'

/** Whole days converted to the chosen unit, rounded to two decimals. */
export function inUnit(totalDays: number, unit: UnitKey): number {
  const entry = UNITS.find((candidate) => candidate.value === unit) ?? UNITS[0]
  const value = totalDays / entry.divisor
  return Math.round(value * 100) / 100
}

/** Whether a unit is an approximation rather than an exact count. */
export function isApproximate(unit: UnitKey): boolean {
  return unit === 'months' || unit === 'years'
}

/** A one-line summary such as "3 years, 2 months, 5 days (1160 days)". */
export function describeDifference(diff: DateDifference): string {
  const parts: string[] = []
  if (diff.years > 0) parts.push(`${diff.years} year${diff.years === 1 ? '' : 's'}`)
  if (diff.months > 0) parts.push(`${diff.months} month${diff.months === 1 ? '' : 's'}`)
  parts.push(`${diff.days} day${diff.days === 1 ? '' : 's'}`)
  const head = parts.join(', ')
  const tail = diff.reverse ? ' (the second date is earlier)' : ''
  return `${head}${tail} — ${diff.totalDays.toLocaleString('en-US')} day${diff.totalDays === 1 ? '' : 's'} in total`
}

/** Milestones the span crosses, for a sense of scale. */
export const MILESTONES: Array<{ days: number; label: string }> = [
  { days: 1, label: 'A day' },
  { days: 7, label: 'A week' },
  { days: 30, label: 'A month' },
  { days: 100, label: '100 days' },
  { days: 365, label: 'A year' },
  { days: 1000, label: '1,000 days' },
  { days: 3650, label: 'A decade' },
  { days: 10_000, label: '10,000 days' },
]

/** The next milestone strictly beyond the given day count, or null past 10,000. */
export function nextMilestone(totalDays: number): { days: number; label: string } | null {
  return MILESTONES.find((milestone) => milestone.days > Math.abs(totalDays)) ?? null
}

/** `count` weekdays after `start`, skipping Saturdays and Sundays. */
export function addBusinessDays(start: Date, count: number): Date {
  const date = startOfDay(start)
  if (count <= 0) return date
  let remaining = Math.floor(count)
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    if (!isWeekend(date)) remaining -= 1
  }
  return date
}

/** `count` weekdays before `start`, skipping Saturdays and Sundays. */
export function subtractBusinessDays(start: Date, count: number): Date {
  const date = startOfDay(start)
  if (count <= 0) return date
  let remaining = Math.floor(count)
  while (remaining > 0) {
    date.setDate(date.getDate() - 1)
    if (!isWeekend(date)) remaining -= 1
  }
  return date
}

const MONTHS = [
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

/** Format a date as `17 October 2026`. */
export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** Today's date at midnight, for defaulting the form. */
export function today(): Date {
  return startOfDay(new Date())
}
