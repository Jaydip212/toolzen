export interface DurationParts {
  hours: number
  minutes: number
  seconds: number
}

export type DurationParse =
  | { ok: true; seconds: number }
  | { ok: false; error: string }

export type ClockParse =
  | { ok: true; minutes: number }
  | { ok: false; error: string }

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86_400,
  day: 86_400,
  days: 86_400,
  w: 604_800,
  week: 604_800,
  weeks: 604_800,
}

/**
 * Parse a duration written the way people actually write them.
 *
 * Accepts `2h 30m`, `90m`, `1.5h`, `02:30:45` and comma-separated mixtures.
 * Every token must carry a unit or a full `HH:MM:SS` clock position. A bare
 * `90` is ambiguous between seconds, minutes and hours, and a two-part `1:30`
 * is ambiguous between 1 hour 30 minutes and 1 minute 30 seconds — both are
 * rejected with instructions rather than guessed at.
 */
export function parseDuration(text: string): DurationParse {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, error: 'Enter a duration.' }

  // "1 hour 30 minutes" is how people write it, so glue a number to the word
  // that follows it before splitting on whitespace.
  const glued = trimmed.replace(/(\d)\s+([a-zA-Z])/g, '$1$2')
  const tokens = glued.split(/[\s,]+/).filter(Boolean)
  let total = 0

  for (const token of tokens) {
    if (/^\d{1,2}:\d{2}$/.test(token)) {
      return {
        ok: false,
        error: `"${token}" could be 1 hour 30 minutes or 1 minute 30 seconds. Write 1h 30m, or use the full 01:30:00 form.`,
      }
    }

    if (/^\d{1,3}:\d{2}:\d{2}$/.test(token)) {
      const [hours, minutes, seconds] = token.split(':').map(Number)
      if (minutes > 59 || seconds > 59) {
        return { ok: false, error: `"${token}" is not a valid time — minutes and seconds must be below 60.` }
      }
      total += hours * 3600 + minutes * 60 + seconds
      continue
    }

    const match = /^(\d+(?:\.\d+)?)([a-zA-Z]*)$/.exec(token)
    if (!match) {
      return {
        ok: false,
        error: `Could not read "${token}". Try 2h 30m, 90m, 1.5h or 02:30:45.`,
      }
    }

    const value = Number(match[1])
    const unit = match[2].toLowerCase()

    if (unit === '') {
      return {
        ok: false,
        error: `"${token}" has no unit. Add s, m, h or d — for example ${Math.round(value)}m.`,
      }
    }
    const secondsPerUnit = UNIT_SECONDS[unit]
    if (!secondsPerUnit) {
      return { ok: false, error: `"${match[2]}" is not a unit I know. Use s, m, h, d or w.` }
    }
    total += value * secondsPerUnit
  }

  if (!Number.isFinite(total) || total < 0) {
    return { ok: false, error: 'That is not a duration I can use.' }
  }
  return { ok: true, seconds: total }
}

/** Split a number of seconds into hours, minutes and seconds. */
export function secondsToParts(total: number): DurationParts {
  const safe = Math.max(0, Math.round(total))
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  }
}

/** `02:30:45`, dropping the hour field below one hour unless forced. */
export function formatHms(total: number, forceHours = false): string {
  const { hours, minutes, seconds } = secondsToParts(total)
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 || forceHours ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/** `2 hours 30 minutes`, omitting zero units but never returning an empty string. */
export function formatHuman(total: number): string {
  const { hours, minutes, seconds } = secondsToParts(total)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  return parts.join(' ')
}

const UNITS: Array<{ value: UnitKey; label: string; divisor: number }> = [
  { value: 'seconds', label: 'Seconds', divisor: 1 },
  { value: 'minutes', label: 'Minutes', divisor: 60 },
  { value: 'hours', label: 'Hours', divisor: 3600 },
  { value: 'days', label: 'Days', divisor: 86_400 },
  { value: 'weeks', label: 'Weeks', divisor: 604_800 },
]

export type UnitKey = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks'

export const DURATION_UNITS = UNITS

/** The same duration expressed in every unit. */
export function toAllUnits(total: number): Array<{ unit: UnitKey; label: string; value: string }> {
  return UNITS.map((entry) => ({
    unit: entry.value,
    label: entry.label,
    value: formatValue(total / entry.divisor),
  }))
}

function formatValue(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toLocaleString('en-US')
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Parse a 24-hour clock time, optionally with `am`/`pm`.
 *
 * `14:30`, `2:30pm`, `9:05 AM` and `14:30:45` all work.
 */
export function parseClock(text: string): ClockParse {
  const trimmed = text.trim().toLowerCase()
  if (trimmed === '') return { ok: false, error: 'Enter a time.' }

  const meridiem = /(am|pm)$/.exec(trimmed)
  const body = (meridiem ? trimmed.slice(0, meridiem.index) : trimmed).trim()
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(body)
  if (!match) return { ok: false, error: 'Use a 24-hour time like 14:30, or 2:30pm.' }

  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (minutes > 59) return { ok: false, error: 'Minutes must be below 60.' }

  if (meridiem) {
    if (hours < 1 || hours > 12) return { ok: false, error: 'With am/pm, the hour must be 1 to 12.' }
    if (meridiem[1] === 'pm' && hours !== 12) hours += 12
    if (meridiem[1] === 'am' && hours === 12) hours = 0
  }
  if (hours > 23) return { ok: false, error: 'Hours must be below 24.' }

  return { ok: true, minutes: hours * 60 + minutes }
}

/** A clock time back into a display string. */
export function formatClock(minutes: number): string {
  const within = ((minutes % 1440) + 1440) % 1440
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(within / 60))}:${pad(within % 60)}`
}

export interface ClockEnd {
  /** Clock time after shifting, with the day roll shown when there is one. */
  label: string
  /** Signed number of days rolled past midnight. */
  dayOffset: number
  /** True when the end time lands on a different day than the start. */
  crossesMidnight: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Shift a clock time by a signed number of seconds.
 *
 * Both the add and the subtract path go through this, so they can never drift
 * apart, and seconds are kept in the label when the shift is not whole minutes.
 */
function shiftClock(startMinutes: number, deltaSeconds: number): ClockEnd {
  const totalSeconds = Math.round(startMinutes * 60 + deltaSeconds)
  const dayOffset = Math.floor(totalSeconds / 86_400)
  const within = ((totalSeconds % 86_400) + 86_400) % 86_400

  const hours = Math.floor(within / 3600)
  const minutes = Math.floor((within % 3600) / 60)
  const seconds = within % 60

  const base = `${pad(hours)}:${pad(minutes)}`
  const clock = seconds > 0 ? `${base}:${pad(seconds)}` : base
  const sign = dayOffset > 0 ? '+' : '−'
  const label = dayOffset === 0 ? clock : `${clock} (${sign}${Math.abs(dayOffset)} day${Math.abs(dayOffset) === 1 ? '' : 's'})`

  return { label, dayOffset, crossesMidnight: dayOffset !== 0 }
}

/** The clock time `seconds` after the given start. */
export function addToClock(startMinutes: number, seconds: number): ClockEnd {
  return shiftClock(startMinutes, seconds)
}

/** The clock time `seconds` before the given start. */
export function subtractFromClock(startMinutes: number, seconds: number): ClockEnd {
  return shiftClock(startMinutes, -seconds)
}

export interface Rate {
  /** Seconds for one item. */
  secondsPerItem: number
  itemsPerHour: number
  itemsPerMinute: number
}

/** How many items fit in a duration, or null when the count is not usable. */
export function rateFor(seconds: number, items: number): Rate | null {
  if (!Number.isFinite(items) || items <= 0) return null
  const secondsPerItem = seconds / items
  if (secondsPerItem <= 0) return null
  return {
    secondsPerItem,
    itemsPerHour: 3600 / secondsPerItem,
    itemsPerMinute: 60 / secondsPerItem,
  }
}

/** Round a rate to two decimals for display. */
export function formatRate(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toLocaleString('en-US')
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
