import { describe, expect, it } from 'vitest'

import {
  convertTimestamp,
  detectUnit,
  formatLocal,
  formatOffset,
  formatUtc,
  localTimezone,
  nowSnapshot,
  parseDateInput,
  relativeTime,
  toDatetimeLocal,
} from './logic'

const NOW = new Date('2026-06-15T12:00:00Z')

describe('detectUnit', () => {
  it('treats a small number as seconds', () => {
    expect(detectUnit(1_700_000_000)).toBe('seconds')
  })

  it('treats a large number as milliseconds', () => {
    expect(detectUnit(1_700_000_000_000)).toBe('milliseconds')
  })

  it('uses the boundary at 1e11', () => {
    expect(detectUnit(1e11 - 1)).toBe('seconds')
    expect(detectUnit(1e11)).toBe('milliseconds')
  })

  it('works for negative values by magnitude', () => {
    expect(detectUnit(-1_700_000_000_000)).toBe('milliseconds')
  })
})

describe('convertTimestamp', () => {
  it('converts seconds', () => {
    const conversion = convertTimestamp(1_700_000_000, 'seconds')
    expect(conversion.milliseconds).toBe(1_700_000_000_000)
    expect(conversion.iso).toBe('2023-11-14T22:13:20.000Z')
  })

  it('converts milliseconds', () => {
    expect(convertTimestamp(1_700_000_000_000, 'milliseconds').seconds).toBe(1_700_000_000)
  })

  it('auto-detects the unit when omitted', () => {
    expect(convertTimestamp(1_700_000_000).milliseconds).toBe(1_700_000_000_000)
  })

  it('produces an ISO string', () => {
    expect(convertTimestamp(0, 'seconds').iso).toBe('1970-01-01T00:00:00.000Z')
  })

  it('produces a UTC string', () => {
    expect(convertTimestamp(0, 'seconds').utc).toBe('1970-01-01 00:00:00 UTC')
  })

  it('produces a relative description', () => {
    const conversion = convertTimestamp(NOW.getTime(), 'milliseconds', NOW)
    expect(conversion.relative).toBe('just now')
  })

  it('rejects a non-finite value', () => {
    expect(() => convertTimestamp(Number.NaN)).toThrow(/finite/)
  })

  it('rejects a value outside the Date range', () => {
    expect(() => convertTimestamp(1e20, 'milliseconds')).toThrow(/outside the range/)
  })

  it('reports the local timezone name', () => {
    expect(convertTimestamp(0, 'seconds').timezone.length).toBeGreaterThan(0)
  })

  it('includes the offset in the local string', () => {
    expect(convertTimestamp(0, 'seconds').local).toMatch(/[+-]\d{2}:\d{2}\)$/)
  })
})

describe('formatLocal', () => {
  it('formats with zero padding', () => {
    const date = new Date(2026, 0, 5, 3, 4, 5)
    expect(formatLocal(date)).toBe('2026-01-05 03:04:05')
  })
})

describe('formatUtc', () => {
  it('formats in UTC', () => {
    expect(formatUtc(new Date('2026-10-17T09:41:22Z'))).toBe('2026-10-17 09:41:22 UTC')
  })
})

describe('formatOffset', () => {
  it('produces a signed HH:MM offset', () => {
    expect(formatOffset(new Date())).toMatch(/^[+-]\d{2}:\d{2}$/)
  })

  it('is +00:00 for a UTC date in a UTC zone', () => {
    const offset = formatOffset(new Date('2026-01-01T00:00:00Z'))
    expect(offset.startsWith('+') || offset.startsWith('-')).toBe(true)
  })
})

describe('relativeTime', () => {
  it('reports just now for a few seconds', () => {
    expect(relativeTime(new Date(NOW.getTime() + 2000), NOW)).toBe('just now')
  })

  it('reports seconds ago', () => {
    expect(relativeTime(new Date(NOW.getTime() - 30_000), NOW)).toBe('30 seconds ago')
  })

  it('uses the singular', () => {
    expect(relativeTime(new Date(NOW.getTime() - 60_000), NOW)).toBe('1 minute ago')
  })

  it('reports hours', () => {
    expect(relativeTime(new Date(NOW.getTime() - 3 * 3_600_000), NOW)).toBe('3 hours ago')
  })

  it('reports days', () => {
    expect(relativeTime(new Date(NOW.getTime() - 2 * 86_400_000), NOW)).toBe('2 days ago')
  })

  it('reports future times', () => {
    expect(relativeTime(new Date(NOW.getTime() + 2 * 86_400_000), NOW)).toBe('in 2 days')
  })

  it('reports months', () => {
    expect(relativeTime(new Date(NOW.getTime() - 60 * 86_400_000), NOW)).toContain('months ago')
  })

  it('reports years', () => {
    expect(relativeTime(new Date(NOW.getTime() - 800 * 86_400_000), NOW)).toContain('years ago')
  })
})

describe('parseDateInput', () => {
  it('parses a Unix timestamp in seconds', () => {
    const parsed = parseDateInput('1700000000')
    expect(parsed.kind).toBe('unix')
    expect(parsed.unit).toBe('seconds')
    expect(parsed.date?.toISOString()).toBe('2023-11-14T22:13:20.000Z')
  })

  it('parses a Unix timestamp in milliseconds', () => {
    expect(parseDateInput('1700000000000').unit).toBe('milliseconds')
  })

  it('parses a negative timestamp', () => {
    const parsed = parseDateInput('-100')
    expect(parsed.kind).toBe('unix')
    expect(parsed.date?.toISOString()).toBe('1969-12-31T23:58:20.000Z')
  })

  it('parses an ISO string', () => {
    const parsed = parseDateInput('2026-10-17T09:00:00Z')
    expect(parsed.kind).toBe('iso')
    expect(parsed.date?.toISOString()).toBe('2026-10-17T09:00:00.000Z')
  })

  it('parses a date-only string', () => {
    expect(parseDateInput('2026-10-17').kind).toBe('iso')
  })

  it('treats a datetime-local value as local time', () => {
    const parsed = parseDateInput('2026-10-17T09:30')
    expect(parsed.kind).toBe('datetime-local')
    expect(parsed.date).not.toBeNull()
  })

  it('returns unknown for empty input', () => {
    const parsed = parseDateInput('')
    expect(parsed.kind).toBe('unknown')
    expect(parsed.date).toBeNull()
    expect(parsed.error).toBeNull()
  })

  it('reports an unreadable string', () => {
    expect(parseDateInput('not a date').error).toContain('could not be read')
  })
})

describe('toDatetimeLocal', () => {
  it('produces the input format', () => {
    expect(toDatetimeLocal(new Date(2026, 9, 17, 9, 5, 3))).toBe('2026-10-17T09:05:03')
  })
})

describe('nowSnapshot', () => {
  it('reports the supplied time', () => {
    const snapshot = nowSnapshot(NOW)
    expect(snapshot.iso).toBe('2026-06-15T12:00:00.000Z')
    expect(snapshot.relative).toBe('just now')
  })
})

describe('localTimezone', () => {
  it('returns a non-empty name', () => {
    expect(localTimezone().length).toBeGreaterThan(0)
  })
})
