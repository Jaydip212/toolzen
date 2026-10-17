import { describe, expect, it } from 'vitest'

import { csvToJson, jsonSize, renamedHeaders, uniqueHeaders } from './logic'

describe('csvToJson', () => {
  it('builds an array of objects by default', () => {
    const result = csvToJson('name,age\nAda,36\nAlan,41')
    expect(result.error).toBeNull()
    expect(JSON.parse(result.json)).toEqual([
      { name: 'Ada', age: '36' },
      { name: 'Alan', age: '41' },
    ])
    expect(result.rows).toBe(2)
    expect(result.columns).toBe(2)
  })

  it('builds an array of arrays in arrays mode', () => {
    const result = csvToJson('1,2\n3,4', { mode: 'arrays' })
    expect(JSON.parse(result.json)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
    expect(result.rows).toBe(2)
  })

  it('pads short rows in arrays mode', () => {
    const result = csvToJson('1,2,3\n4', { mode: 'arrays' })
    expect(JSON.parse(result.json)[1]).toEqual(['4', '', ''])
  })

  it('reports when object mode has no data rows', () => {
    const result = csvToJson('name,age')
    expect(result.error).toContain('at least one data row')
  })

  it('returns empty output for empty input', () => {
    const result = csvToJson('')
    expect(result.json).toBe('')
    expect(result.rows).toBe(0)
  })

  it('detects a semicolon delimiter', () => {
    const result = csvToJson('a;b\n1;2')
    expect(result.delimiter).toBe(';')
    expect(JSON.parse(result.json)).toEqual([{ a: '1', b: '2' }])
  })

  it('honours an explicit delimiter', () => {
    expect(csvToJson('a|b\n1|2', { delimiter: '|' }).delimiter).toBe('|')
  })

  it('keeps quoted values intact', () => {
    const result = csvToJson('name,note\n"Smith, J","said ""hi"""')
    expect(JSON.parse(result.json)[0]).toEqual({ name: 'Smith, J', note: 'said "hi"' })
  })

  it('renames a duplicate header instead of losing data', () => {
    const result = csvToJson('a,a\n1,2')
    expect(JSON.parse(result.json)[0]).toEqual({ a: '1', a_2: '2' })
  })

  it('names an empty header', () => {
    const result = csvToJson('a,\n1,2')
    expect(JSON.parse(result.json)[0]).toEqual({ a: '1', column_2: '2' })
  })

  it('pads a short data row to the header width', () => {
    const result = csvToJson('a,b,c\n1')
    expect(JSON.parse(result.json)[0]).toEqual({ a: '1', b: '', c: '' })
  })

  it('can produce compact output', () => {
    expect(csvToJson('a\n1', { pretty: false }).json).toBe('[{"a":"1"}]')
  })

  it('handles CRLF', () => {
    expect(JSON.parse(csvToJson('a,b\r\n1,2\r\n').json)).toEqual([{ a: '1', b: '2' }])
  })
})

describe('uniqueHeaders', () => {
  it('leaves unique headers alone', () => {
    expect(uniqueHeaders(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('suffixes duplicates', () => {
    expect(uniqueHeaders(['a', 'a', 'a'])).toEqual(['a', 'a_2', 'a_3'])
  })

  it('names empty headers', () => {
    expect(uniqueHeaders(['', 'b'])).toEqual(['column_1', 'b'])
  })

  it('trims whitespace', () => {
    expect(uniqueHeaders([' a '])).toEqual(['a'])
  })
})

describe('renamedHeaders', () => {
  it('reports nothing when no change was needed', () => {
    expect(renamedHeaders(['a', 'b'])).toEqual([])
  })

  it('reports a renamed duplicate', () => {
    expect(renamedHeaders(['a', 'a'])).toEqual([{ from: 'a', to: 'a_2' }])
  })

  it('reports a named empty header', () => {
    expect(renamedHeaders([''])).toEqual([{ from: '', to: 'column_1' }])
  })
})

describe('jsonSize', () => {
  it('counts UTF-8 bytes', () => {
    // "é" is two bytes in UTF-8.
    expect(jsonSize('é')).toBe(2)
  })

  it('returns zero for an empty string', () => {
    expect(jsonSize('')).toBe(0)
  })
})
