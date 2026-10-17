import { describe, expect, it } from 'vitest'

import {
  crtShUrl,
  daysUntil,
  dedupeCertificates,
  formatCertificateDate,
  isWildcard,
  normaliseTimestamp,
  parseCertificate,
  parseDistinguishedName,
  sortByExpiry,
  summariseCertificates,
  validityOf,
  type Certificate,
} from './certificates'

const NOW = new Date('2026-06-15T12:00:00Z')

function cert(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 1,
    commonName: 'example.com',
    names: ['example.com'],
    issuer: { commonName: 'Test CA', organisation: 'Test', country: 'US', raw: 'CN=Test CA' },
    notBefore: '2026-01-01T00:00:00.000Z',
    notAfter: '2027-01-01T00:00:00.000Z',
    serialNumber: 'abc123',
    ...overrides,
  }
}

describe('crtShUrl', () => {
  it('includes subdomains with a SQL wildcard by default', () => {
    expect(crtShUrl('example.com')).toBe('https://crt.sh/?q=%25.example.com&output=json')
  })

  it('can restrict to the exact name', () => {
    expect(crtShUrl('example.com', false)).toBe('https://crt.sh/?q=example.com&output=json')
  })
})

describe('parseDistinguishedName', () => {
  it('extracts CN, O and C', () => {
    const issuer = parseDistinguishedName('C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3')
    expect(issuer.country).toBe('US')
    expect(issuer.organisation).toBe('SSL Corporation')
    expect(issuer.commonName).toBe('Cloudflare TLS Issuing ECC CA 3')
  })

  it('keeps the raw string', () => {
    const raw = 'CN=Let\'s Encrypt R3'
    expect(parseDistinguishedName(raw).raw).toBe(raw)
  })

  it('handles a name with no CN', () => {
    const issuer = parseDistinguishedName('O=Acme, C=GB')
    expect(issuer.commonName).toBeNull()
    expect(issuer.organisation).toBe('Acme')
  })

  it('returns nulls for an empty string', () => {
    const issuer = parseDistinguishedName('')
    expect(issuer.commonName).toBeNull()
    expect(issuer.raw).toBe('')
  })

  it('handles a single CN with no comma', () => {
    expect(parseDistinguishedName('CN=Root CA').commonName).toBe('Root CA')
  })
})

describe('normaliseTimestamp', () => {
  it('treats a zoneless crt.sh timestamp as UTC', () => {
    expect(normaliseTimestamp('2026-09-26T22:49:11')).toBe('2026-09-26T22:49:11.000Z')
  })

  it('keeps an explicit Z', () => {
    expect(normaliseTimestamp('2026-09-26T22:49:11Z')).toBe('2026-09-26T22:49:11.000Z')
  })

  it('keeps an explicit offset', () => {
    expect(normaliseTimestamp('2026-09-26T22:49:11+02:00')).toBe('2026-09-26T20:49:11.000Z')
  })

  it('returns null for empty or invalid input', () => {
    expect(normaliseTimestamp('')).toBeNull()
    expect(normaliseTimestamp('not a date')).toBeNull()
  })
})

describe('parseCertificate', () => {
  it('parses a full crt.sh row', () => {
    const parsed = parseCertificate({
      id: 42,
      common_name: 'example.com',
      name_value: '*.example.com\nexample.com',
      issuer_name: 'C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3',
      not_before: '2026-09-26T22:49:11',
      not_after: '2026-12-25T22:56:35',
      serial_number: '01eee6aa',
    })
    expect(parsed).not.toBeNull()
    expect(parsed?.id).toBe(42)
    expect(parsed?.names).toEqual(['*.example.com', 'example.com'])
    expect(parsed?.issuer.organisation).toBe('SSL Corporation')
    expect(parsed?.notAfter).toBe('2026-12-25T22:56:35.000Z')
  })

  it('lowercases and deduplicates names', () => {
    const parsed = parseCertificate({ name_value: 'A.example.com\na.example.com\nb.example.com' })
    expect(parsed?.names).toEqual(['a.example.com', 'b.example.com'])
  })

  it('falls back to the first name when common_name is empty', () => {
    const parsed = parseCertificate({ name_value: 'first.example.com\nsecond.example.com' })
    expect(parsed?.commonName).toBe('first.example.com')
  })

  it('returns null when there is nothing identifying', () => {
    expect(parseCertificate({})).toBeNull()
    expect(parseCertificate({ name_value: '' })).toBeNull()
  })

  it('accepts a row with only a serial number', () => {
    const parsed = parseCertificate({ serial_number: 'deadbeef' })
    expect(parsed?.serialNumber).toBe('deadbeef')
  })

  it('returns null timestamps for unparseable dates', () => {
    const parsed = parseCertificate({ common_name: 'x.com', not_before: '???', not_after: '' })
    expect(parsed?.notBefore).toBeNull()
    expect(parsed?.notAfter).toBeNull()
  })
})

describe('dedupeCertificates', () => {
  it('collapses identical certificates', () => {
    const unique = dedupeCertificates([cert({ id: 1 }), cert({ id: 2 })])
    expect(unique).toHaveLength(1)
  })

  it('keeps certificates that differ by serial', () => {
    const unique = dedupeCertificates([cert({ serialNumber: 'a' }), cert({ serialNumber: 'b' })])
    expect(unique).toHaveLength(2)
  })

  it('keeps certificates that differ by issuer', () => {
    const unique = dedupeCertificates([
      cert({ issuer: { commonName: 'A', organisation: null, country: null, raw: 'CN=A' } }),
      cert({ issuer: { commonName: 'B', organisation: null, country: null, raw: 'CN=B' } }),
    ])
    expect(unique).toHaveLength(2)
  })

  it('keeps certificates that differ by expiry', () => {
    const unique = dedupeCertificates([
      cert({ notAfter: '2027-01-01T00:00:00.000Z' }),
      cert({ notAfter: '2028-01-01T00:00:00.000Z' }),
    ])
    expect(unique).toHaveLength(2)
  })

  it('preserves order', () => {
    const unique = dedupeCertificates([cert({ serialNumber: 'first' }), cert({ serialNumber: 'second' })])
    expect(unique.map((entry) => entry.serialNumber)).toEqual(['first', 'second'])
  })
})

describe('sortByExpiry', () => {
  it('puts the latest expiry first', () => {
    const sorted = sortByExpiry([
      cert({ serialNumber: 'old', notAfter: '2026-07-01T00:00:00.000Z' }),
      cert({ serialNumber: 'new', notAfter: '2027-07-01T00:00:00.000Z' }),
    ])
    expect(sorted[0].serialNumber).toBe('new')
  })

  it('does not mutate the input', () => {
    const input = [cert({ serialNumber: 'a' }), cert({ serialNumber: 'b', notAfter: '2025-01-01T00:00:00.000Z' })]
    sortByExpiry(input)
    expect(input[0].serialNumber).toBe('a')
  })

  it('treats a missing expiry as oldest', () => {
    const sorted = sortByExpiry([cert({ serialNumber: 'none', notAfter: null }), cert({ serialNumber: 'dated' })])
    expect(sorted[0].serialNumber).toBe('dated')
  })
})

describe('daysUntil', () => {
  it('counts forward', () => {
    expect(daysUntil('2026-06-20T12:00:00Z', NOW)).toBe(5)
  })

  it('counts backward as negative', () => {
    expect(daysUntil('2026-06-10T12:00:00Z', NOW)).toBe(-5)
  })

  it('returns null for a null or invalid date', () => {
    expect(daysUntil(null, NOW)).toBeNull()
    expect(daysUntil('nope', NOW)).toBeNull()
  })
})

describe('validityOf', () => {
  it('reports a certificate inside its window as valid', () => {
    expect(validityOf(cert(), NOW)).toBe('valid')
  })

  it('reports an expired certificate', () => {
    expect(validityOf(cert({ notAfter: '2026-01-01T00:00:00.000Z' }), NOW)).toBe('expired')
  })

  it('reports a future certificate', () => {
    expect(validityOf(cert({ notBefore: '2027-01-01T00:00:00.000Z' }), NOW)).toBe('not-yet-valid')
  })

  it('reports unknown when dates are missing', () => {
    expect(validityOf(cert({ notAfter: null }), NOW)).toBe('unknown')
  })
})

describe('isWildcard', () => {
  it('detects a wildcard name', () => {
    expect(isWildcard(cert({ names: ['*.example.com'] }))).toBe(true)
  })

  it('is false without a wildcard', () => {
    expect(isWildcard(cert({ names: ['example.com', 'www.example.com'] }))).toBe(false)
  })
})

describe('summariseCertificates', () => {
  it('counts valid and expired certificates', () => {
    const summary = summariseCertificates(
      [
        cert({ serialNumber: 'a' }),
        cert({ serialNumber: 'b', notAfter: '2025-01-01T00:00:00.000Z' }),
      ],
      NOW,
    )
    expect(summary.valid).toBe(1)
    expect(summary.expired).toBe(1)
  })

  it('flags certificates expiring within 30 days', () => {
    const summary = summariseCertificates([cert({ notAfter: '2026-07-01T00:00:00.000Z' })], NOW)
    expect(summary.expiringSoon).toBe(1)
  })

  it('does not flag one expiring in 90 days', () => {
    const summary = summariseCertificates([cert({ notAfter: '2026-09-13T00:00:00.000Z' })], NOW)
    expect(summary.expiringSoon).toBe(0)
  })

  it('counts wildcards', () => {
    const summary = summariseCertificates([cert({ names: ['*.example.com'] }), cert({ serialNumber: 'b' })], NOW)
    expect(summary.wildcard).toBe(1)
  })

  it('ranks issuers by count', () => {
    const summary = summariseCertificates(
      [
        cert({ serialNumber: 'a', issuer: { commonName: 'CA One', organisation: null, country: null, raw: 'CN=CA One' } }),
        cert({ serialNumber: 'b', issuer: { commonName: 'CA One', organisation: null, country: null, raw: 'CN=CA One' } }),
        cert({ serialNumber: 'c', issuer: { commonName: 'CA Two', organisation: null, country: null, raw: 'CN=CA Two' } }),
      ],
      NOW,
    )
    expect(summary.issuers[0]).toEqual({ name: 'CA One', count: 2 })
  })

  it('picks the latest-expiring valid certificate as newest', () => {
    const summary = summariseCertificates(
      [cert({ serialNumber: 'short' }), cert({ serialNumber: 'long', notAfter: '2028-01-01T00:00:00.000Z' })],
      NOW,
    )
    expect(summary.newest?.serialNumber).toBe('long')
  })

  it('handles an empty list', () => {
    const summary = summariseCertificates([], NOW)
    expect(summary.total).toBe(0)
    expect(summary.newest).toBeNull()
    expect(summary.issuers).toEqual([])
  })
})

describe('formatCertificateDate', () => {
  it('formats in a stable UTC form', () => {
    expect(formatCertificateDate('2026-09-26T22:49:11.000Z')).toBe('26 Sep 2026')
  })

  it('returns an em dash for null or invalid input', () => {
    expect(formatCertificateDate(null)).toBe('—')
    expect(formatCertificateDate('nope')).toBe('—')
  })
})
