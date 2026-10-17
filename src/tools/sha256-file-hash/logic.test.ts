import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ALGORITHMS,
  FILE_ALGORITHMS,
  LARGE_FILE_BYTES,
  buildChecksumFile,
  checksumFileName,
  computeFileHashes,
  groupHash,
  guessAlgorithm,
  hashesMatch,
  isAvailable,
  largeFileWarning,
  normalizeHash,
  type HashRow,
} from './logic'

/** Build a File whose bytes are the UTF-8 encoding of `text`. */
function fileOf(text: string, name = 'sample.txt'): File {
  return new File([new TextEncoder().encode(text)], name, { type: 'text/plain' })
}

describe('FILE_ALGORITHMS', () => {
  it('offers MD5 plus the Web Crypto digests', () => {
    const ids = FILE_ALGORITHMS.map((algorithm) => algorithm.id)
    expect(ids).toEqual(['md5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'])
  })

  it('defaults to SHA-256', () => {
    expect(DEFAULT_ALGORITHMS).toEqual(['SHA-256'])
  })

  it('marks MD5 as the only non-Web-Crypto digest', () => {
    for (const algorithm of FILE_ALGORITHMS) {
      expect(algorithm.subtle).toBe(algorithm.id !== 'md5')
    }
  })
})

describe('isAvailable', () => {
  it('always reports MD5 as available', () => {
    expect(isAvailable('md5')).toBe(true)
  })

  it('reports the Web Crypto digests as available in this environment', () => {
    expect(isAvailable('SHA-256')).toBe(true)
  })
})

describe('computeFileHashes', () => {
  it('computes the published SHA-256 vector for "abc"', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['SHA-256'])
    expect(rows).toHaveLength(1)
    expect(rows[0].value).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(rows[0].hexLength).toBe(64)
  })

  it('computes the published MD5 vector for "abc"', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['md5'])
    expect(rows[0].value).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('computes the published SHA-1 vector for "abc"', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['SHA-1'])
    expect(rows[0].value).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  it('computes several digests from one file', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['md5', 'SHA-256'])
    expect(rows.map((row) => row.id)).toEqual(['md5', 'SHA-256'])
  })

  it('preserves the requested order', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['SHA-256', 'md5'])
    expect(rows.map((row) => row.id)).toEqual(['SHA-256', 'md5'])
  })

  it('carries the human-readable label', async () => {
    const rows = await computeFileHashes(fileOf('abc'), ['SHA-256'])
    expect(rows[0].label).toBe('SHA-256')
  })

  it('reports progress ending at 1', async () => {
    const seen: number[] = []
    await computeFileHashes(fileOf('abc'), ['md5', 'SHA-256'], (fraction) => seen.push(fraction))
    expect(seen.length).toBeGreaterThan(0)
    expect(seen[seen.length - 1]).toBe(1)
  })

  it('returns nothing when no algorithm is selected', async () => {
    expect(await computeFileHashes(fileOf('abc'), [])).toEqual([])
  })

  it('gives the same digest for the same bytes', async () => {
    const first = await computeFileHashes(fileOf('repeat me'), ['SHA-256'])
    const second = await computeFileHashes(fileOf('repeat me'), ['SHA-256'])
    expect(first[0].value).toBe(second[0].value)
  })

  it('gives different digests for different bytes', async () => {
    const first = await computeFileHashes(fileOf('one'), ['SHA-256'])
    const second = await computeFileHashes(fileOf('two'), ['SHA-256'])
    expect(first[0].value).not.toBe(second[0].value)
  })

  it('handles an empty file', async () => {
    const rows = await computeFileHashes(fileOf(''), ['SHA-256'])
    expect(rows[0].value).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('handles multi-byte characters as UTF-8', async () => {
    const rows = await computeFileHashes(fileOf('héllo — 世界'), ['SHA-256'])
    expect(rows[0].value).toHaveLength(64)
  })
})

describe('normalizeHash', () => {
  it('lowercases', () => {
    expect(normalizeHash('ABCDEF')).toBe('abcdef')
  })

  it('removes whitespace and colons', () => {
    expect(normalizeHash('ab cd:ef')).toBe('abcdef')
  })

  it('removes a leading 0x', () => {
    expect(normalizeHash('0xABCDEF')).toBe('abcdef')
  })

  it('leaves an already-clean digest alone', () => {
    expect(normalizeHash('900150983cd24fb0d6963f7d28e17f72')).toBe(
      '900150983cd24fb0d6963f7d28e17f72',
    )
  })
})

describe('hashesMatch', () => {
  it('matches identical digests', () => {
    expect(hashesMatch('abc123', 'abc123')).toBe(true)
  })

  it('matches across case, spacing and separators', () => {
    expect(
      hashesMatch(
        'BA78 16BF:8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD',
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      ),
    ).toBe(true)
  })

  it('does not match different digests', () => {
    expect(hashesMatch('abc', 'abd')).toBe(false)
  })

  it('does not match when either side is empty', () => {
    expect(hashesMatch('', 'abc')).toBe(false)
    expect(hashesMatch('abc', '')).toBe(false)
  })
})

describe('guessAlgorithm', () => {
  it('identifies a 32-character digest as MD5', () => {
    expect(guessAlgorithm('900150983cd24fb0d6963f7d28e17f72')?.label).toBe('MD5')
  })

  it('identifies a 40-character digest as SHA-1', () => {
    expect(guessAlgorithm('a9993e364706816aba3e25717850c26c9cd0d89d')?.label).toBe('SHA-1')
  })

  it('identifies a 64-character digest as SHA-256', () => {
    expect(
      guessAlgorithm('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')?.label,
    ).toBe('SHA-256')
  })

  it('identifies a 128-character digest as SHA-512', () => {
    expect(guessAlgorithm('a'.repeat(128))?.label).toBe('SHA-512')
  })

  it('returns null for a non-hex value', () => {
    expect(guessAlgorithm('zzzz')).toBeNull()
  })

  it('returns null for an unexpected length', () => {
    expect(guessAlgorithm('abc123')).toBeNull()
  })
})

describe('buildChecksumFile', () => {
  const rows: HashRow[] = [
    { id: 'SHA-256', label: 'SHA-256', value: 'deadbeef', hexLength: 8 },
  ]

  it('uses the two-space sha256sum format', () => {
    expect(buildChecksumFile('report.pdf', rows)).toBe('deadbeef  report.pdf')
  })

  it('writes one line per digest', () => {
    const many: HashRow[] = [
      { id: 'md5', label: 'MD5', value: 'aa', hexLength: 2 },
      { id: 'SHA-256', label: 'SHA-256', value: 'bb', hexLength: 2 },
    ]
    expect(buildChecksumFile('f.bin', many).split('\n')).toEqual(['aa  f.bin', 'bb  f.bin'])
  })

  it('falls back to a placeholder name', () => {
    expect(buildChecksumFile('', rows)).toBe('deadbeef  file')
  })
})

describe('checksumFileName', () => {
  it('names a single-algorithm file after the algorithm', () => {
    expect(checksumFileName('report.pdf', ['SHA-256'])).toBe('report.pdf.sha256.txt')
  })

  it('uses a generic name for several algorithms', () => {
    expect(checksumFileName('report.pdf', ['md5', 'SHA-256'])).toBe('report.pdf.checksums.txt')
  })

  it('handles an empty file name', () => {
    expect(checksumFileName('', ['SHA-256'])).toBe('file.sha256.txt')
  })
})

describe('groupHash', () => {
  it('groups a digest into readable blocks', () => {
    expect(groupHash('abcdefghijkl', 4)).toBe('abcd efgh ijkl')
  })

  it('leaves a short digest unchanged', () => {
    expect(groupHash('abc', 8)).toBe('abc')
  })
})

describe('largeFileWarning', () => {
  it('is null for a small file', () => {
    expect(largeFileWarning(1024)).toBeNull()
  })

  it('warns at the threshold and above', () => {
    expect(largeFileWarning(LARGE_FILE_BYTES)).toMatch(/large/i)
    expect(largeFileWarning(LARGE_FILE_BYTES * 2)).toMatch(/large/i)
  })
})
