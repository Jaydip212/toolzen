import { describe, expect, it } from 'vitest'
import { COMMON_TIME_ZONES, convertTimeZone, formatOffset, zoneOffsetMinutes } from './time-zones'

describe('zoneOffsetMinutes', () => {
  it('knows fixed and DST-varying zones', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const summer = new Date('2026-07-15T12:00:00Z')
    expect(zoneOffsetMinutes(winter, 'Asia/Kolkata')).toBe(330)
    expect(zoneOffsetMinutes(winter, 'Europe/London')).toBe(0)
    expect(zoneOffsetMinutes(summer, 'Europe/London')).toBe(60)
    expect(zoneOffsetMinutes(summer, 'America/New_York')).toBe(-240)
    expect(zoneOffsetMinutes(winter, 'UTC')).toBe(0)
  })
})

describe('formatOffset', () => {
  it('formats positive, negative and zero offsets', () => {
    expect(formatOffset(330)).toBe('UTC+05:30')
    expect(formatOffset(-240)).toBe('UTC-04:00')
    expect(formatOffset(0)).toBe('UTC+00:00')
  })
})

describe('convertTimeZone', () => {
  it('converts India to UTC in winter', () => {
    const result = convertTimeZone({ local: '2026-01-15T12:00', fromZone: 'Asia/Kolkata', toZone: 'UTC' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.local).toBe('2026-01-15 06:30')
    expect(result.result.fromOffset).toBe('UTC+05:30')
    expect(result.result.instant).toBe('2026-01-15T06:30:00.000Z')
  })

  it('respects daylight saving in London in summer', () => {
    const result = convertTimeZone({ local: '2026-07-15T12:00', fromZone: 'Europe/London', toZone: 'UTC' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.local).toBe('2026-07-15 11:00')
    expect(result.result.fromOffset).toBe('UTC+01:00')
  })

  it('converts between two non-UTC zones', () => {
    const result = convertTimeZone({ local: '2026-07-15T12:00', fromZone: 'Asia/Kolkata', toZone: 'America/New_York' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.local).toBe('2026-07-15 02:30')
    expect(result.result.toOffset).toBe('UTC-04:00')
  })

  it('is a no-op for the same zone', () => {
    const result = convertTimeZone({ local: '2026-03-01T09:45', fromZone: 'Asia/Kolkata', toZone: 'Asia/Kolkata' })
    expect(result.ok && result.result.local).toBe('2026-03-01 09:45')
  })

  it('rejects malformed input, impossible dates and unknown zones', () => {
    expect(convertTimeZone({ local: 'tomorrow', fromZone: 'UTC', toZone: 'UTC' }).ok).toBe(false)
    expect(convertTimeZone({ local: '2026-02-30T10:00', fromZone: 'UTC', toZone: 'UTC' }).ok).toBe(false)
    expect(convertTimeZone({ local: '2026-01-15T25:00', fromZone: 'UTC', toZone: 'UTC' }).ok).toBe(false)
    expect(convertTimeZone({ local: '2026-01-15T10:00', fromZone: 'Mars/Olympus', toZone: 'UTC' }).ok).toBe(false)
  })

  it('offers a curated list of real IANA zones', () => {
    expect(COMMON_TIME_ZONES).toContain('UTC')
    expect(COMMON_TIME_ZONES).toContain('Asia/Kolkata')
    expect(new Set(COMMON_TIME_ZONES).size).toBe(COMMON_TIME_ZONES.length)
  })
})
