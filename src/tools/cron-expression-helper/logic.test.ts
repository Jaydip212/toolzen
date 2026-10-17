import { describe, expect, it } from 'vitest'
import {
  countFields,
  describeCron,
  nextRuns,
  parseCronFields,
  validateCron,
} from './logic'

describe('countFields', () => {
  it('counts whitespace-separated fields', () => {
    expect(countFields('* * * * *')).toBe(5)
    expect(countFields('0 0 1 1 0')).toBe(5)
  })

  it('tolerates extra whitespace', () => {
    expect(countFields('  *   *  * *  *  ')).toBe(5)
  })

  it('counts a seconds field', () => {
    expect(countFields('0 30 9 * * MON-FRI')).toBe(6)
  })
})

describe('validateCron', () => {
  it('accepts a standard five-field expression', () => {
    expect(validateCron('*/5 * * * *')).toBeNull()
  })

  it('accepts a six-field expression with seconds', () => {
    expect(validateCron('0 */5 * * * *')).toBeNull()
  })

  it('accepts ranges, lists, steps and names', () => {
    expect(validateCron('0 9-17 * * MON-FRI')).toBeNull()
    expect(validateCron('0 0 1,15 * *')).toBeNull()
    expect(validateCron('*/15 9-17 * JAN,JUN *')).toBeNull()
  })

  it('rejects an empty expression', () => {
    expect(validateCron('')).toMatch(/Enter a cron/)
    expect(validateCron('   ')).toMatch(/Enter a cron/)
  })

  it('rejects the wrong number of fields', () => {
    expect(validateCron('* * *')).toMatch(/5 fields/)
    expect(validateCron('* * * * * * *')).toMatch(/5 fields/)
  })

  it('rejects an out-of-range value', () => {
    expect(validateCron('99 * * * *')).toMatch(/range/)
  })

  it('rejects nonsense text', () => {
    expect(validateCron('not a cron at all')).not.toBeNull()
  })
})

describe('describeCron', () => {
  it('describes a simple schedule', () => {
    const result = describeCron('*/5 * * * *')
    expect(result.error).toBeNull()
    expect(result.description?.toLowerCase()).toContain('5 minutes')
  })

  it('describes a weekday schedule', () => {
    const result = describeCron('0 9 * * MON-FRI')
    expect(result.error).toBeNull()
    expect(result.description?.toLowerCase()).toContain('monday')
  })

  it('returns null for an empty expression', () => {
    expect(describeCron('')).toEqual({ description: null, error: null })
  })

  it('returns an error for an invalid expression', () => {
    expect(describeCron('99 * * * *').error).not.toBeNull()
  })
})

describe('nextRuns', () => {
  // 17 October 2026 is a Saturday.
  const saturday = new Date('2026-10-17T00:00:00Z')

  it('finds the next weekdays for a weekday schedule', () => {
    const result = nextRuns('0 9 * * MON-FRI', 3, saturday, 'UTC')
    expect(result.error).toBeNull()
    expect(result.runs.map((run) => run.toISOString())).toEqual([
      '2026-10-19T09:00:00.000Z',
      '2026-10-20T09:00:00.000Z',
      '2026-10-21T09:00:00.000Z',
    ])
  })

  it('finds the next midnights for a daily schedule', () => {
    const noon = new Date('2026-10-17T12:00:00Z')
    const result = nextRuns('0 0 * * *', 2, noon, 'UTC')
    expect(result.runs.map((run) => run.toISOString())).toEqual([
      '2026-10-18T00:00:00.000Z',
      '2026-10-19T00:00:00.000Z',
    ])
  })

  it('respects the requested count', () => {
    expect(nextRuns('* * * * *', 7, saturday, 'UTC').runs).toHaveLength(7)
  })

  it('clamps the count to a sane range', () => {
    expect(nextRuns('* * * * *', 0, saturday, 'UTC').runs).toHaveLength(1)
    expect(nextRuns('* * * * *', 999, saturday, 'UTC').runs).toHaveLength(50)
  })

  it('returns the validation error for an invalid expression', () => {
    const result = nextRuns('99 * * * *', 3, saturday, 'UTC')
    expect(result.runs).toEqual([])
    expect(result.error).not.toBeNull()
  })

  it('returns strictly increasing times', () => {
    const runs = nextRuns('*/7 * * * *', 5, saturday, 'UTC').runs
    for (let i = 1; i < runs.length; i += 1) {
      expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime())
    }
  })

  it('shifts results when the time zone changes', () => {
    const utc = nextRuns('0 9 * * *', 1, saturday, 'UTC').runs[0].toISOString()
    const kolkata = nextRuns('0 9 * * *', 1, saturday, 'Asia/Kolkata').runs[0].toISOString()
    expect(kolkata).not.toBe(utc)
  })
})

describe('parseCronFields', () => {
  it('names the five standard fields', () => {
    const fields = parseCronFields('*/5 * * * *')
    expect(fields.map((field) => field.name)).toEqual([
      'Minute',
      'Hour',
      'Day of month',
      'Month',
      'Day of week',
    ])
  })

  it('names the seconds field for a six-field expression', () => {
    expect(parseCronFields('0 */5 * * * *')[0].name).toBe('Second')
  })

  it('explains a wildcard', () => {
    expect(parseCronFields('* * * * *')[0].explanation).toBe('every value')
  })

  it('explains a step', () => {
    expect(parseCronFields('*/5 * * * *')[0].explanation).toBe('every 5 minutes')
  })

  it('explains a range', () => {
    expect(parseCronFields('0 9-17 * * *')[1].explanation).toBe('from 9 to 17')
  })

  it('explains a list', () => {
    expect(parseCronFields('0 0 1,15 * *')[2].explanation).toBe('any of 1, 15')
  })

  it('explains a range with a step', () => {
    expect(parseCronFields('0 0-30/5 * * *')[1].explanation).toBe('every 5 from 0 to 30')
  })

  it('translates month names', () => {
    expect(parseCronFields('0 0 1 JAN *')[3].explanation).toBe('at January')
  })

  it('translates weekday names', () => {
    expect(parseCronFields('0 9 * * MON-FRI')[4].explanation).toBe('from Monday to Friday')
  })

  it('returns an empty array for the wrong field count', () => {
    expect(parseCronFields('* * *')).toEqual([])
  })
})
