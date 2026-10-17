import { describe, expect, it } from 'vitest'

import {
  filterHeaders,
  groupHeaders,
  headersToCurl,
  headersToJson,
  headersToObject,
  parseHeaderBlock,
  shellQuote,
  sortHeaders,
  summariseResponse,
  type HeaderPair,
} from './logic'

const SAMPLE: HeaderPair[] = [
  { name: 'Content-Type', value: 'text/html; charset=utf-8' },
  { name: 'Access-Control-Allow-Origin', value: '*' },
  { name: 'Cache-Control', value: 'max-age=3600' },
  { name: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { name: 'Server', value: 'nginx' },
  { name: 'X-Custom-Thing', value: 'hello' },
  { name: 'Set-Cookie', value: 'a=1' },
]

describe('groupHeaders', () => {
  it('buckets known headers', () => {
    const groups = groupHeaders(SAMPLE)
    const byId = Object.fromEntries(groups.map((group) => [group.id, group.headers.map((header) => header.name)]))
    expect(byId.cors).toEqual(['Access-Control-Allow-Origin'])
    expect(byId.security).toEqual(['Strict-Transport-Security'])
    expect(byId.caching).toEqual(['Cache-Control'])
    expect(byId.content).toEqual(['Content-Type'])
    expect(byId.cookies).toEqual(['Set-Cookie'])
    expect(byId.routing).toEqual(['Server'])
    expect(byId.other).toEqual(['X-Custom-Thing'])
  })

  it('never drops a header', () => {
    const total = groupHeaders(SAMPLE).reduce((sum, group) => sum + group.headers.length, 0)
    expect(total).toBe(SAMPLE.length)
  })

  it('omits empty groups', () => {
    const groups = groupHeaders([{ name: 'Server', value: 'nginx' }])
    expect(groups).toHaveLength(1)
    expect(groups[0].id).toBe('routing')
  })

  it('returns an empty list for no headers', () => {
    expect(groupHeaders([])).toEqual([])
  })

  it('matches header names case-insensitively', () => {
    const groups = groupHeaders([{ name: 'CACHE-CONTROL', value: 'no-store' }])
    expect(groups[0].id).toBe('caching')
  })

  it('treats a cross-origin header as CORS rather than security', () => {
    const groups = groupHeaders([{ name: 'Cross-Origin-Opener-Policy', value: 'same-origin' }])
    expect(groups[0].id).toBe('security')
  })
})

describe('sortHeaders', () => {
  it('sorts case-insensitively', () => {
    const sorted = sortHeaders([{ name: 'b', value: '1' }, { name: 'A', value: '2' }])
    expect(sorted.map((header) => header.name)).toEqual(['A', 'b'])
  })

  it('does not mutate the input', () => {
    const input = [{ name: 'b', value: '1' }, { name: 'a', value: '2' }]
    sortHeaders(input)
    expect(input[0].name).toBe('b')
  })
})

describe('filterHeaders', () => {
  it('returns everything for a blank query', () => {
    expect(filterHeaders(SAMPLE, '   ')).toHaveLength(SAMPLE.length)
  })

  it('matches on the name', () => {
    expect(filterHeaders(SAMPLE, 'cache').map((header) => header.name)).toEqual(['Cache-Control'])
  })

  it('matches on the value', () => {
    expect(filterHeaders(SAMPLE, 'nginx').map((header) => header.name)).toEqual(['Server'])
  })

  it('is case-insensitive', () => {
    expect(filterHeaders(SAMPLE, 'CONTENT-TYPE')).toHaveLength(1)
  })

  it('returns nothing when there is no match', () => {
    expect(filterHeaders(SAMPLE, 'zzzz')).toEqual([])
  })
})

describe('headersToObject', () => {
  it('builds a plain object', () => {
    expect(headersToObject([{ name: 'a', value: '1' }])).toEqual({ a: '1' })
  })

  it('joins repeated headers with a comma', () => {
    expect(
      headersToObject([
        { name: 'set-cookie', value: 'a=1' },
        { name: 'set-cookie', value: 'b=2' },
      ]),
    ).toEqual({ 'set-cookie': 'a=1, b=2' })
  })

  it('returns an empty object for no headers', () => {
    expect(headersToObject([])).toEqual({})
  })
})

describe('headersToJson', () => {
  it('pretty-prints', () => {
    expect(headersToJson([{ name: 'a', value: '1' }])).toBe('{\n  "a": "1"\n}')
  })
})

describe('shellQuote', () => {
  it('leaves simple values alone', () => {
    expect(shellQuote('https://example.com/a')).toBe('https://example.com/a')
  })

  it('quotes a value with spaces', () => {
    expect(shellQuote('max-age=1; includeSubDomains')).toBe("'max-age=1; includeSubDomains'")
  })

  it('escapes an embedded single quote', () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'")
  })
})

describe('headersToCurl', () => {
  it('starts with a HEAD request', () => {
    expect(headersToCurl('https://example.com', []).startsWith('curl -sSI https://example.com')).toBe(true)
  })

  it('adds one -H per header', () => {
    const command = headersToCurl('https://example.com', [
      { name: 'Accept', value: 'application/json' },
      { name: 'X-Token', value: 'abc' },
    ])
    expect(command).toContain("-H 'Accept: application/json'")
    expect(command).toContain("-H 'X-Token: abc'")
  })

  it('skips response-only headers', () => {
    const command = headersToCurl('https://example.com', [
      { name: 'content-length', value: '123' },
      { name: 'server', value: 'nginx' },
      { name: 'Accept', value: 'text/html' },
    ])
    expect(command).not.toContain('content-length')
    expect(command).not.toContain('server:')
    expect(command).toContain('Accept')
  })

  it('falls back to an example URL', () => {
    expect(headersToCurl('  ', [])).toContain('example.com')
  })

  it('joins lines with a backslash continuation', () => {
    const command = headersToCurl('https://example.com', [{ name: 'Accept', value: 'text/html' }])
    expect(command).toContain(' \\\n')
  })
})

describe('summariseResponse', () => {
  it('includes the status and count', () => {
    expect(summariseResponse(200, SAMPLE)).toBe('200 — 7 headers')
  })

  it('uses the singular for one header', () => {
    expect(summariseResponse(200, [{ name: 'a', value: '1' }])).toBe('200 — 1 header')
  })

  it('omits the status when there was no status line', () => {
    expect(summariseResponse(null, [{ name: 'a', value: '1' }])).toBe('1 header parsed')
  })
})

describe('parseHeaderBlock re-export', () => {
  it('is the same parser used by the headers checker', () => {
    expect(parseHeaderBlock('HTTP/1.1 200 OK\nserver: nginx').status).toBe(200)
  })
})
