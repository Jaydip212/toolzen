import { describe, expect, it } from 'vitest'
import { DEFAULT_DEDUPE_OPTIONS, removeDuplicateLines, splitLines } from './logic'

describe('splitLines', () => {
  it('returns no lines for empty text', () => {
    expect(splitLines('')).toEqual([])
  })

  it('normalises CRLF', () => {
    expect(splitLines('a\r\nb')).toEqual(['a', 'b'])
  })
})

describe('removeDuplicateLines — keep first', () => {
  it('removes later duplicates', () => {
    const result = removeDuplicateLines('a\nb\na\nc\nb')
    expect(result.text).toBe('a\nb\nc')
    expect(result.removedCount).toBe(2)
    expect(result.duplicateGroups).toBe(2)
  })

  it('reports line counts', () => {
    const result = removeDuplicateLines('a\na\na')
    expect(result.totalLines).toBe(3)
    expect(result.outputLines).toBe(1)
    expect(result.removedCount).toBe(2)
  })

  it('returns empty output for empty input', () => {
    const result = removeDuplicateLines('')
    expect(result.text).toBe('')
    expect(result.totalLines).toBe(0)
  })
})

describe('removeDuplicateLines — keep last', () => {
  it('keeps the final occurrence, preserving its position', () => {
    const result = removeDuplicateLines('a\nb\na', {
      ...DEFAULT_DEDUPE_OPTIONS,
      keep: 'last',
    })
    expect(result.text).toBe('b\na')
  })
})

describe('removeDuplicateLines — case sensitivity', () => {
  it('treats differently-cased lines as distinct when case sensitive', () => {
    const result = removeDuplicateLines('Apple\napple', {
      ...DEFAULT_DEDUPE_OPTIONS,
      caseSensitive: true,
    })
    expect(result.text).toBe('Apple\napple')
  })

  it('treats differently-cased lines as duplicates when case insensitive', () => {
    const result = removeDuplicateLines('Apple\napple', {
      ...DEFAULT_DEDUPE_OPTIONS,
      caseSensitive: false,
    })
    expect(result.text).toBe('Apple')
    expect(result.removedCount).toBe(1)
  })

  it('keeps the original casing of the surviving line', () => {
    const result = removeDuplicateLines('Apple\napple', {
      ...DEFAULT_DEDUPE_OPTIONS,
      caseSensitive: false,
    })
    expect(result.text).toBe('Apple')
  })
})

describe('removeDuplicateLines — whitespace', () => {
  it('treats padded and unpadded lines as distinct by default', () => {
    const result = removeDuplicateLines('apple\n apple')
    expect(result.text).toBe('apple\n apple')
  })

  it('matches padded lines when trimming is on', () => {
    const result = removeDuplicateLines('apple\n apple', {
      ...DEFAULT_DEDUPE_OPTIONS,
      trimLines: true,
    })
    expect(result.text).toBe('apple')
  })
})

describe('removeDuplicateLines — blank lines', () => {
  it('keeps blank lines by default and does not count them as duplicates', () => {
    const result = removeDuplicateLines('a\n\n\na')
    expect(result.text).toBe('a\n\n')
    expect(result.duplicateGroups).toBe(1)
  })

  it('collapses blank lines when they are not protected', () => {
    const result = removeDuplicateLines('a\n\n\na', {
      ...DEFAULT_DEDUPE_OPTIONS,
      ignoreBlankLines: false,
    })
    expect(result.text).toBe('a\n')
  })
})

describe('DEFAULT_DEDUPE_OPTIONS', () => {
  it('is case sensitive, keeps the first copy and protects blank lines', () => {
    expect(DEFAULT_DEDUPE_OPTIONS).toEqual({
      caseSensitive: true,
      trimLines: false,
      ignoreBlankLines: true,
      keep: 'first',
    })
  })
})
