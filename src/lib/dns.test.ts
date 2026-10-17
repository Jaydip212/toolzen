import { describe, expect, it } from 'vitest'

import {
  DNS_RECORD_TYPES,
  DOH_PROVIDERS,
  classifyTxtRecord,
  cleanTxtRecord,
  describeDnsStatus,
  isPrivateHost,
  normalizeDomain,
  splitPriority,
  validateDomain,
} from './dns'

describe('normalizeDomain', () => {
  it('lowercases the input', () => {
    expect(normalizeDomain('Example.COM')).toBe('example.com')
  })

  it('strips a scheme', () => {
    expect(normalizeDomain('https://example.com')).toBe('example.com')
    expect(normalizeDomain('http://example.com')).toBe('example.com')
  })

  it('strips a path, query and fragment', () => {
    expect(normalizeDomain('https://example.com/a/b?c=1#d')).toBe('example.com')
  })

  it('strips credentials', () => {
    expect(normalizeDomain('user:pass@example.com')).toBe('example.com')
  })

  it('strips a port', () => {
    expect(normalizeDomain('example.com:8443')).toBe('example.com')
  })

  it('strips the trailing root dot', () => {
    expect(normalizeDomain('example.com.')).toBe('example.com')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeDomain('   example.com   ')).toBe('example.com')
  })

  it('returns an empty string for empty input', () => {
    expect(normalizeDomain('')).toBe('')
    expect(normalizeDomain('   ')).toBe('')
  })
})

describe('validateDomain', () => {
  it('accepts an ordinary domain', () => {
    expect(validateDomain('example.com')).toBeNull()
  })

  it('accepts a subdomain', () => {
    expect(validateDomain('api.eu.example.co.uk')).toBeNull()
  })

  it('accepts hyphens and digits inside labels', () => {
    expect(validateDomain('my-site123.example.com')).toBeNull()
  })

  it('rejects an empty value', () => {
    expect(validateDomain('')).toContain('Enter a domain')
  })

  it('rejects a single label with no dot', () => {
    expect(validateDomain('intranet')).toContain('with a dot')
  })

  it('rejects localhost with the private-address message', () => {
    expect(validateDomain('localhost')).toContain('Private')
  })

  it('rejects a doubled dot', () => {
    expect(validateDomain('example..com')).toContain('empty label')
  })

  it('rejects a label longer than 63 characters', () => {
    expect(validateDomain(`${'a'.repeat(64)}.com`)).toContain('63')
  })

  it('rejects a name longer than 253 characters', () => {
    const long = Array.from({ length: 60 }, () => 'abcdefghij').join('.')
    expect(validateDomain(long)).toContain('too long')
  })

  it('rejects spaces', () => {
    expect(validateDomain('exa mple.com')).toContain('not a valid domain label')
  })

  it('rejects a numeric-only top-level domain', () => {
    expect(validateDomain('example.123')).toContain('top-level domain')
  })

  it('rejects a single-letter top-level domain', () => {
    expect(validateDomain('example.c')).toContain('top-level domain')
  })

  it('rejects localhost', () => {
    expect(validateDomain('localhost.local')).toContain('Private')
  })

  it('rejects a private IPv4 address', () => {
    expect(validateDomain('192.168.1.1')).toContain('Private')
  })

  it('rejects a label ending in a hyphen', () => {
    expect(validateDomain('bad-.com')).toContain('not a valid domain label')
  })

  it('accepts a domain pasted as a URL', () => {
    expect(validateDomain('https://www.example.com/page')).toBeNull()
  })
})

describe('isPrivateHost', () => {
  it('flags loopback names', () => {
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('app.localhost')).toBe(true)
    expect(isPrivateHost('printer.local')).toBe(true)
  })

  it('flags 10/8', () => {
    expect(isPrivateHost('10.1.2.3')).toBe(true)
  })

  it('flags 172.16/12 but not 172.32', () => {
    expect(isPrivateHost('172.16.0.1')).toBe(true)
    expect(isPrivateHost('172.31.255.255')).toBe(true)
    expect(isPrivateHost('172.32.0.1')).toBe(false)
  })

  it('flags 192.168/16', () => {
    expect(isPrivateHost('192.168.0.1')).toBe(true)
  })

  it('flags link-local', () => {
    expect(isPrivateHost('169.254.169.254')).toBe(true)
  })

  it('flags loopback IPv4', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true)
  })

  it('does not flag a public address', () => {
    expect(isPrivateHost('93.184.216.34')).toBe(false)
  })

  it('flags IPv6 loopback and unique-local', () => {
    expect(isPrivateHost('::1')).toBe(true)
    expect(isPrivateHost('fd00::1')).toBe(true)
    expect(isPrivateHost('fe80::1')).toBe(true)
  })

  it('does not flag a public IPv6 address', () => {
    expect(isPrivateHost('2606:4700:4700::1111')).toBe(false)
  })

  it('ignores the brackets around an IPv6 literal', () => {
    expect(isPrivateHost('[::1]')).toBe(true)
  })
})

describe('describeDnsStatus', () => {
  it('names NOERROR and NXDOMAIN', () => {
    expect(describeDnsStatus(0)).toContain('NOERROR')
    expect(describeDnsStatus(3)).toContain('NXDOMAIN')
  })

  it('explains SERVFAIL and REFUSED', () => {
    expect(describeDnsStatus(2)).toContain('SERVFAIL')
    expect(describeDnsStatus(5)).toContain('REFUSED')
  })

  it('falls back for unknown codes', () => {
    expect(describeDnsStatus(99)).toContain('99')
  })
})

describe('splitPriority', () => {
  it('splits an MX record', () => {
    expect(splitPriority('10 mail.example.com.')).toEqual({ priority: 10, target: 'mail.example.com.' })
  })

  it('handles extra whitespace', () => {
    expect(splitPriority('  20    mx2.example.com.  ')).toEqual({ priority: 20, target: 'mx2.example.com.' })
  })

  it('returns null priority when there is no number', () => {
    expect(splitPriority('mail.example.com.')).toEqual({ priority: null, target: 'mail.example.com.' })
  })

  it('returns the whole string as the target for SRV', () => {
    expect(splitPriority('10 5 5060 sip.example.com.')).toEqual({ priority: 10, target: '5 5060 sip.example.com.' })
  })
})

describe('cleanTxtRecord', () => {
  it('strips a single pair of quotes', () => {
    expect(cleanTxtRecord('"v=spf1 -all"')).toBe('v=spf1 -all')
  })

  it('joins multiple quoted chunks', () => {
    expect(cleanTxtRecord('"v=spf1 " "include:_spf.google.com -all"')).toBe('v=spf1 include:_spf.google.com -all')
  })

  it('returns unquoted data unchanged', () => {
    expect(cleanTxtRecord('v=spf1 -all')).toBe('v=spf1 -all')
  })

  it('handles an empty string', () => {
    expect(cleanTxtRecord('')).toBe('')
  })
})

describe('classifyTxtRecord', () => {
  it('recognises SPF', () => {
    expect(classifyTxtRecord('"v=spf1 include:_spf.google.com -all"')).toContain('SPF')
  })

  it('recognises DMARC', () => {
    expect(classifyTxtRecord('"v=DMARC1; p=reject; rua=mailto:d@example.com"')).toContain('DMARC')
  })

  it('recognises DKIM', () => {
    expect(classifyTxtRecord('"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA"')).toContain('DKIM')
  })

  it('recognises common site-verification records', () => {
    expect(classifyTxtRecord('"google-site-verification=abc123"')).toContain('Google')
    expect(classifyTxtRecord('"MS=ms12345678"')).toContain('Microsoft')
  })

  it('returns null for unrelated text', () => {
    expect(classifyTxtRecord('"hello world"')).toBeNull()
  })
})

describe('catalogue', () => {
  it('lists ten record types', () => {
    expect(DNS_RECORD_TYPES).toHaveLength(10)
  })

  it('has a unique value per record type', () => {
    const values = DNS_RECORD_TYPES.map((entry) => entry.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('describes every record type', () => {
    for (const entry of DNS_RECORD_TYPES) {
      expect(entry.description.length, entry.value).toBeGreaterThan(10)
    }
  })

  it('offers two DoH providers over HTTPS', () => {
    expect(DOH_PROVIDERS).toHaveLength(2)
    for (const provider of DOH_PROVIDERS) {
      expect(provider.endpoint.startsWith('https://')).toBe(true)
    }
  })
})
