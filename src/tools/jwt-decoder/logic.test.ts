import { describe, expect, it } from 'vitest'
import {
  JwtError,
  base64UrlDecode,
  base64UrlEncode,
  decodeJwt,
  describeAlgorithm,
  describeClaims,
  formatDuration,
  jwtStatus,
} from './logic'

/** The well-known jwt.io example token. */
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

describe('base64UrlEncode and base64UrlDecode', () => {
  it('round trips ASCII', () => {
    expect(base64UrlDecode(base64UrlEncode('hello world'))).toBe('hello world')
  })

  it('round trips UTF-8', () => {
    const text = 'café — naïve — 日本語 — 😀'
    expect(base64UrlDecode(base64UrlEncode(text))).toBe(text)
  })

  it('produces no padding characters', () => {
    expect(base64UrlEncode('a')).not.toContain('=')
  })

  it('uses the URL-safe alphabet', () => {
    // Bytes that would produce + and / in standard Base64.
    const encoded = base64UrlEncode(String.fromCharCode(0xfb, 0xff, 0xbf))
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
  })

  it('decodes input without padding', () => {
    expect(base64UrlDecode('aGVsbG8')).toBe('hello')
  })

  it('throws on invalid Base64', () => {
    expect(() => base64UrlDecode('!!!not base64!!!')).toThrow(JwtError)
  })
})

describe('decodeJwt', () => {
  it('decodes the header', () => {
    const decoded = decodeJwt(SAMPLE)
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' })
  })

  it('decodes the payload', () => {
    const decoded = decodeJwt(SAMPLE)
    expect(decoded.payload).toMatchObject({
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    })
  })

  it('keeps the signature segment', () => {
    expect(decodeJwt(SAMPLE).signature).toBe(
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    )
  })

  it('trims surrounding whitespace', () => {
    expect(decodeJwt(`  ${SAMPLE}  `).header.alg).toBe('HS256')
  })

  it('throws for an empty token', () => {
    expect(() => decodeJwt('')).toThrow(JwtError)
    expect(() => decodeJwt('   ')).toThrow(JwtError)
  })

  it('throws when the segment count is wrong', () => {
    expect(() => decodeJwt('only.two')).toThrow(/three dot-separated segments/)
    expect(() => decodeJwt('a.b.c.d')).toThrow(/three dot-separated segments/)
  })

  it('throws when a segment is not valid JSON', () => {
    // "hello" base64url-encodes to aGVsbG8, which is not JSON.
    expect(() => decodeJwt('aGVsbG8.aGVsbG8.sig')).toThrow(/not valid JSON/)
  })

  it('throws when the payload is not an object', () => {
    const header = base64UrlEncode('{"alg":"none"}')
    const arrayPayload = base64UrlEncode('[1,2,3]')
    expect(() => decodeJwt(`${header}.${arrayPayload}.sig`)).toThrow(/must be a JSON object/)
  })

  it('accepts a token with an empty signature', () => {
    const header = base64UrlEncode('{"alg":"none"}')
    const payload = base64UrlEncode('{"sub":"x"}')
    expect(decodeJwt(`${header}.${payload}.`).signature).toBe('')
  })
})

describe('describeClaims', () => {
  it('labels the registered claims and orders them first', () => {
    const rows = describeClaims({ custom: 'x', sub: 'abc', iss: 'toolzen' })
    expect(rows[0].key).toBe('iss')
    expect(rows[1].key).toBe('sub')
    expect(rows[0].label).toBe('Issuer')
    expect(rows[2].key).toBe('custom')
  })

  it('renders numeric date claims as readable dates', () => {
    const rows = describeClaims({ iat: 1516239022 })
    expect(rows[0].human).toBe(new Date(1516239022 * 1000).toUTCString())
  })

  it('does not add a human form to non-date claims', () => {
    expect(describeClaims({ sub: 'abc' })[0].human).toBeUndefined()
  })

  it('stringifies objects and arrays', () => {
    const rows = describeClaims({ roles: ['admin', 'user'] })
    expect(rows[0].value).toBe('["admin","user"]')
  })

  it('returns an empty list for an empty payload', () => {
    expect(describeClaims({})).toEqual([])
  })
})

describe('jwtStatus', () => {
  const now = Date.UTC(2026, 0, 1) // 1 Jan 2026

  it('reports an expired token', () => {
    const past = Math.floor(now / 1000) - 3600
    const status = jwtStatus({ exp: past }, now)
    expect(status.expired).toBe(true)
    expect(status.secondsUntilExpiry).toBeLessThan(0)
  })

  it('reports a valid token', () => {
    const future = Math.floor(now / 1000) + 3600
    const status = jwtStatus({ exp: future }, now)
    expect(status.expired).toBe(false)
    expect(status.secondsUntilExpiry).toBe(3600)
  })

  it('returns null expiry when there is no exp claim', () => {
    const status = jwtStatus({}, now)
    expect(status.expired).toBeNull()
    expect(status.expiresAt).toBeNull()
    expect(status.secondsUntilExpiry).toBeNull()
  })

  it('detects a token that is not valid yet', () => {
    const future = Math.floor(now / 1000) + 3600
    expect(jwtStatus({ nbf: future }, now).notYetValid).toBe(true)
    expect(jwtStatus({ nbf: Math.floor(now / 1000) - 3600 }, now).notYetValid).toBe(false)
  })

  it('returns null notBefore when there is no nbf claim', () => {
    expect(jwtStatus({}, now).notYetValid).toBeNull()
  })

  it('converts the claims into Date objects', () => {
    const status = jwtStatus({ iat: 1516239022, exp: 1893456000, nbf: 1516239022 }, now)
    expect(status.issuedAt?.getTime()).toBe(1516239022 * 1000)
    expect(status.expiresAt?.getTime()).toBe(1893456000 * 1000)
    expect(status.notBefore?.getTime()).toBe(1516239022 * 1000)
  })

  it('treats an expiry exactly at now as expired', () => {
    const seconds = Math.floor(now / 1000)
    expect(jwtStatus({ exp: seconds }, now).expired).toBe(true)
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30 seconds from now')
    expect(formatDuration(1)).toBe('1 second from now')
  })

  it('formats minutes', () => {
    expect(formatDuration(120)).toBe('2 minutes from now')
  })

  it('formats hours', () => {
    expect(formatDuration(7200)).toBe('2 hours from now')
  })

  it('formats days', () => {
    expect(formatDuration(86400 * 3)).toBe('3 days from now')
  })

  it('formats years', () => {
    expect(formatDuration(31557600 * 2)).toBe('2.0 years from now')
  })

  it('describes negative durations as being in the past', () => {
    expect(formatDuration(-120)).toBe('2 minutes ago')
  })
})

describe('describeAlgorithm', () => {
  it('describes HMAC algorithms', () => {
    expect(describeAlgorithm({ alg: 'HS256' })).toContain('symmetric HMAC')
  })

  it('describes RSA algorithms', () => {
    expect(describeAlgorithm({ alg: 'RS256' })).toContain('asymmetric RSA')
  })

  it('describes ECDSA algorithms', () => {
    expect(describeAlgorithm({ alg: 'ES256' })).toContain('ECDSA')
  })

  it('flags an unsigned token loudly', () => {
    expect(describeAlgorithm({ alg: 'none' })).toContain('NOT signed')
  })

  it('handles a missing alg', () => {
    expect(describeAlgorithm({})).toContain('No `alg` field')
  })

  it('handles an unknown algorithm', () => {
    expect(describeAlgorithm({ alg: 'XYZ' })).toContain('not a recognised')
  })
})
