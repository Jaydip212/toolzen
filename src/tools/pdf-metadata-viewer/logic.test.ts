import { describe, expect, it } from 'vitest'

import {
  MISSING_NOTE,
  SCOPE_NOTE,
  formatDate,
  isEmptyMetadata,
  metadataSummary,
  toRows,
  type RawMetadata,
} from './logic'

function raw(overrides: Partial<RawMetadata> = {}): RawMetadata {
  return {
    title: null,
    author: null,
    subject: null,
    keywords: null,
    producer: null,
    creator: null,
    creationDate: null,
    modificationDate: null,
    pageCount: 1,
    hasXmp: false,
    permissions: [],
    ...overrides,
  }
}

describe('toRows', () => {
  it('marks a field that is absent rather than filling it in', () => {
    const rows = toRows(raw({ pageCount: 3 }))
    expect(rows).toHaveLength(8)
    expect(rows.every((row) => row.missing)).toBe(true)
    expect(rows[0]).toEqual({ label: 'Title', value: 'not stated in the document', missing: true })
  })

  it('shows a field the document does state', () => {
    const rows = toRows(raw({ title: 'Quarterly report', author: '  ' }))
    const title = rows.find((row) => row.label === 'Title')
    expect(title).toEqual({ label: 'Title', value: 'Quarterly report', missing: false })
    // A whitespace-only author is still absent.
    expect(rows.find((row) => row.label === 'Author')?.missing).toBe(true)
  })

  it('reads dates as wall-clock readings', () => {
    const rows = toRows(raw({ creationDate: new Date(2024, 2, 7, 14, 22, 31) }))
    expect(rows.find((row) => row.label === 'Created')?.value).toBe('2024-03-07 14:22:31')
  })
})

describe('formatDate', () => {
  it('pads every field to two digits', () => {
    expect(formatDate(new Date(2024, 0, 5, 9, 3, 7))).toBe('2024-01-05 09:03:07')
  })

  it('reports the local reading, because a PDF date has no timezone', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59)
    expect(formatDate(date)).toBe('2024-12-31 23:59:59')
  })
})

describe('metadataSummary', () => {
  it('counts pages and stated fields', () => {
    const rows = toRows(raw({ pageCount: 12, title: 'T', producer: 'P' }))
    expect(metadataSummary(rows, 12)).toBe('12 pages, 2 of 8 fields stated.')
  })

  it('gets the page singular right', () => {
    expect(metadataSummary(toRows(raw({ pageCount: 1 })), 1)).toBe('1 page, 0 of 8 fields stated.')
  })
})

describe('isEmptyMetadata', () => {
  it('is true for a document that states nothing', () => {
    expect(isEmptyMetadata(toRows(raw()))).toBe(true)
  })

  it('is false once any field is present', () => {
    expect(isEmptyMetadata(toRows(raw({ title: 'T' })))).toBe(false)
  })
})

describe('the notes', () => {
  it('explains a missing field as the file’s own doing', () => {
    expect(MISSING_NOTE).toContain('absent from the file itself')
    expect(MISSING_NOTE).toContain('invents one')
  })

  it('states the limits of the report', () => {
    expect(SCOPE_NOTE).toContain('XMP')
    expect(SCOPE_NOTE).toContain('advisory')
  })
})
