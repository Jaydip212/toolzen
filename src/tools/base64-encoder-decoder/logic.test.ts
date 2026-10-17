import { describe, expect, it } from 'vitest'

import {
  Base64Error,
  base64ByteLength,
  base64Overhead,
  base64Problem,
  decodeBase64,
  decodeBase64Bytes,
  encodeBase64,
  isValidBase64,
  parseDataUrl,
  textByteLength,
  toDataUrl,
} from './logic'

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text)

describe('encodeBase64', () => {
  it('encodes ASCII', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=')
  })

  it('encodes an empty string', () => {
    expect(encodeBase64('')).toBe('')
  })

  it('encodes UTF-8 correctly rather than failing on non-ASCII', () => {
    expect(encodeBase64('é')).toBe('w6k=')
  })

  it('encodes an emoji', () => {
    expect(encodeBase64('😀')).toBe('8J+YgA==')
  })

  it('encodes a long string without hitting the argument limit', () => {
    const long = 'a'.repeat(100_000)
    expect(encodeBase64(long).length).toBeGreaterThan(100_000)
  })

  it('produces padding for a two-byte remainder', () => {
    expect(encodeBase64('ab')).toBe('YWI=')
  })

  it('produces no padding for a three-byte group', () => {
    expect(encodeBase64('abc')).toBe('YWJj')
  })
})

describe('decodeBase64', () => {
  it('decodes ASCII', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello')
  })

  it('decodes UTF-8', () => {
    expect(decodeBase64('w6k=')).toBe('é')
  })

  it('decodes an emoji', () => {
    expect(decodeBase64('8J+YgA==')).toBe('😀')
  })

  it('ignores whitespace and newlines', () => {
    expect(decodeBase64('aGVs\nbG8=')).toBe('hello')
  })

  it('returns an empty string for empty input', () => {
    expect(decodeBase64('')).toBe('')
  })

  it('round-trips arbitrary text', () => {
    const original = 'Hello, wörld! 123 — “quotes”\nnewline'
    expect(decodeBase64(encodeBase64(original))).toBe(original)
  })

  it('rejects characters outside the alphabet', () => {
    expect(() => decodeBase64('aGVsbG8*')).toThrow(Base64Error)
  })

  it('rejects a length that is not a multiple of four', () => {
    expect(() => decodeBase64('aGVsbG8')).toThrow(/multiple of 4/)
  })

  it('rejects padding in the middle', () => {
    expect(() => decodeBase64('aGV=sbG8=')).toThrow(/Padding/)
  })

  it('rejects bytes that are not valid UTF-8', () => {
    // 0xFF is never valid in UTF-8.
    expect(() => decodeBase64('/w==')).toThrow(/not valid UTF-8/)
  })
})

describe('decodeBase64Bytes', () => {
  it('returns the raw bytes', () => {
    expect(Array.from(decodeBase64Bytes('AQID'))).toEqual([1, 2, 3])
  })

  it('throws on invalid input', () => {
    expect(() => decodeBase64Bytes('!!!!')).toThrow(Base64Error)
  })
})

describe('base64Problem', () => {
  it('accepts valid Base64', () => {
    expect(base64Problem('aGVsbG8=')).toBeNull()
  })

  it('accepts an empty string', () => {
    expect(base64Problem('')).toBeNull()
  })

  it('rejects a bad character', () => {
    expect(base64Problem('abc$')).toContain('alphabet')
  })

  it('rejects a bad length', () => {
    expect(base64Problem('abcde')).toContain('multiple of 4')
  })

  it('rejects mid-string padding', () => {
    expect(base64Problem('a=b=')).toContain('Padding')
  })

  it('accepts two padding characters', () => {
    expect(base64Problem('YQ==')).toBeNull()
  })
})

describe('isValidBase64', () => {
  it('is true for valid input', () => {
    expect(isValidBase64('aGVsbG8=')).toBe(true)
  })

  it('is false for invalid input', () => {
    expect(isValidBase64('hello!')).toBe(false)
  })

  it('tolerates whitespace', () => {
    expect(isValidBase64('aGVs bG8=')).toBe(true)
  })
})

describe('toDataUrl', () => {
  it('builds a data URL', () => {
    expect(toDataUrl(bytesOf('hi'), 'text/plain')).toBe('data:text/plain;base64,aGk=')
  })

  it('falls back to a generic type', () => {
    expect(toDataUrl(bytesOf('hi'), '')).toContain('application/octet-stream')
  })
})

describe('parseDataUrl', () => {
  it('splits a Base64 data URL', () => {
    const parsed = parseDataUrl('data:text/plain;base64,aGVsbG8=')
    expect(parsed.mimeType).toBe('text/plain')
    expect(parsed.base64).toBe('aGVsbG8=')
    expect(new TextDecoder().decode(parsed.bytes)).toBe('hello')
  })

  it('rejects a non-data URL', () => {
    expect(() => parseDataUrl('https://example.com')).toThrow(/not a data: URL/)
  })

  it('rejects a percent-encoded data URL', () => {
    expect(() => parseDataUrl('data:text/plain,hello')).toThrow(/percent-encoded/)
  })

  it('defaults the media type', () => {
    expect(parseDataUrl('data:;base64,aGk=').mimeType).toBe('text/plain')
  })
})

describe('base64ByteLength', () => {
  it('computes the decoded size', () => {
    expect(base64ByteLength('aGVsbG8=')).toBe(5)
  })

  it('handles no padding', () => {
    expect(base64ByteLength('YWJj')).toBe(3)
  })

  it('handles two padding characters', () => {
    expect(base64ByteLength('YQ==')).toBe(1)
  })

  it('returns zero for empty input', () => {
    expect(base64ByteLength('')).toBe(0)
  })

  it('matches the real decoded length', () => {
    const text = 'The quick brown fox'
    expect(base64ByteLength(encodeBase64(text))).toBe(bytesOf(text).length)
  })
})

describe('textByteLength', () => {
  it('counts ASCII bytes', () => {
    expect(textByteLength('abc')).toBe(3)
  })

  it('counts multi-byte characters', () => {
    expect(textByteLength('é')).toBe(2)
    expect(textByteLength('😀')).toBe(4)
  })
})

describe('base64Overhead', () => {
  it('reports about 33 percent for a multiple of three', () => {
    expect(base64Overhead(3)).toBe(33)
  })

  it('reports a higher share for a single byte', () => {
    expect(base64Overhead(1)).toBe(300)
  })

  it('returns zero for no bytes', () => {
    expect(base64Overhead(0)).toBe(0)
  })
})
