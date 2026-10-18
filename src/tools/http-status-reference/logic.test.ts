import { describe, expect, it } from 'vitest'
import { CLASS_LABELS, STATUS_CODES, searchStatusCodes, statusCodeByCode, type StatusClass } from './logic'

describe('dataset integrity', () => {
  it('has unique, in-range codes', () => {
    const codes = STATUS_CODES.map((entry) => entry.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) {
      expect(code).toBeGreaterThanOrEqual(100)
      expect(code).toBeLessThanOrEqual(599)
    }
  })

  it('uses only the five declared classes', () => {
    const classes: StatusClass[] = ['informational', 'success', 'redirection', 'client-error', 'server-error']
    for (const entry of STATUS_CODES) {
      expect(classes).toContain(entry.statusClass)
      expect(CLASS_LABELS[entry.statusClass]).toBeTruthy()
    }
  })

  it('keeps the HTTP class digit and the class label in agreement', () => {
    for (const entry of STATUS_CODES) {
      const digit = Math.floor(entry.code / 100)
      const expected: Record<number, StatusClass> = {
        1: 'informational',
        2: 'success',
        3: 'redirection',
        4: 'client-error',
        5: 'server-error',
      }
      expect(entry.statusClass).toBe(expected[digit])
    }
  })

  it('gives every entry a name and a meaningful description', () => {
    for (const entry of STATUS_CODES) {
      expect(entry.name.length).toBeGreaterThan(0)
      expect(entry.meaning.length).toBeGreaterThan(30)
    }
  })

  it('includes the codes people actually meet', () => {
    for (const code of [200, 301, 404, 500, 429, 503]) {
      expect(statusCodeByCode(code)).not.toBeNull()
    }
  })
})

describe('searchStatusCodes', () => {
  it('returns everything for an empty query', () => {
    expect(searchStatusCodes('')).toHaveLength(STATUS_CODES.length)
    expect(searchStatusCodes('   ')).toHaveLength(STATUS_CODES.length)
  })

  it('finds by code number, including mentions in meanings', () => {
    const results = searchStatusCodes('404')
    expect(results.map((entry) => entry.code)).toContain(404)
    // 410's meaning references 404, so a plain-text search finds both.
    expect(results.map((entry) => entry.code)).toContain(410)
  })

  it('finds by name fragment, case-insensitively', () => {
    expect(searchStatusCodes('MOVED').map((entry) => entry.code)).toContain(301)
  })

  it('finds by meaning text', () => {
    const results = searchStatusCodes('rate limited')
    expect(results.map((entry) => entry.code)).toContain(429)
  })

  it('returns nothing for gibberish instead of guessing', () => {
    expect(searchStatusCodes('zzzz')).toEqual([])
  })
})

describe('statusCodeByCode', () => {
  it('resolves an exact code', () => {
    const entry = statusCodeByCode(418)!
    expect(entry.name).toContain('teapot')
    expect(entry.statusClass).toBe('client-error')
  })

  it('returns null for unknown codes', () => {
    expect(statusCodeByCode(999)).toBeNull()
  })
})
