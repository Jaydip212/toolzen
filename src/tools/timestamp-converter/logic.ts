export type TimestampUnit = 'seconds' | 'milliseconds'

export interface Conversion {
  seconds: number
  milliseconds: number
  iso: string
  /** Local time in the viewer's own zone, including the zone name. */
  local: string
  /** UTC time, in a stable readable form. */
  utc: string
  relative: string
  timezone: string
}

/**
 * Decide whether a bare number is seconds or milliseconds.
 *
 * 1e11 seconds is the year 5138 and 1e11 milliseconds is 1973, so the
 * boundary sits comfortably between any realistic value of either.
 */
export function detectUnit(value: number): TimestampUnit {
  return Math.abs(value) >= 1e11 ? 'milliseconds' : 'seconds'
}

/** The local time-zone name, falling back to the UTC offset. */
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
  } catch {
    return 'local'
  }
}

/** Format a date as `2026-10-17 09:41:22` in the local zone. */
export function formatLocal(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** Format a date as `2026-10-17 07:41:22 UTC`. */
export function formatUtc(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
  )
}

/** The UTC offset in `+05:30` form. */
export function formatOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const rest = String(absolute % 60).padStart(2, '0')
  return `${sign}${hours}:${rest}`
}

/**
 * A relative description such as "3 hours ago" or "in 2 days".
 *
 * Deliberately coarse: anything beyond about a month is reported in months and
 * years rather than pretending to day-level precision.
 */
export function relativeTime(target: Date, now: Date = new Date()): string {
  const deltaSeconds = Math.round((target.getTime() - now.getTime()) / 1000)
  const past = deltaSeconds < 0
  const magnitude = Math.abs(deltaSeconds)

  const phrase = (value: number, unit: string): string => {
    const rounded = Math.round(value)
    const plural = `${rounded} ${unit}${rounded === 1 ? '' : 's'}`
    return past ? `${plural} ago` : `in ${plural}`
  }

  if (magnitude < 5) return 'just now'
  if (magnitude < 60) return phrase(magnitude, 'second')
  if (magnitude < 3600) return phrase(magnitude / 60, 'minute')
  if (magnitude < 86400) return phrase(magnitude / 3600, 'hour')
  if (magnitude < 2592000) return phrase(magnitude / 86400, 'day')
  if (magnitude < 31536000) return phrase(magnitude / 2592000, 'month')
  return phrase(magnitude / 31536000, 'year')
}

/** Build the full conversion for a numeric timestamp. */
export function convertTimestamp(value: number, unit?: TimestampUnit, now: Date = new Date()): Conversion {
  if (!Number.isFinite(value)) throw new Error('Enter a finite number.')

  const resolved = unit ?? detectUnit(value)
  const milliseconds = resolved === 'seconds' ? value * 1000 : value
  const date = new Date(milliseconds)

  if (Number.isNaN(date.getTime())) {
    throw new Error('That value is outside the range JavaScript dates can represent.')
  }

  return {
    seconds: Math.floor(milliseconds / 1000),
    milliseconds: Math.round(milliseconds),
    iso: date.toISOString(),
    local: `${formatLocal(date)} (${formatOffset(date)})`,
    utc: formatUtc(date),
    relative: relativeTime(date, now),
    timezone: localTimezone(),
  }
}

export type InputKind = 'unix' | 'iso' | 'datetime-local' | 'unknown'

export interface ParsedInput {
  kind: InputKind
  date: Date | null
  error: string | null
  /** The unit that was inferred for a numeric input. */
  unit: TimestampUnit | null
}

/**
 * Parse whatever the user typed.
 *
 * A bare integer is a Unix timestamp; anything with a `T` or a date-like shape
 * is parsed as ISO 8601. A `YYYY-MM-DDTHH:mm` value (what a datetime-local
 * input produces) is treated as local time, matching the control's own meaning.
 */
export function parseDateInput(input: string): ParsedInput {
  const trimmed = input.trim()
  if (trimmed === '') return { kind: 'unknown', date: null, error: null, unit: null }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const value = Number(trimmed)
    const unit = detectUnit(value)
    try {
      const conversion = convertTimestamp(value, unit)
      return { kind: 'unix', date: new Date(conversion.milliseconds), error: null, unit }
    } catch (error) {
      return {
        kind: 'unix',
        date: null,
        error: error instanceof Error ? error.message : String(error),
        unit,
      }
    }
  }

  // datetime-local form: no zone, interpreted as local time.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const date = new Date(trimmed)
    return Number.isNaN(date.getTime())
      ? { kind: 'datetime-local', date: null, error: 'That date could not be read.', unit: null }
      : { kind: 'datetime-local', date, error: null, unit: null }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return {
      kind: 'unknown',
      date: null,
      error:
        'That could not be read as a date. Try a Unix timestamp, an ISO 8601 string such as 2026-10-17T09:00:00Z, or 2026-10-17.',
      unit: null,
    }
  }

  return { kind: 'iso', date, error: null, unit: null }
}

/** The `datetime-local` string for a date, in local time. */
export function toDatetimeLocal(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** Current time in every representation, for the "now" panel. */
export function nowSnapshot(now: Date = new Date()): Conversion {
  return convertTimestamp(now.getTime(), 'milliseconds', now)
}
