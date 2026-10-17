import { describe, expect, it } from 'vitest'

import {
  analyzeSecurityHeaders,
  buildMarkdownReport,
  countByStatus,
  curlCommand,
  sortFindings,
  statusLabel,
  type HeaderFinding,
} from './logic'

function finding(overrides: Partial<HeaderFinding>): HeaderFinding {
  return {
    id: 'x',
    name: 'X-Test',
    weight: 5,
    protects: 'Something',
    status: 'pass',
    value: null,
    note: 'A note.',
    ...overrides,
  }
}

describe('curlCommand', () => {
  it('builds a HEAD request for a URL', () => {
    expect(curlCommand('https://example.com')).toBe('curl -sSI https://example.com')
  })

  it('falls back to an example when the URL is blank', () => {
    expect(curlCommand('   ')).toContain('example.com')
  })
})

describe('sortFindings', () => {
  it('puts failures first and notes last', () => {
    const sorted = sortFindings([
      finding({ id: 'a', status: 'info' }),
      finding({ id: 'b', status: 'pass' }),
      finding({ id: 'c', status: 'fail' }),
      finding({ id: 'd', status: 'warn' }),
      finding({ id: 'e', status: 'absent' }),
    ])
    expect(sorted.map((entry) => entry.id)).toEqual(['c', 'e', 'd', 'b', 'a'])
  })

  it('orders by weight within a status', () => {
    const sorted = sortFindings([
      finding({ id: 'light', status: 'pass', weight: 3 }),
      finding({ id: 'heavy', status: 'pass', weight: 10 }),
    ])
    expect(sorted[0].id).toBe('heavy')
  })

  it('does not mutate the input', () => {
    const input = [finding({ id: 'a', status: 'info' }), finding({ id: 'b', status: 'fail' })]
    sortFindings(input)
    expect(input[0].id).toBe('a')
  })
})

describe('countByStatus', () => {
  it('counts each status', () => {
    const counts = countByStatus([
      finding({ status: 'pass' }),
      finding({ status: 'pass' }),
      finding({ status: 'warn' }),
      finding({ status: 'fail' }),
      finding({ status: 'absent' }),
      finding({ status: 'info' }),
    ])
    expect(counts).toEqual({ pass: 2, warn: 1, fail: 1, absent: 1, info: 1 })
  })

  it('returns zeros for an empty list', () => {
    expect(countByStatus([])).toEqual({ pass: 0, warn: 0, fail: 0, absent: 0, info: 0 })
  })
})

describe('buildMarkdownReport', () => {
  const findings = analyzeSecurityHeaders([
    { name: 'strict-transport-security', value: 'max-age=31536000; includeSubDomains; preload' },
    { name: 'content-security-policy', value: "default-src 'self'" },
  ]).findings

  it('names the source so a paste is not mistaken for a live probe', () => {
    const report = buildMarkdownReport(findings, { source: 'Pasted headers', score: 42 })
    expect(report).toContain('Source: Pasted headers')
  })

  it('includes the score and grade', () => {
    const report = buildMarkdownReport(findings, { source: 'x', score: 42 })
    expect(report).toContain('Score: 42/100 (Poor)')
  })

  it('grades a mid-range score as weak', () => {
    const report = buildMarkdownReport(findings, { source: 'x', score: 55 })
    expect(report).toContain('Score: 55/100 (Weak)')
  })

  it('includes every finding as a section', () => {
    const report = buildMarkdownReport(findings, { source: 'x', score: 50 })
    for (const item of findings) {
      expect(report).toContain(`### ${item.name}`)
    }
  })

  it('marks a missing header as not sent', () => {
    const report = buildMarkdownReport([finding({ value: null, status: 'absent' })], { source: 'x', score: 0 })
    expect(report).toContain('Value: (not sent)')
  })

  it('wraps a present value in backticks', () => {
    const report = buildMarkdownReport([finding({ value: 'DENY' })], { source: 'x', score: 100 })
    expect(report).toContain('Value: `DENY`')
  })

  it('ends with a disclaimer', () => {
    const report = buildMarkdownReport([], { source: 'x', score: 0 })
    expect(report).toContain('not a security audit')
  })

  it('reports the counts', () => {
    const report = buildMarkdownReport(
      [finding({ status: 'pass' }), finding({ status: 'absent' })],
      { source: 'x', score: 50 },
    )
    expect(report).toContain('Passed: 1, improve: 0, missing or failing: 1')
  })
})

describe('statusLabel', () => {
  it('labels every status', () => {
    expect(statusLabel('pass')).toBe('OK')
    expect(statusLabel('warn')).toBe('Improve')
    expect(statusLabel('fail')).toBe('Fix')
    expect(statusLabel('absent')).toBe('Missing')
    expect(statusLabel('info')).toBe('Note')
  })
})
