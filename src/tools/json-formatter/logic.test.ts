import { describe, expect, it } from 'vitest'

import {
  describeJsonError,
  describeRoot,
  formatJson,
  indentString,
  jsonStats,
  minifyJson,
  sortKeysDeep,
  validateJson,
} from './logic'

describe('indentString', () => {
  it('maps each style', () => {
    expect(indentString(2)).toBe('  ')
    expect(indentString(4)).toBe('    ')
    expect(indentString('tab')).toBe('\t')
  })
})

describe('formatJson', () => {
  it('pretty-prints with two spaces by default', () => {
    expect(formatJson('{"a":1}').output).toBe('{\n  "a": 1\n}')
  })

  it('honours a four-space indent', () => {
    expect(formatJson('{"a":1}', { indent: 4 }).output).toBe('{\n    "a": 1\n}')
  })

  it('honours a tab indent', () => {
    expect(formatJson('{"a":1}', { indent: 'tab' }).output).toBe('{\n\t"a": 1\n}')
  })

  it('returns empty output for empty input', () => {
    expect(formatJson('   ').output).toBe('')
    expect(formatJson('   ').ok).toBe(true)
  })

  it('reports an error for invalid JSON', () => {
    const result = formatJson('{"a":}')
    expect(result.ok).toBe(false)
    expect(result.error).not.toBeNull()
  })

  it('preserves array order when sorting keys', () => {
    const output = formatJson('[3,1,2]', { sortKeys: true }).output
    expect(JSON.parse(output)).toEqual([3, 1, 2])
  })

  it('sorts object keys when asked', () => {
    const output = formatJson('{"b":1,"a":2}', { sortKeys: true }).output
    expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"b"'))
  })

  it('does not sort when not asked', () => {
    const output = formatJson('{"b":1,"a":2}').output
    expect(output.indexOf('"b"')).toBeLessThan(output.indexOf('"a"'))
  })

  it('sorts nested keys too', () => {
    const output = formatJson('{"z":{"b":1,"a":2}}', { sortKeys: true }).output
    expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"b"'))
  })

  it('keeps numbers as numbers', () => {
    const output = formatJson('{"n":1.50}')
    expect(JSON.parse(output.output)).toEqual({ n: 1.5 })
  })
})

describe('minifyJson', () => {
  it('removes all whitespace', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}').output).toBe('{"a":1,"b":[1,2]}')
  })

  it('handles empty input', () => {
    expect(minifyJson('').output).toBe('')
  })

  it('reports invalid JSON', () => {
    expect(minifyJson('{oops}').ok).toBe(false)
  })

  it('preserves string content exactly', () => {
    expect(minifyJson('{ "a" : "hello  world " }').output).toBe('{"a":"hello  world "}')
  })
})

describe('describeJsonError', () => {
  it('reads a line and column when V8 provides them', () => {
    const error = describeJsonError(new Error('Unexpected token } in JSON at line 3 column 5'), '')
    expect(error.line).toBe(3)
    expect(error.column).toBe(5)
  })

  it('derives a line and column from a position', () => {
    const text = '{\n  "a": 1,\n}'
    // Position 12 is the trailing brace — line 3, column 1.
    const error = describeJsonError(new Error('Unexpected token } in JSON at position 12'), text)
    expect(error.line).toBe(3)
    expect(error.column).toBe(1)
  })

  it('returns nulls when neither is present', () => {
    const error = describeJsonError(new Error('Something odd'), '')
    expect(error.line).toBeNull()
    expect(error.column).toBeNull()
  })

  it('handles a non-Error value', () => {
    expect(describeJsonError('plain string', '').message).toBe('plain string')
  })

  it('clamps a position beyond the text length', () => {
    const error = describeJsonError(new Error('at position 999'), '{}')
    expect(error.line).toBe(1)
    expect(error.column).toBe(3)
  })
})

describe('validateJson', () => {
  it('returns null for valid JSON', () => {
    expect(validateJson('{"a":1}')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(validateJson('  ')).toBeNull()
  })

  it('returns an error for invalid JSON', () => {
    expect(validateJson('{')).not.toBeNull()
  })

  it('accepts a bare scalar', () => {
    expect(validateJson('42')).toBeNull()
    expect(validateJson('"text"')).toBeNull()
    expect(validateJson('null')).toBeNull()
  })

  it('rejects a trailing comma', () => {
    expect(validateJson('{"a":1,}')).not.toBeNull()
  })

  it('rejects single quotes', () => {
    expect(validateJson("{'a':1}")).not.toBeNull()
  })
})

describe('jsonStats', () => {
  it('counts keys, objects and arrays', () => {
    const stats = jsonStats('{"a":1,"b":[1,2],"c":{"d":2}}')
    expect(stats.keys).toBe(4)
    expect(stats.objects).toBe(2)
    expect(stats.arrays).toBe(1)
  })

  it('reports depth', () => {
    expect(jsonStats('{"a":{"b":{"c":1}}}').depth).toBe(3)
  })

  it('reports depth 1 for a flat object', () => {
    expect(jsonStats('{"a":1}').depth).toBe(1)
  })

  it('counts bytes as UTF-8', () => {
    expect(jsonStats('"é"').bytes).toBe(4)
  })

  it('returns zeros for invalid JSON but still counts bytes', () => {
    const stats = jsonStats('{oops}')
    expect(stats.keys).toBe(0)
    expect(stats.bytes).toBe(6)
  })

  it('handles empty input', () => {
    const stats = jsonStats('')
    expect(stats).toEqual({ keys: 0, objects: 0, arrays: 0, depth: 0, bytes: 0, lines: 0 })
  })

  it('counts lines', () => {
    expect(jsonStats('{\n"a":1\n}').lines).toBe(3)
  })
})

describe('sortKeysDeep', () => {
  it('sorts object keys', () => {
    expect(Object.keys(sortKeysDeep({ b: 1, a: 2 }) as object)).toEqual(['a', 'b'])
  })

  it('leaves arrays in order', () => {
    expect(sortKeysDeep([2, 1])).toEqual([2, 1])
  })

  it('recurses into arrays of objects', () => {
    const sorted = sortKeysDeep([{ b: 1, a: 2 }]) as Array<Record<string, number>>
    expect(Object.keys(sorted[0])).toEqual(['a', 'b'])
  })

  it('leaves scalars alone', () => {
    expect(sortKeysDeep('x')).toBe('x')
    expect(sortKeysDeep(null)).toBeNull()
    expect(sortKeysDeep(7)).toBe(7)
  })
})

describe('describeRoot', () => {
  it('names the root type', () => {
    expect(describeRoot('{"a":1}')).toBe('object')
    expect(describeRoot('[1,2,3]')).toBe('array of 3')
    expect(describeRoot('"x"')).toBe('string')
    expect(describeRoot('null')).toBe('null')
    expect(describeRoot('7')).toBe('number')
  })

  it('reports empty and invalid', () => {
    expect(describeRoot('')).toBe('empty')
    expect(describeRoot('{')).toBe('invalid')
  })
})
