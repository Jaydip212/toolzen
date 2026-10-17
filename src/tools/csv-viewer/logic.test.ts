import { describe, expect, it } from 'vitest'

import {
  MAX_DISPLAY_ROWS,
  cellType,
  delimiterName,
  describeTable,
  normalisedCsv,
  viewCsv,
} from './logic'

describe('viewCsv', () => {
  it('reads a simple table', () => {
    const table = viewCsv('a,b\n1,2\n3,4')
    expect(table.headers).toEqual(['a', 'b'])
    expect(table.rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(table.totalRows).toBe(2)
    expect(table.columns).toBe(2)
  })

  it('detects a semicolon delimiter', () => {
    expect(viewCsv('a;b\n1;2').delimiter).toBe(';')
  })

  it('detects a tab delimiter', () => {
    expect(viewCsv('a\tb\n1\t2').delimiter).toBe('\t')
  })

  it('honours an explicit delimiter', () => {
    expect(viewCsv('a|b\n1|2', { delimiter: '|' }).delimiter).toBe('|')
  })

  it('treats "auto" as detect', () => {
    expect(viewCsv('a;b\n1;2', { delimiter: 'auto' }).delimiter).toBe(';')
  })

  it('generates headers when there is no header row', () => {
    const table = viewCsv('1,2\n3,4', { hasHeader: false })
    expect(table.headers).toEqual(['Column 1', 'Column 2'])
    expect(table.totalRows).toBe(2)
  })

  it('pads short rows to the widest row', () => {
    const table = viewCsv('a,b,c\n1,2')
    expect(table.rows[0]).toEqual(['1', '2', ''])
  })

  it('pads a short header row', () => {
    const table = viewCsv('a\n1,2')
    expect(table.headers).toEqual(['a', ''])
    expect(table.columns).toBe(2)
  })

  it('handles quoted fields containing the delimiter', () => {
    const table = viewCsv('a,b\n"x,y",2')
    expect(table.rows[0]).toEqual(['x,y', '2'])
  })

  it('handles a quoted field containing a newline', () => {
    const table = viewCsv('a,b\n"line1\nline2",2')
    expect(table.rows[0][0]).toBe('line1\nline2')
  })

  it('handles CRLF input', () => {
    const table = viewCsv('a,b\r\n1,2\r\n')
    expect(table.rows).toEqual([['1', '2']])
  })

  it('strips a BOM', () => {
    expect(viewCsv('\ufeffa,b\n1,2').headers[0]).toBe('a')
  })

  it('returns an empty table for empty input', () => {
    const table = viewCsv('')
    expect(table).toEqual({ headers: [], rows: [], totalRows: 0, columns: 0, delimiter: ',', truncated: false })
  })

  it('truncates beyond the display limit', () => {
    const rows = Array.from({ length: MAX_DISPLAY_ROWS + 10 }, (_, index) => `${index},x`)
    const table = viewCsv(`n,v\n${rows.join('\n')}`)
    expect(table.rows).toHaveLength(MAX_DISPLAY_ROWS)
    expect(table.totalRows).toBe(MAX_DISPLAY_ROWS + 10)
    expect(table.truncated).toBe(true)
  })

  it('does not truncate a table at exactly the limit', () => {
    const rows = Array.from({ length: MAX_DISPLAY_ROWS }, (_, index) => `${index},x`)
    expect(viewCsv(`n,v\n${rows.join('\n')}`).truncated).toBe(false)
  })

  it('honours a custom maxRows', () => {
    expect(viewCsv('a\n1\n2\n3', { maxRows: 2 }).rows).toHaveLength(2)
  })

  it('keeps a single-column file working', () => {
    const table = viewCsv('name\nalice\nbob')
    expect(table.columns).toBe(1)
    expect(table.rows).toEqual([['alice'], ['bob']])
  })
})

describe('delimiterName', () => {
  it('names the common delimiters', () => {
    expect(delimiterName(',')).toBe('Comma')
    expect(delimiterName(';')).toBe('Semicolon')
    expect(delimiterName('\t')).toBe('Tab')
    expect(delimiterName('|')).toBe('Pipe')
  })

  it('quotes anything else', () => {
    expect(delimiterName(':')).toContain(':')
  })
})

describe('cellType', () => {
  it('classifies numbers', () => {
    expect(cellType('42')).toBe('number')
    expect(cellType('-3.5')).toBe('number')
    expect(cellType('1e10')).toBe('number')
  })

  it('classifies dates', () => {
    expect(cellType('2026-10-17')).toBe('date')
    expect(cellType('2026-10-17T09:00')).toBe('date')
  })

  it('classifies empty and text', () => {
    expect(cellType('  ')).toBe('empty')
    expect(cellType('hello')).toBe('text')
  })

  it('does not treat a phone number as a number', () => {
    expect(cellType('+44 7700 900123')).toBe('text')
  })
})

describe('normalisedCsv', () => {
  it('writes the header back out', () => {
    const table = viewCsv('a,b\n1,2')
    expect(normalisedCsv(table).split('\r\n')[0]).toBe('a,b')
  })

  it('round-trips through viewCsv', () => {
    const table = viewCsv('a,b\n"x,y",2')
    const reparsed = viewCsv(normalisedCsv(table))
    expect(reparsed.rows).toEqual([['x,y', '2']])
  })
})

describe('describeTable', () => {
  it('describes the shape', () => {
    expect(describeTable(viewCsv('a,b\n1,2'))).toBe('1 row × 2 columns')
  })

  it('uses the singular correctly', () => {
    expect(describeTable(viewCsv('a\n1'))).toBe('1 row × 1 column')
  })

  it('handles an empty table', () => {
    expect(describeTable(viewCsv('a'))).toBe('No data rows.')
  })
})
