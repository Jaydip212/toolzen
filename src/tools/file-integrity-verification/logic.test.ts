import { describe, expect, it } from 'vitest'
import {
  parseChecksumLines,
  pickChecksum,
  verifyFile,
  type ExpectedChecksum,
} from './logic'

const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
const MD5_ABC = '900150983cd24fb0d6963f7d28e17f72'

function fileOf(text: string, name = 'abc.txt'): File {
  return new File([new TextEncoder().encode(text)], name, { type: 'text/plain' })
}

describe('parseChecksumLines', () => {
  it('reads a bare hash', () => {
    const entries = parseChecksumLines(SHA256_ABC)
    expect(entries).toHaveLength(1)
    expect(entries[0].hash).toBe(SHA256_ABC)
    expect(entries[0].name).toBeNull()
    expect(entries[0].algorithm).toBe('SHA-256')
  })

  it('reads the sha256sum two-space format', () => {
    const entries = parseChecksumLines(`${SHA256_ABC}  installer.iso`)
    expect(entries[0].name).toBe('installer.iso')
    expect(entries[0].algorithmLabel).toBe('SHA-256')
  })

  it('reads the binary-mode asterisk format', () => {
    const entries = parseChecksumLines(`${SHA256_ABC} *installer.iso`)
    expect(entries[0].name).toBe('installer.iso')
  })

  it('reads several lines', () => {
    const entries = parseChecksumLines(`${SHA256_ABC}  a.iso\n${MD5_ABC}  b.iso`)
    expect(entries).toHaveLength(2)
    expect(entries[1].algorithm).toBe('md5')
  })

  it('reads a hash split into space-separated groups', () => {
    const grouped = SHA256_ABC.replace(/(.{8})/g, '$1 ').trim()
    const entries = parseChecksumLines(grouped)
    expect(entries).toHaveLength(1)
    expect(entries[0].hash).toBe(SHA256_ABC)
  })

  it('ignores blank lines and comments', () => {
    const entries = parseChecksumLines(`\n# a comment\n\n${SHA256_ABC}\n`)
    expect(entries).toHaveLength(1)
  })

  it('handles CRLF line endings', () => {
    const entries = parseChecksumLines(`${SHA256_ABC}  a.iso\r\n${MD5_ABC}  b.iso`)
    expect(entries).toHaveLength(2)
    expect(entries[0].name).toBe('a.iso')
  })

  it('lowercases the hash', () => {
    expect(parseChecksumLines(SHA256_ABC.toUpperCase())[0].hash).toBe(SHA256_ABC)
  })

  it('ignores a value that is not hex', () => {
    expect(parseChecksumLines('zzzz not-a-hash')).toEqual([])
  })

  it('ignores a hash that is too short', () => {
    expect(parseChecksumLines('abc123')).toEqual([])
  })

  it('returns an empty list for empty input', () => {
    expect(parseChecksumLines('')).toEqual([])
    expect(parseChecksumLines('   \n  ')).toEqual([])
  })
})

describe('pickChecksum', () => {
  const entries: ExpectedChecksum[] = [
    { raw: 'a', hash: 'a'.repeat(64), name: 'one.iso', algorithm: 'SHA-256', algorithmLabel: 'SHA-256' },
    { raw: 'b', hash: 'b'.repeat(64), name: 'two.iso', algorithm: 'SHA-256', algorithmLabel: 'SHA-256' },
  ]

  it('prefers the line whose name matches the file', () => {
    expect(pickChecksum(entries, 'two.iso')?.name).toBe('two.iso')
  })

  it('matches the name case-insensitively', () => {
    expect(pickChecksum(entries, 'TWO.ISO')?.name).toBe('two.iso')
  })

  it('falls back to the first identifiable entry', () => {
    expect(pickChecksum(entries, 'unknown.iso')?.name).toBe('one.iso')
  })

  it('skips entries with no identifiable algorithm when falling back', () => {
    const mixed: ExpectedChecksum[] = [
      { raw: 'x', hash: 'zz', name: null, algorithm: null, algorithmLabel: null },
      { raw: 'y', hash: 'a'.repeat(64), name: null, algorithm: 'SHA-256', algorithmLabel: 'SHA-256' },
    ]
    expect(pickChecksum(mixed, 'x')?.algorithm).toBe('SHA-256')
  })

  it('returns null for no entries', () => {
    expect(pickChecksum([], 'x')).toBeNull()
  })
})

describe('verifyFile', () => {
  it('reports a match for a correct SHA-256 checksum', async () => {
    const result = await verifyFile(fileOf('abc'), SHA256_ABC)
    expect(result.verdict).toBe('match')
    expect(result.algorithm).toBe('SHA-256')
    expect(result.actual).toBe(SHA256_ABC)
  })

  it('reports a mismatch for a wrong checksum', async () => {
    const wrong = 'f'.repeat(64)
    const result = await verifyFile(fileOf('abc'), wrong)
    expect(result.verdict).toBe('mismatch')
    expect(result.actual).toBe(SHA256_ABC)
  })

  it('accepts an uppercase checksum with separators', async () => {
    const spaced = SHA256_ABC.toUpperCase().replace(/(.{8})/g, '$1 ').trim()
    const result = await verifyFile(fileOf('abc'), spaced)
    expect(result.verdict).toBe('match')
  })

  it('verifies an MD5 checksum too', async () => {
    const result = await verifyFile(fileOf('abc'), MD5_ABC)
    expect(result.verdict).toBe('match')
    expect(result.algorithm).toBe('md5')
    expect(result.algorithmLabel).toBe('MD5')
  })

  it('picks the matching line out of a multi-file checksum list', async () => {
    const text = [`${'0'.repeat(64)}  other.bin`, `${SHA256_ABC}  abc.txt`].join('\n')
    const result = await verifyFile(fileOf('abc', 'abc.txt'), text)
    expect(result.verdict).toBe('match')
  })

  it('reports no-checksum when nothing was pasted', async () => {
    const result = await verifyFile(fileOf('abc'), '')
    expect(result.verdict).toBe('no-checksum')
    expect(result.actual).toBeNull()
  })

  it('reports unknown-algorithm for a digest of the wrong length', async () => {
    // 50 hex characters matches no supported algorithm (32/40/64/96/128).
    const result = await verifyFile(fileOf('abc'), 'ab'.repeat(25))
    expect(result.verdict).toBe('unknown-algorithm')
  })

  it('detects a single changed byte', async () => {
    const result = await verifyFile(fileOf('abd'), SHA256_ABC)
    expect(result.verdict).toBe('mismatch')
  })

  it('reports progress ending at 1', async () => {
    const seen: number[] = []
    await verifyFile(fileOf('abc'), SHA256_ABC, (fraction) => seen.push(fraction))
    expect(seen[seen.length - 1]).toBe(1)
  })
})
