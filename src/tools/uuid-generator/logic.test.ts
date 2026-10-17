import { describe, expect, it } from 'vitest'

import {
  NIL_UUID,
  collisionNote,
  describeVersion,
  formatUuid,
  generateBatch,
  generateUuid,
  isValidUuid,
  parseUuid,
} from './logic'

const VALID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

describe('generateUuid', () => {
  it('produces the canonical 8-4-4-4-12 shape', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('produces version 4', () => {
    expect(generateUuid()[14]).toBe('4')
  })

  it('produces an RFC 4122 variant', () => {
    expect(['8', '9', 'a', 'b']).toContain(generateUuid()[19])
  })

  it('does not repeat across a thousand calls', () => {
    const values = new Set(Array.from({ length: 1000 }, () => generateUuid()))
    expect(values.size).toBe(1000)
  })

  it('is lowercase', () => {
    const value = generateUuid()
    expect(value).toBe(value.toLowerCase())
  })
})

describe('formatUuid', () => {
  it('uppercases', () => {
    expect(formatUuid(VALID, { uppercase: true })).toBe(VALID.toUpperCase())
  })

  it('removes hyphens', () => {
    expect(formatUuid(VALID, { hyphens: false })).toBe(VALID.replace(/-/g, ''))
  })

  it('adds braces', () => {
    expect(formatUuid(VALID, { braces: true })).toBe(`{${VALID}}`)
  })

  it('combines options', () => {
    expect(formatUuid(VALID, { uppercase: true, hyphens: false, braces: true })).toBe(
      `{${VALID.replace(/-/g, '').toUpperCase()}}`,
    )
  })

  it('returns the input unchanged with no options', () => {
    expect(formatUuid(VALID)).toBe(VALID)
  })
})

describe('generateBatch', () => {
  it('produces the requested count', () => {
    expect(generateBatch(5)).toHaveLength(5)
  })

  it('clamps to at least one', () => {
    expect(generateBatch(0)).toHaveLength(1)
    expect(generateBatch(-5)).toHaveLength(1)
  })

  it('clamps to a thousand', () => {
    expect(generateBatch(5000)).toHaveLength(1000)
  })

  it('applies formatting to every value', () => {
    for (const value of generateBatch(3, { uppercase: true })) {
      expect(value).toBe(value.toUpperCase())
    }
  })

  it('produces unique values', () => {
    expect(new Set(generateBatch(100)).size).toBe(100)
  })
})

describe('parseUuid', () => {
  it('accepts a canonical UUID', () => {
    const parsed = parseUuid(VALID)
    expect(parsed.valid).toBe(true)
    expect(parsed.version).toBe(4)
    expect(parsed.variant).toBe('RFC 4122')
    expect(parsed.normalized).toBe(VALID)
  })

  it('accepts uppercase', () => {
    expect(parseUuid(VALID.toUpperCase()).valid).toBe(true)
  })

  it('accepts braces', () => {
    expect(parseUuid(`{${VALID}}`).valid).toBe(true)
  })

  it('accepts a hyphens-free form', () => {
    const parsed = parseUuid(VALID.replace(/-/g, ''))
    expect(parsed.valid).toBe(true)
    expect(parsed.normalized).toBe(VALID)
  })

  it('detects the nil UUID', () => {
    const parsed = parseUuid(NIL_UUID)
    expect(parsed.valid).toBe(true)
    expect(parsed.isNil).toBe(true)
  })

  it('detects the max UUID', () => {
    expect(parseUuid('ffffffff-ffff-ffff-ffff-ffffffffffff').isMax).toBe(true)
  })

  it('rejects a short string', () => {
    const parsed = parseUuid('abc')
    expect(parsed.valid).toBe(false)
    expect(parsed.error).toContain('not a UUID')
  })

  it('rejects a non-hex character', () => {
    expect(parseUuid('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz').valid).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(parseUuid('').error).toBe('Enter a UUID.')
  })

  it('reads version 1', () => {
    expect(parseUuid('f47ac10b-58cc-1372-a567-0e02b2c3d479').version).toBe(1)
  })

  it('reads version 7', () => {
    expect(parseUuid('01890a5d-ac96-774b-bcce-b302099a8057').version).toBe(7)
  })

  it('reports a non-RFC variant', () => {
    expect(parseUuid('f47ac10b-58cc-4372-0567-0e02b2c3d479').variant).toBe('NCS (reserved)')
  })

  it('reports a Microsoft variant', () => {
    expect(parseUuid('f47ac10b-58cc-4372-c567-0e02b2c3d479').variant).toBe('Microsoft (reserved)')
  })
})

describe('describeVersion', () => {
  it('describes the common versions', () => {
    expect(describeVersion(4)).toContain('random')
    expect(describeVersion(7)).toContain('sortable')
    expect(describeVersion(1)).toContain('time-based')
  })

  it('handles an unknown version', () => {
    expect(describeVersion(99)).toContain('Not a standard')
    expect(describeVersion(null)).toContain('Not a standard')
  })
})

describe('collisionNote', () => {
  it('states the bit count and the limitation', () => {
    const note = collisionNote()
    expect(note).toContain('122 random bits')
    expect(note).toContain('sort')
  })
})

describe('isValidUuid', () => {
  it('accepts a valid value', () => {
    expect(isValidUuid(VALID)).toBe(true)
  })

  it('rejects an invalid value', () => {
    expect(isValidUuid('nope')).toBe(false)
  })
})
