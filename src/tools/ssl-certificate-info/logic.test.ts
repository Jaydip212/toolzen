import { describe, expect, it } from 'vitest'

import {
  dataCaveat,
  headline,
  toCsv,
  toRows,
  uniqueNames,
  validityBadge,
  type Certificate,
} from './logic'

const NOW = new Date('2026-06-15T12:00:00Z')

function cert(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 1,
    commonName: 'example.com',
    names: ['example.com'],
    issuer: { commonName: 'Test CA', organisation: 'Test Org', country: 'US', raw: 'CN=Test CA' },
    notBefore: '2026-01-01T00:00:00.000Z',
    notAfter: '2027-01-01T00:00:00.000Z',
    serialNumber: 'abc',
    ...overrides,
  }
}

describe('toRows', () => {
  it('marks a current certificate valid', () => {
    expect(toRows([cert()], NOW)[0].validity).toBe('valid')
  })

  it('marks an expired certificate', () => {
    expect(toRows([cert({ notAfter: '2025-01-01T00:00:00.000Z' })], NOW)[0].validity).toBe('expired')
  })

  it('computes remaining days', () => {
    expect(toRows([cert({ notAfter: '2026-06-20T12:00:00.000Z' })], NOW)[0].remainingDays).toBe(5)
  })

  it('formats both dates', () => {
    const row = toRows([cert()], NOW)[0]
    expect(row.notBefore).toBe('1 Jan 2026')
    expect(row.notAfter).toBe('1 Jan 2027')
  })

  it('falls back through CN, organisation and raw for the issuer label', () => {
    expect(toRows([cert()], NOW)[0].issuerLabel).toBe('Test CA')
    expect(
      toRows([cert({ issuer: { commonName: null, organisation: 'Org', country: null, raw: 'O=Org' } })], NOW)[0]
        .issuerLabel,
    ).toBe('Org')
    expect(
      toRows([cert({ issuer: { commonName: null, organisation: null, country: null, raw: '' } })], NOW)[0]
        .issuerLabel,
    ).toBe('Unknown issuer')
  })

  it('sorts by latest expiry', () => {
    const rows = toRows(
      [cert({ serialNumber: 'a', notAfter: '2026-07-01T00:00:00.000Z' }), cert({ serialNumber: 'b', notAfter: '2028-01-01T00:00:00.000Z' })],
      NOW,
    )
    expect(rows[0].certificate.serialNumber).toBe('b')
  })

  it('handles an empty list', () => {
    expect(toRows([], NOW)).toEqual([])
  })
})

describe('validityBadge', () => {
  it('maps each state to a label and variant', () => {
    expect(validityBadge('valid')).toEqual({ label: 'Valid', variant: 'success' })
    expect(validityBadge('expired')).toEqual({ label: 'Expired', variant: 'danger' })
    expect(validityBadge('not-yet-valid').variant).toBe('warning')
    expect(validityBadge('unknown').variant).toBe('neutral')
  })
})

describe('uniqueNames', () => {
  it('collects and deduplicates names', () => {
    const names = uniqueNames([
      cert({ names: ['example.com', 'www.example.com'] }),
      cert({ names: ['example.com'] }),
    ])
    expect(names).toEqual(['example.com', 'www.example.com'])
  })

  it('falls back to the common name when names is empty', () => {
    expect(uniqueNames([cert({ names: [], commonName: 'Fallback.com' })])).toEqual(['fallback.com'])
  })

  it('returns an empty list when there are no certificates', () => {
    expect(uniqueNames([])).toEqual([])
  })

  it('sorts the result', () => {
    expect(uniqueNames([cert({ names: ['z.example.com', 'a.example.com'] })])).toEqual([
      'a.example.com',
      'z.example.com',
    ])
  })
})

describe('toCsv', () => {
  it('writes a header row', () => {
    expect(toCsv([]).split('\n')[0]).toBe('common_name,names,issuer,not_before,not_after,serial_number')
  })

  it('writes one row per certificate', () => {
    expect(toCsv([cert(), cert({ serialNumber: 'def' })]).split('\n')).toHaveLength(3)
  })

  it('quotes a field containing a comma', () => {
    const csv = toCsv([cert({ issuer: { commonName: 'CA', organisation: null, country: null, raw: 'C=US, O=Acme, CN=CA' } })])
    expect(csv).toContain('"C=US, O=Acme, CN=CA"')
  })

  it('escapes an embedded double quote', () => {
    const csv = toCsv([cert({ commonName: 'say "hi"' })])
    expect(csv).toContain('"say ""hi"""')
  })

  it('joins multiple names with a space', () => {
    const csv = toCsv([cert({ names: ['a.com', 'b.com'] })])
    expect(csv).toContain('a.com b.com')
  })
})

describe('headline', () => {
  it('handles an empty result', () => {
    const summary = {
      total: 0,
      unique: 0,
      valid: 0,
      expired: 0,
      notYetValid: 0,
      expiringSoon: 0,
      wildcard: 0,
      issuers: [],
      newest: null,
    }
    expect(headline('example.com', summary)).toContain('No certificates')
  })

  it('counts valid and expired certificates', () => {
    const summary = {
      total: 3,
      unique: 3,
      valid: 2,
      expired: 1,
      notYetValid: 0,
      expiringSoon: 0,
      wildcard: 1,
      issuers: [],
      newest: null,
    }
    const text = headline('example.com', summary)
    expect(text).toContain('3 certificates')
    expect(text).toContain('2 still valid')
    expect(text).toContain('1 expired')
  })

  it('mentions certificates expiring soon', () => {
    const summary = {
      total: 1,
      unique: 1,
      valid: 1,
      expired: 0,
      notYetValid: 0,
      expiringSoon: 1,
      wildcard: 0,
      issuers: [],
      newest: null,
    }
    expect(headline('example.com', summary)).toContain('expiring within 30 days')
  })

  it('uses the singular for one certificate', () => {
    const summary = {
      total: 1,
      unique: 1,
      valid: 1,
      expired: 0,
      notYetValid: 0,
      expiringSoon: 0,
      wildcard: 0,
      issuers: [],
      newest: null,
    }
    expect(headline('example.com', summary)).toContain('1 certificate issued')
  })
})

describe('dataCaveat', () => {
  it('states the limitation explicitly', () => {
    const text = dataCaveat()
    expect(text).toContain('never deployed')
    expect(text).toContain('do not show which')
    expect(text).toContain('private CA')
  })
})
