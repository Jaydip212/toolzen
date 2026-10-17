import { describe, expect, it } from 'vitest'

import { collectKeys, jsonToCsv, toCell } from './logic'

describe('jsonToCsv', () => {
  it('converts an array of objects', () => {
    const result = jsonToCsv('[{"a":1,"b":2}]')
    expect(result.error).toBeNull()
    expect(result.csv).toBe('a,b\r\n1,2')
    expect(result.rows).toBe(1)
    expect(result.columns).toBe(2)
  })

  it('converts several records', () => {
    const result = jsonToCsv('[{"a":1},{"a":2}]')
    expect(result.csv.split('\r\n')).toEqual(['a', '1', '2'])
  })

  it('converts an array of arrays', () => {
    const result = jsonToCsv('[["a","b"],["c","d"]]')
    expect(result.csv).toBe('column_1,column_2\r\na,b\r\nc,d')
  })

  it('converts a single object as one row', () => {
    const result = jsonToCsv('{"a":1}')
    expect(result.csv).toBe('a\r\n1')
    expect(result.rows).toBe(1)
  })

  it('unions keys across records in first-seen order', () => {
    const result = jsonToCsv('[{"a":1},{"b":2}]')
    expect(result.csv.split('\r\n')[0]).toBe('a,b')
    expect(result.csv.split('\r\n')[1]).toBe('1,')
    expect(result.csv.split('\r\n')[2]).toBe(',2')
  })

  it('reports invalid JSON', () => {
    const result = jsonToCsv('{oops}')
    expect(result.error).toContain('not valid JSON')
  })

  it('rejects a scalar top-level value', () => {
    expect(jsonToCsv('42').error).toContain('Expected an array of objects')
  })

  it('rejects a mixed array', () => {
    expect(jsonToCsv('[1,{"a":2}]').error).toContain('Expected an array of objects')
  })

  it('returns empty output for empty input', () => {
    expect(jsonToCsv('').csv).toBe('')
  })

  it('returns empty output for an empty array', () => {
    expect(jsonToCsv('[]').csv).toBe('')
  })

  it('omits the header row when asked', () => {
    expect(jsonToCsv('[{"a":1}]', { header: false }).csv).toBe('1')
  })

  it('honours a custom delimiter', () => {
    expect(jsonToCsv('[{"a":1,"b":2}]', { delimiter: ';' }).csv).toBe('a;b\r\n1;2')
  })

  it('quotes a value containing the delimiter', () => {
    expect(jsonToCsv('[{"a":"x,y"}]').csv).toBe('a\r\n"x,y"')
  })

  it('quotes a value containing a newline', () => {
    expect(jsonToCsv('[{"a":"x\\ny"}]').csv).toContain('"x\ny"')
  })

  it('escapes an embedded double quote', () => {
    expect(jsonToCsv('[{"a":"say \\"hi\\""}]').csv).toContain('"say ""hi"""')
  })

  it('serialises a nested object as JSON in the cell', () => {
    const result = jsonToCsv('[{"a":{"b":1}}]')
    expect(result.csv).toContain('"{""b"":1}"')
  })

  it('serialises an array as JSON in the cell', () => {
    expect(jsonToCsv('[{"a":[1,2]}]').csv).toContain('"[1,2]"')
  })

  it('writes null and undefined as empty cells', () => {
    expect(jsonToCsv('[{"a":null}]').csv).toBe('a\r\n')
  })

  it('writes booleans as true/false', () => {
    expect(jsonToCsv('[{"a":true,"b":false}]').csv).toBe('a,b\r\ntrue,false')
  })

  it('handles an array of empty objects', () => {
    const result = jsonToCsv('[{},{}]')
    expect(result.columns).toBe(0)
  })
})

describe('toCell', () => {
  it('renders strings unchanged', () => {
    expect(toCell('hello')).toBe('hello')
  })

  it('renders numbers and booleans', () => {
    expect(toCell(42)).toBe('42')
    expect(toCell(false)).toBe('false')
  })

  it('renders null and undefined as empty', () => {
    expect(toCell(null)).toBe('')
    expect(toCell(undefined)).toBe('')
  })

  it('serialises an object', () => {
    expect(toCell({ a: 1 })).toBe('{"a":1}')
  })
})

describe('collectKeys', () => {
  it('collects keys in first-seen order', () => {
    expect(collectKeys([{ b: 1 }, { a: 2, b: 3 }])).toEqual(['b', 'a'])
  })

  it('returns nothing for no records', () => {
    expect(collectKeys([])).toEqual([])
  })
})
