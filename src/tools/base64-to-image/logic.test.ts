import { describe, expect, it } from 'vitest'

import {
  extensionForDataUrl,
  extensionForMime,
  overheadNote,
  parseDataUrl,
  sniffImage,
  suggestImageName,
  validateBase64,
} from './logic'

/** Encode a short string to Base64 in both Node and the browser. */
function toBase64(text: string): string {
  return btoa(text)
}

describe('extensionForMime', () => {
  it('maps the common image formats', () => {
    expect(extensionForMime('image/png')).toBe('png')
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/webp')).toBe('webp')
  })

  it('falls back to .bin for something else', () => {
    expect(extensionForMime('text/plain')).toBe('bin')
    expect(extensionForMime('')).toBe('bin')
  })
})

describe('parseDataUrl', () => {
  it('reads a base64 data URL', () => {
    const parsed = parseDataUrl(`data:image/png;base64,${toBase64('hello')}`)
    expect(parsed?.mime).toBe('image/png')
    expect(parsed && new TextDecoder().decode(parsed.bytes)).toBe('hello')
  })

  it('reads a URL-encoded data URL', () => {
    const parsed = parseDataUrl('data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E')
    expect(parsed?.mime).toBe('image/svg+xml')
    expect(parsed && new TextDecoder().decode(parsed.bytes)).toBe('<svg></svg>')
  })

  it('returns null for something that is not a data URL', () => {
    expect(parseDataUrl('https://example.com/a.png')).toBeNull()
    expect(parseDataUrl('')).toBeNull()
  })

  it('survives a payload that fails to decode', () => {
    // A %-escape that is not valid percent-encoding must not throw.
    expect(() => parseDataUrl('data:image/svg+xml,%zz')).not.toThrow()
  })
})

describe('extensionForDataUrl', () => {
  it('gives an image extension', () => {
    expect(extensionForDataUrl(`data:image/png;base64,${toBase64('x')}`)).toBe('png')
  })

  it('refuses a non-image data URL', () => {
    expect(extensionForDataUrl('data:text/plain;base64,aGk=')).toBeNull()
    expect(extensionForDataUrl('not a data url')).toBeNull()
  })
})

describe('validateBase64', () => {
  it('accepts a clean padded string', () => {
    const result = validateBase64('aGVsbG8=')
    expect(result.ok).toBe(true)
    if (result.ok) expect(new TextDecoder().decode(result.bytes)).toBe('hello')
  })

  it('ignores the whitespace a paste brings with it', () => {
    const result = validateBase64('aGVs\nbG8=\t')
    expect(result.ok).toBe(true)
  })

  it('names a pasted data URL specifically, because it is the common mistake', () => {
    const result = validateBase64('data:image/png;base64,aGVsbG8=')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('whole data URL')
  })

  it('reports a length that is not a multiple of four as truncation', () => {
    const result = validateBase64('aGVsbG8')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('truncated')
  })

  it('rejects characters outside the alphabet', () => {
    const result = validateBase64('not base64!!')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('outside the Base64 alphabet')
  })

  it('rejects padding in the middle of the string', () => {
    // "=" may only appear at the end, so a middle one is a real mistake.
    const result = validateBase64('aG=sbG8=')
    expect(result.ok).toBe(false)
  })

  it('asks for something when the box is empty', () => {
    expect(validateBase64('   ').ok).toBe(false)
    const empty = validateBase64('')
    expect(empty.ok).toBe(false)
    if (!empty.ok) expect(empty.error).toContain('Paste')
  })
})

describe('overheadNote', () => {
  it('explains the four-to-three rule with the real numbers', () => {
    const note = overheadNote(3000)
    expect(note).toContain('4,000')
    expect(note).toContain('four characters for every three bytes')
  })

  it('says so for an empty input rather than showing a zero', () => {
    expect(overheadNote(0)).toContain('Nothing to measure')
  })
})

describe('suggestImageName', () => {
  it('reads the magic bytes and names the file accordingly', () => {
    expect(suggestImageName(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe('decoded-image.png')
    expect(suggestImageName(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))).toBe('decoded-image.jpg')
    expect(suggestImageName(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0]))).toBe('decoded-image.gif')
  })

  it('falls back to .bin when it cannot tell, rather than guessing png', () => {
    expect(suggestImageName(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('decoded-image.bin')
  })
})

describe('sniffImage', () => {
  it('reports both the MIME type and the extension for the formats it knows', () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toEqual({
      mime: 'image/png',
      extension: 'png',
    })
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))).toEqual({
      mime: 'image/jpeg',
      extension: 'jpg',
    })
  })

  it('reads the RIFF and WEBP signatures four bytes apart', () => {
    // "RIFF" at 0 and "WEBP" at 8 is a WebP; RIFF alone is only half the answer.
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
    expect(sniffImage(webp)).toEqual({ mime: 'image/webp', extension: 'webp' })

    const riffOnly = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20])
    expect(sniffImage(riffOnly)).toEqual({
      mime: 'application/octet-stream',
      extension: 'bin',
    })
  })

  it('does not claim a format from a handful of bytes', () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50]))).toEqual({
      mime: 'application/octet-stream',
      extension: 'bin',
    })
  })
})
