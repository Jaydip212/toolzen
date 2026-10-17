import { describe, expect, it } from 'vitest'
import {
  csvToObjects,
  detectDelimiter,
  objectsToCsv,
  parseCsv,
  serializeCsv,
} from './csv'

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('keeps empty trailing fields', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ])
  })

  it('handles quoted fields containing the delimiter', () => {
    expect(parseCsv('name,note\n"Doe, Jane",hello')).toEqual([
      ['name', 'note'],
      ['Doe, Jane', 'hello'],
    ])
  })

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([['a'], ['say "hi"']])
  })

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n"line1\nline2",x')).toEqual([
      ['a', 'b'],
      ['line1\nline2', 'x'],
    ])
  })

  it('accepts CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('does not add a trailing empty row for a trailing newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']])
  })

  it('returns an empty grid for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('\ufeffa,b')).toEqual([['a', 'b']])
  })

  it('pads short rows so the grid is rectangular', () => {
    expect(parseCsv('a,b,c\n1,2')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', ''],
    ])
  })

  it('supports a custom delimiter', () => {
    expect(parseCsv('a;b;c', ';')).toEqual([['a', 'b', 'c']])
  })
})

describe('serializeCsv', () => {
  it('joins cells with the delimiter and rows with CRLF', () => {
    expect(serializeCsv([['a', 'b'], ['1', '2']])).toBe('a,b\r\n1,2')
  })

  it('quotes cells that contain the delimiter, quotes or newlines', () => {
    expect(serializeCsv([['Doe, Jane'], ['say "hi"'], ['two\nlines']])).toBe(
      '"Doe, Jane"\r\n"say ""hi"""\r\n"two\nlines"',
    )
  })

  it('quotes cells with leading or trailing whitespace', () => {
    expect(serializeCsv([[' padded ']])).toBe('" padded "')
  })

  it('renders null and undefined as empty cells', () => {
    expect(serializeCsv([[null, undefined, 0]])).toBe(',,0')
  })

  it('round-trips a tricky grid', () => {
    const grid = [
      ['name', 'note', 'qty'],
      ['Doe, Jane', 'say "hi"\nthere', '3'],
    ]
    expect(parseCsv(serializeCsv(grid))).toEqual(grid)
  })
})

describe('detectDelimiter', () => {
  it('detects a comma', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })

  it('detects a semicolon', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })

  it('detects a tab', () => {
    expect(detectDelimiter('a\tb\tc')).toBe('\t')
  })

  it('falls back to a comma when there is no delimiter', () => {
    expect(detectDelimiter('single')).toBe(',')
  })
})

describe('csvToObjects', () => {
  it('keys rows by the header', () => {
    expect(csvToObjects(parseCsv('name,age\nAda,36'))).toEqual([{ name: 'Ada', age: '36' }])
  })

  it('names blank headers by position', () => {
    expect(csvToObjects(parseCsv('name,\nAda,36'))).toEqual([{ name: 'Ada', column_2: '36' }])
  })

  it('returns an empty array for a header-only grid', () => {
    expect(csvToObjects(parseCsv('name,age'))).toEqual([])
  })

  it('returns an empty array for an empty grid', () => {
    expect(csvToObjects([])).toEqual([])
  })
})

describe('objectsToCsv', () => {
  it('uses the union of keys as the header', () => {
    expect(objectsToCsv([{ a: 1 }, { b: 2 }])).toEqual([
      ['a', 'b'],
      ['1', ''],
      ['', '2'],
    ])
  })

  it('serialises nested values as JSON', () => {
    expect(objectsToCsv([{ a: { b: 1 } }])).toEqual([['a'], ['{"b":1}']])
  })

  it('renders null and undefined as empty cells', () => {
    expect(objectsToCsv([{ a: null, b: undefined }])).toEqual([['a', 'b'], ['', '']])
  })
})
