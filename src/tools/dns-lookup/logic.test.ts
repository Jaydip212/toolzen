import { describe, expect, it } from 'vitest'

import {
  BULK_TYPES,
  DNS_RECORD_TYPES,
  describeResult,
  formatTtl,
  groupByType,
  toDisplayRecord,
  toDisplayRecords,
  toZoneText,
  uniformTtl,
  type DnsAnswer,
  type DnsResult,
} from './logic'

function answer(overrides: Partial<DnsAnswer> = {}): DnsAnswer {
  return {
    name: 'example.com.',
    typeCode: 1,
    type: 'A',
    ttl: 300,
    data: '93.184.216.34',
    ...overrides,
  }
}

function result(answers: DnsAnswer[], overrides: Partial<DnsResult> = {}): DnsResult {
  return {
    status: 0,
    statusText: 'NOERROR — the query succeeded.',
    answers,
    authority: [],
    truncated: false,
    authenticated: false,
    provider: 'google',
    ...overrides,
  }
}

describe('formatTtl', () => {
  it('formats seconds', () => {
    expect(formatTtl(30)).toBe('30s')
  })

  it('formats minutes', () => {
    expect(formatTtl(300)).toBe('5m')
  })

  it('formats hours', () => {
    expect(formatTtl(7200)).toBe('2h')
  })

  it('formats days', () => {
    expect(formatTtl(172800)).toBe('2d')
  })

  it('handles zero', () => {
    expect(formatTtl(0)).toBe('0s')
  })

  it('rejects negative or non-finite values', () => {
    expect(formatTtl(-1)).toBe('—')
    expect(formatTtl(Number.NaN)).toBe('—')
  })

  it('rounds to the nearest unit', () => {
    expect(formatTtl(59)).toBe('59s')
    expect(formatTtl(90)).toBe('2m')
    expect(formatTtl(3599)).toBe('60m')
  })
})

describe('toDisplayRecord', () => {
  it('strips the trailing root dot from the name', () => {
    expect(toDisplayRecord(answer()).name).toBe('example.com')
  })

  it('keeps an A record value as-is', () => {
    expect(toDisplayRecord(answer()).value).toBe('93.184.216.34')
  })

  it('splits MX priority and target', () => {
    const record = toDisplayRecord(answer({ type: 'MX', typeCode: 15, data: '10 mail.example.com.' }))
    expect(record.priority).toBe(10)
    expect(record.value).toBe('mail.example.com.')
  })

  it('strips quotes from TXT and labels SPF', () => {
    const record = toDisplayRecord(answer({ type: 'TXT', typeCode: 16, data: '"v=spf1 -all"' }))
    expect(record.value).toBe('v=spf1 -all')
    expect(record.note).toContain('SPF')
  })

  it('leaves an unrelated TXT record unlabelled', () => {
    const record = toDisplayRecord(answer({ type: 'TXT', typeCode: 16, data: '"hello"' }))
    expect(record.note).toBeNull()
  })

  it('formats the TTL', () => {
    expect(toDisplayRecord(answer({ ttl: 3600 })).ttl).toBe('1h')
  })
})

describe('toDisplayRecords', () => {
  it('sorts by type then value', () => {
    const records = toDisplayRecords(
      result([
        answer({ type: 'MX', typeCode: 15, data: '10 b.example.com.' }),
        answer({ type: 'A', data: '1.1.1.1' }),
        answer({ type: 'A', data: '2.2.2.2' }),
      ]),
    )
    expect(records.map((record) => `${record.type}:${record.value}`)).toEqual([
      'A:1.1.1.1',
      'A:2.2.2.2',
      'MX:b.example.com.',
    ])
  })

  it('returns an empty list for no answers', () => {
    expect(toDisplayRecords(result([]))).toEqual([])
  })
})

describe('groupByType', () => {
  it('orders groups by the canonical type order', () => {
    const records = toDisplayRecords(
      result([
        answer({ type: 'NS', typeCode: 2, data: 'ns1.example.com.' }),
        answer({ type: 'A', data: '1.1.1.1' }),
        answer({ type: 'MX', typeCode: 15, data: '10 mx.example.com.' }),
      ]),
    )
    expect(groupByType(records).map((group) => group.type)).toEqual(['A', 'MX', 'NS'])
  })

  it('groups multiple records of the same type together', () => {
    const records = toDisplayRecords(result([answer({ data: '1.1.1.1' }), answer({ data: '2.2.2.2' })]))
    const groups = groupByType(records)
    expect(groups).toHaveLength(1)
    expect(groups[0].records).toHaveLength(2)
  })

  it('returns nothing for an empty list', () => {
    expect(groupByType([])).toEqual([])
  })

  it('keeps an unknown type at the end', () => {
    const records = toDisplayRecords(
      result([answer({ type: 'TYPE99', typeCode: 99 }), answer({ type: 'A' })]),
    )
    expect(groupByType(records).map((group) => group.type)).toEqual(['A', 'TYPE99'])
  })
})

describe('toZoneText', () => {
  it('writes one tab-separated line per record', () => {
    const text = toZoneText('example.com', result([answer()]))
    expect(text).toBe('example.com.\t300\tIN\tA\t93.184.216.34')
  })

  it('includes the MX priority', () => {
    const text = toZoneText('example.com', result([answer({ type: 'MX', typeCode: 15, data: '10 mx.example.com.' })]))
    expect(text).toContain('\tMX\t10 mx.example.com.')
  })

  it('returns an empty string when there are no answers', () => {
    expect(toZoneText('example.com', result([]))).toBe('')
  })
})

describe('describeResult', () => {
  it('reports a non-zero status verbatim', () => {
    const description = describeResult('example.com', 'A', result([], { status: 3, statusText: 'NXDOMAIN — the domain does not exist.' }))
    expect(description).toContain('NXDOMAIN')
  })

  it('explains an empty answer set', () => {
    const description = describeResult('example.com', 'MX', result([]))
    expect(description).toContain('No MX records')
  })

  it('counts records', () => {
    const description = describeResult('example.com', 'A', result([answer(), answer({ data: '2.2.2.2' })]))
    expect(description).toContain('2 A records')
  })

  it('uses the singular for one record', () => {
    expect(describeResult('example.com', 'A', result([answer()]))).toContain('1 A record')
  })

  it('mentions mail records in a TXT answer set', () => {
    const description = describeResult(
      'example.com',
      'TXT',
      result([answer({ type: 'TXT', typeCode: 16, data: '"v=spf1 -all"' })]),
    )
    expect(description).toContain('mail or verification')
  })
})

describe('uniformTtl', () => {
  it('returns the shared TTL', () => {
    expect(uniformTtl(result([answer({ ttl: 60 }), answer({ ttl: 60 })]))).toBe(60)
  })

  it('returns null when TTLs differ', () => {
    expect(uniformTtl(result([answer({ ttl: 60 }), answer({ ttl: 120 })]))).toBeNull()
  })

  it('returns null for no answers', () => {
    expect(uniformTtl(result([]))).toBeNull()
  })
})

describe('BULK_TYPES', () => {
  it('only names types the catalogue knows', () => {
    const known = new Set(DNS_RECORD_TYPES.map((entry) => entry.value))
    for (const type of BULK_TYPES) expect(known.has(type), type).toBe(true)
  })

  it('includes the record types people actually look up', () => {
    expect(BULK_TYPES).toContain('A')
    expect(BULK_TYPES).toContain('MX')
    expect(BULK_TYPES).toContain('TXT')
  })
})
