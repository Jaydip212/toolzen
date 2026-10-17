import { describe, expect, it } from 'vitest'
import {
  compareChecksums,
  guessAlgorithm,
  hashAllText,
  isAvailable,
  normalizeChecksum,
} from './logic'

describe('normalizeChecksum', () => {
  it('lower-cases the value', () => {
    expect(normalizeChecksum('ABCDEF')).toBe('abcdef')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeChecksum('  abc  ')).toBe('abc')
  })

  it('strips spaces and colons', () => {
    expect(normalizeChecksum('ab cd:ef')).toBe('abcdef')
  })

  it('strips dashes', () => {
    expect(normalizeChecksum('ab-cd-ef')).toBe('abcdef')
  })

  it('strips a leading 0x', () => {
    expect(normalizeChecksum('0xABCDEF')).toBe('abcdef')
  })

  it('returns an empty string for empty input', () => {
    expect(normalizeChecksum('   ')).toBe('')
  })
})

describe('compareChecksums', () => {
  it('matches identical values', () => {
    const result = compareChecksums('abc123', 'abc123')
    expect(result?.match).toBe(true)
    expect(result?.comparable).toBe(true)
  })

  it('matches across case and formatting differences', () => {
    expect(compareChecksums('AB:CD 12', 'abcd12')?.match).toBe(true)
  })

  it('reports a mismatch', () => {
    expect(compareChecksums('abc', 'abd')?.match).toBe(false)
  })

  it('flags values of different lengths as not comparable', () => {
    const result = compareChecksums('abc', 'abcd')
    expect(result?.match).toBe(false)
    expect(result?.comparable).toBe(false)
  })

  it('returns null when the expected value is empty', () => {
    expect(compareChecksums('', 'abc')).toBeNull()
    expect(compareChecksums('   ', 'abc')).toBeNull()
  })

  it('exposes the normalised values', () => {
    const result = compareChecksums('AB CD', 'abcd')
    expect(result?.normalizedExpected).toBe('abcd')
    expect(result?.normalizedActual).toBe('abcd')
  })
})

describe('guessAlgorithm', () => {
  it('recognises a 32-character digest as MD5', () => {
    expect(guessAlgorithm('a'.repeat(32))).toBe('MD5')
  })

  it('recognises a 40-character digest as SHA-1', () => {
    expect(guessAlgorithm('a'.repeat(40))).toBe('SHA-1')
  })

  it('recognises a 64-character digest as SHA-256', () => {
    expect(guessAlgorithm('a'.repeat(64))).toBe('SHA-256')
  })

  it('recognises a 96-character digest as SHA-384', () => {
    expect(guessAlgorithm('a'.repeat(96))).toBe('SHA-384')
  })

  it('recognises a 128-character digest as SHA-512', () => {
    expect(guessAlgorithm('a'.repeat(128))).toBe('SHA-512')
  })

  it('returns null for an unrecognised length', () => {
    expect(guessAlgorithm('abc')).toBeNull()
  })

  it('ignores formatting when guessing', () => {
    expect(guessAlgorithm('a'.repeat(64).replace(/(.{8})/g, '$1 '))).toBe('SHA-256')
  })
})

describe('isAvailable', () => {
  it('always reports MD5 as available', () => {
    expect(isAvailable('md5')).toBe(true)
  })

  it('reports the Web Crypto digests as available in this environment', () => {
    // The test runner provides Web Crypto via Node.
    expect(isAvailable('SHA-256')).toBe(true)
  })
})

describe('hashAllText', () => {
  it('returns a row for every requested algorithm', async () => {
    const rows = await hashAllText('abc', ['md5', 'SHA-256'])
    expect(rows.map((row) => row.id)).toEqual(['md5', 'SHA-256'])
    expect(rows.map((row) => row.label)).toEqual(['MD5', 'SHA-256'])
  })

  it('produces the known MD5 of "abc"', async () => {
    const rows = await hashAllText('abc', ['md5'])
    expect(rows[0].value).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('produces the known SHA-256 of "abc"', async () => {
    const rows = await hashAllText('abc', ['SHA-256'])
    expect(rows[0].value).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashes the empty string', async () => {
    const rows = await hashAllText('', ['md5'])
    expect(rows[0].value).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })

  it('returns an empty array when no algorithms are requested', async () => {
    expect(await hashAllText('abc', [])).toEqual([])
  })

  it('is deterministic', async () => {
    const first = await hashAllText('toolzen', ['SHA-256'])
    const second = await hashAllText('toolzen', ['SHA-256'])
    expect(first[0].value).toBe(second[0].value)
  })
})
