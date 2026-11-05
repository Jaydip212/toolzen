import { describe, expect, it } from 'vitest'
import { hexPreview, identifySignature, SIGNATURE_COUNT } from './file-signatures'

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16)))
}

function textBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

describe('identifySignature', () => {
  it('recognises the common image formats', () => {
    expect(identifySignature(bytes('89504e470d0a1a0a'))?.extension).toBe('png')
    expect(identifySignature(bytes('ffd8ffe000104a464946'))?.extension).toBe('jpg')
    expect(identifySignature(textBytes('GIF89a..........'))?.extension).toBe('gif')
  })

  it('distinguishes WebP and WAV by the RIFF subtype', () => {
    const riff = (subtype: string) => textBytes(`RIFF\u0000\u0000\u0000\u0000${subtype}....`)
    expect(identifySignature(riff('WEBP'))?.extension).toBe('webp')
    expect(identifySignature(riff('WAVE'))?.extension).toBe('wav')
  })

  it('recognises documents, archives and databases', () => {
    expect(identifySignature(textBytes('%PDF-1.7'))?.extension).toBe('pdf')
    expect(identifySignature(bytes('504b0304'))?.extension).toBe('zip')
    expect(identifySignature(bytes('1f8b08'))?.extension).toBe('gz')
    expect(identifySignature(textBytes('SQLite format 3\u0000'))?.extension).toBe('sqlite')
  })

  it('explains that Office files are ZIP containers', () => {
    const result = identifySignature(bytes('504b0304'))
    expect(result?.note).toContain('Office Open XML')
  })

  it('detects SVG from text, not a magic number, and says so', () => {
    const result = identifySignature(textBytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))
    expect(result?.extension).toBe('svg')
    expect(result?.note).toContain('not a magic number')
  })

  it('returns null for an unknown prefix instead of guessing', () => {
    expect(identifySignature(bytes('0000000000000000'))).toBeNull()
    expect(identifySignature(new Uint8Array(0))).toBeNull()
  })

  it('ships a non-trivial signature table', () => {
    expect(SIGNATURE_COUNT).toBeGreaterThan(15)
  })
})

describe('hexPreview', () => {
  it('shows the leading bytes in lowercase hex', () => {
    expect(hexPreview(bytes('ffd8ff'), 3)).toBe('ff d8 ff')
  })
})
