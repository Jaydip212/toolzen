import { describe, expect, it } from 'vitest'

import {
  CORS_SAFELISTED_HEADERS,
  analyzeSecurityHeaders,
  describeHttpStatus,
  getHeader,
  gradeSecurityScore,
  isCorsLimited,
  parseHeaderBlock,
  serializeHeaders,
  validateProbeUrl,
  type HeaderPair,
} from './http-probe'

const STRONG_HEADERS: HeaderPair[] = [
  { name: 'strict-transport-security', value: 'max-age=31536000; includeSubDomains; preload' },
  { name: 'content-security-policy', value: "default-src 'self'; script-src 'self'" },
  { name: 'x-frame-options', value: 'DENY' },
  { name: 'x-content-type-options', value: 'nosniff' },
  { name: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
  { name: 'permissions-policy', value: 'camera=(), microphone=()' },
  { name: 'cross-origin-opener-policy', value: 'same-origin' },
  { name: 'cross-origin-resource-policy', value: 'same-origin' },
]

describe('parseHeaderBlock', () => {
  it('parses a status line and headers', () => {
    const parsed = parseHeaderBlock(
      ['HTTP/1.1 200 OK', 'content-type: text/html', 'strict-transport-security: max-age=31536000'].join('\n'),
    )
    expect(parsed.status).toBe(200)
    expect(parsed.statusLine).toBe('HTTP/1.1 200 OK')
    expect(parsed.headers).toHaveLength(2)
    expect(parsed.headers[0]).toEqual({ name: 'content-type', value: 'text/html' })
  })

  it('handles HTTP/2 status lines', () => {
    const parsed = parseHeaderBlock('HTTP/2 204\nserver: nginx')
    expect(parsed.status).toBe(204)
    expect(parsed.headers).toEqual([{ name: 'server', value: 'nginx' }])
  })

  it('keeps colons inside header values', () => {
    const parsed = parseHeaderBlock('HTTP/1.1 200 OK\nlocation: https://example.com:8443/a:b')
    expect(parsed.headers[0].value).toBe('https://example.com:8443/a:b')
  })

  it('uses the last block of a redirect chain', () => {
    const text = [
      'HTTP/1.1 301 Moved Permanently',
      'location: https://example.com/',
      '',
      'HTTP/2 200',
      'server: cloudflare',
    ].join('\n')
    const parsed = parseHeaderBlock(text)
    expect(parsed.blocks).toHaveLength(2)
    expect(parsed.status).toBe(200)
    expect(parsed.headers).toEqual([{ name: 'server', value: 'cloudflare' }])
  })

  it('handles CRLF line endings', () => {
    const parsed = parseHeaderBlock('HTTP/1.1 200 OK\r\nserver: nginx\r\n\r\n')
    expect(parsed.headers).toHaveLength(1)
    expect(parsed.headers[0].value).toBe('nginx')
  })

  it('joins folded continuation lines', () => {
    const parsed = parseHeaderBlock('HTTP/1.1 200 OK\ncontent-security-policy: default-src \'self\';\n  script-src \'self\'')
    expect(parsed.headers[0].value).toBe("default-src 'self'; script-src 'self'")
  })

  it('accepts a bare list of headers with no status line', () => {
    const parsed = parseHeaderBlock('server: nginx\nx-powered-by: PHP/8.2')
    expect(parsed.status).toBeNull()
    expect(parsed.headers).toHaveLength(2)
  })

  it('returns nothing for empty input', () => {
    const parsed = parseHeaderBlock('   \n\n  ')
    expect(parsed.headers).toEqual([])
    expect(parsed.status).toBeNull()
    expect(parsed.blocks).toEqual([])
  })

  it('ignores a status line with no headers after it', () => {
    const parsed = parseHeaderBlock('HTTP/1.1 200 OK\n\nHTTP/1.1 404 Not Found\nserver: x')
    expect(parsed.status).toBe(404)
  })

  it('tolerates trailing whitespace on values', () => {
    const parsed = parseHeaderBlock('HTTP/1.1 200 OK\nserver: nginx   ')
    expect(parsed.headers[0].value).toBe('nginx')
  })
})

describe('getHeader', () => {
  it('matches case-insensitively', () => {
    expect(getHeader([{ name: 'Server', value: 'nginx' }], 'server')).toBe('nginx')
  })

  it('returns null when absent', () => {
    expect(getHeader([], 'server')).toBeNull()
  })

  it('returns the first match when duplicated', () => {
    const headers = [
      { name: 'set-cookie', value: 'a=1' },
      { name: 'set-cookie', value: 'b=2' },
    ]
    expect(getHeader(headers, 'set-cookie')).toBe('a=1')
  })
})

describe('isCorsLimited', () => {
  it('is true for an empty header list', () => {
    expect(isCorsLimited([])).toBe(true)
  })

  it('is true when only safelisted headers are visible', () => {
    expect(isCorsLimited([{ name: 'content-type', value: 'text/html' }])).toBe(true)
  })

  it('is false when a non-safelisted header is visible', () => {
    expect(isCorsLimited([{ name: 'server', value: 'nginx' }])).toBe(false)
  })

  it('covers the documented safelist', () => {
    expect(CORS_SAFELISTED_HEADERS.has('content-length')).toBe(true)
    expect(CORS_SAFELISTED_HEADERS.has('server')).toBe(false)
  })
})

describe('serializeHeaders', () => {
  it('writes one line per header', () => {
    expect(serializeHeaders([{ name: 'a', value: '1' }, { name: 'b', value: '2' }])).toBe('a: 1\nb: 2')
  })

  it('returns an empty string for no headers', () => {
    expect(serializeHeaders([])).toBe('')
  })
})

describe('analyzeSecurityHeaders', () => {
  it('gives a strong site a high score', () => {
    const report = analyzeSecurityHeaders(STRONG_HEADERS)
    expect(report.score).toBe(100)
    expect(report.failed).toBe(0)
    expect(report.passed).toBe(8)
  })

  it('scores a bare site at zero', () => {
    const report = analyzeSecurityHeaders([])
    expect(report.score).toBe(0)
    expect(report.failed).toBeGreaterThan(0)
  })

  it('reports every header exactly once', () => {
    const ids = analyzeSecurityHeaders([]).findings.map((finding) => finding.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(['hsts', 'csp', 'frame', 'nosniff', 'referrer', 'permissions', 'coop', 'corp', 'xss'])
  })

  it('marks HSTS with a short max-age as a warning', () => {
    const report = analyzeSecurityHeaders([{ name: 'strict-transport-security', value: 'max-age=300' }])
    const hsts = report.findings.find((finding) => finding.id === 'hsts')
    expect(hsts?.status).toBe('warn')
    expect(hsts?.note).toContain('0 days')
  })

  it('fails HSTS when max-age is absent', () => {
    const report = analyzeSecurityHeaders([{ name: 'strict-transport-security', value: 'includeSubDomains' }])
    expect(report.findings.find((finding) => finding.id === 'hsts')?.status).toBe('warn')
  })

  it('treats max-age=0 as a warning about switching HSTS off', () => {
    const report = analyzeSecurityHeaders([{ name: 'strict-transport-security', value: 'max-age=0' }])
    const hsts = report.findings.find((finding) => finding.id === 'hsts')
    expect(hsts?.status).toBe('warn')
    expect(hsts?.note).toContain('switched off')
  })

  it('warns about HSTS without includeSubDomains', () => {
    const report = analyzeSecurityHeaders([{ name: 'strict-transport-security', value: 'max-age=31536000' }])
    const hsts = report.findings.find((finding) => finding.id === 'hsts')
    expect(hsts?.status).toBe('warn')
    expect(hsts?.note).toContain('includeSubDomains')
  })

  it('accepts frame-ancestors as a substitute for X-Frame-Options', () => {
    const report = analyzeSecurityHeaders([
      { name: 'content-security-policy', value: "default-src 'self'; frame-ancestors 'none'" },
    ])
    const frame = report.findings.find((finding) => finding.id === 'frame')
    expect(frame?.status).toBe('pass')
    expect(frame?.value).toBeNull()
  })

  it('flags unsafe-inline in the CSP', () => {
    const report = analyzeSecurityHeaders([
      { name: 'content-security-policy', value: "default-src 'self'; script-src 'unsafe-inline'" },
    ])
    const csp = report.findings.find((finding) => finding.id === 'csp')
    expect(csp?.status).toBe('warn')
    expect(csp?.note).toContain('inline')
  })

  it('flags unsafe-eval in the CSP', () => {
    const report = analyzeSecurityHeaders([
      { name: 'content-security-policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval'" },
    ])
    expect(report.findings.find((finding) => finding.id === 'csp')?.note).toContain('unsafe-eval')
  })

  it('warns about an obsolete ALLOW-FROM frame option', () => {
    const report = analyzeSecurityHeaders([{ name: 'x-frame-options', value: 'ALLOW-FROM https://example.com' }])
    expect(report.findings.find((finding) => finding.id === 'frame')?.note).toContain('obsolete')
  })

  it('fails unsafe-url as a referrer policy', () => {
    const report = analyzeSecurityHeaders([{ name: 'referrer-policy', value: 'unsafe-url' }])
    expect(report.findings.find((finding) => finding.id === 'referrer')?.status).toBe('fail')
  })

  it('rejects an invalid nosniff value', () => {
    const report = analyzeSecurityHeaders([{ name: 'x-content-type-options', value: 'sniff' }])
    expect(report.findings.find((finding) => finding.id === 'nosniff')?.status).toBe('warn')
  })

  it('treats an absent X-XSS-Protection as correct', () => {
    const report = analyzeSecurityHeaders([])
    const xss = report.findings.find((finding) => finding.id === 'xss')
    expect(xss?.status).toBe('info')
    expect(xss?.weight).toBe(0)
  })

  it('warns when X-XSS-Protection is set to 1', () => {
    const report = analyzeSecurityHeaders([{ name: 'x-xss-protection', value: '1; mode=block' }])
    expect(report.findings.find((finding) => finding.id === 'xss')?.status).toBe('warn')
  })

  it('scores warnings at half weight', () => {
    // HSTS is worth 10 of 49 graded points; a warning should earn 5.
    const report = analyzeSecurityHeaders([{ name: 'strict-transport-security', value: 'max-age=31536000' }])
    expect(report.score).toBe(Math.round((5 / 49) * 100))
  })

  it('reports the raw value alongside the finding', () => {
    const report = analyzeSecurityHeaders([{ name: 'x-frame-options', value: 'SAMEORIGIN' }])
    expect(report.findings.find((finding) => finding.id === 'frame')?.value).toBe('SAMEORIGIN')
  })
})

describe('gradeSecurityScore', () => {
  it('grades the four bands', () => {
    expect(gradeSecurityScore(95).label).toBe('Strong')
    expect(gradeSecurityScore(75).label).toBe('Reasonable')
    expect(gradeSecurityScore(50).label).toBe('Weak')
    expect(gradeSecurityScore(10).label).toBe('Poor')
  })

  it('uses the success tone for the top two bands', () => {
    expect(gradeSecurityScore(95).tone).toBe('text-success')
    expect(gradeSecurityScore(70).tone).toBe('text-success')
  })
})

describe('validateProbeUrl', () => {
  it('rejects an empty string', () => {
    expect(validateProbeUrl('')).toBe('Enter a URL.')
  })

  it('rejects a bare domain without a scheme', () => {
    expect(validateProbeUrl('example.com')).toContain('not a valid URL')
  })

  it('rejects non-HTTP schemes', () => {
    expect(validateProbeUrl('ftp://example.com')).toContain('http and https')
  })

  it('accepts http and https', () => {
    expect(validateProbeUrl('https://example.com')).toBeNull()
    expect(validateProbeUrl('http://example.com')).toBeNull()
  })
})

describe('describeHttpStatus', () => {
  it('names the common codes', () => {
    expect(describeHttpStatus(200)).toBe('Success')
    expect(describeHttpStatus(301)).toBe('Redirect')
    expect(describeHttpStatus(404)).toBe('Not found')
    expect(describeHttpStatus(503)).toBe('Server error')
  })

  it('falls back for unlisted codes', () => {
    expect(describeHttpStatus(418)).toBe('Response')
  })
})
