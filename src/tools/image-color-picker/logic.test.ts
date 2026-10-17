import { describe, expect, it } from 'vitest'

import {
  EXPORTS,
  colourAt,
  contrastVerdict,
  readout,
  paletteOf,
  parsePasted,
} from './logic'

const RED = { r: 255, g: 0, b: 0 }

describe('describe', () => {
  it('gives every export format for one colour', () => {
    const colour = readout({ r: 59, g: 130, b: 246 })
    expect(colour.hex).toBe('#3b82f6')
    expect(colour.upper).toBe('#3B82F6')
    expect(colour.rgb).toBe('rgb(59, 130, 246)')
    expect(colour.hsl).toBe('hsl(217, 91%, 60%)')
    expect(colour.description).toContain('blue')
  })

  it('reports contrast against both black and white', () => {
    const colour = readout(RED)
    expect(colour.onWhite).toBeCloseTo(4, 0)
    expect(colour.onBlack).toBeCloseTo(5.25, 1)
    // Red reads better on black, which is why the pair is reported.
    expect(colour.betterOn).toBe('black')
  })

  it('picks the readable background for a pale colour', () => {
    // Pale yellow against white is almost invisible; against black it is
    // nearly 19:1. Reporting "black" is the correct, useful answer.
    expect(readout({ r: 255, g: 255, b: 200 }).betterOn).toBe('black')
    // White text only ever wins genuinely on a mid-dark fill, not on white.
    expect(readout({ r: 40, g: 40, b: 40 }).betterOn).toBe('white')
  })
})

describe('EXPORTS', () => {
  it('offers a labelling hint and produces something for every format', () => {
    const colour = readout({ r: 17, g: 34, b: 51 })
    for (const entry of EXPORTS) {
      expect(entry.pick(colour).length).toBeGreaterThan(0)
      expect(entry.pick(colour)).toContain(entry.test)
    }
  })

  it('rounds the Swift channels to fractions, not 0–255 integers', () => {
    const colour = readout({ r: 255, g: 128, b: 0 })
    const swift = EXPORTS.find((entry) => entry.label === 'Swift UIColor')?.pick(colour) ?? ''
    expect(swift).toContain('red: 1')
    expect(swift).toContain('green: 0.5019607843137255')
    expect(swift).not.toContain('green: 128')
  })
})

describe('contrastVerdict', () => {
  it('passes black on white', () => {
    const verdict = contrastVerdict({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })
    expect(verdict.level).toBe('AAA')
    expect(verdict.suggested).toBeNull()
  })

  it('fails red on white and offers a readable alternative', () => {
    const verdict = contrastVerdict(RED, { r: 255, g: 255, b: 255 })
    expect(verdict.level).toBe('AA Large')
    expect(verdict.suggested).toContain('#000000')
  })

  it('gives each level a sentence in plain words', () => {
    for (const [fg, bg, level] of [
      [[0, 0, 0], [255, 255, 255], 'AAA'],
      [[90, 90, 90], [255, 255, 255], 'AA'],
      [[255, 0, 0], [255, 255, 255], 'AA Large'],
      [[200, 200, 200], [255, 255, 255], 'Fail'],
    ] as Array<[[number, number, number], [number, number, number], string]>) {
      const rgb = (values: [number, number, number]) => ({ r: values[0], g: values[1], b: values[2] })
      const verdict = contrastVerdict(rgb(fg), rgb(bg))
      expect(verdict.level).toBe(level)
      expect(verdict.sentence.length).toBeGreaterThan(0)
    }
  })
})

describe('colourAt', () => {
  /** A 2×1 RGBA image: red then blue. */
  const pixels = new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255])

  it('reads the pixel at the index', () => {
    expect(colourAt(pixels, 2, 0, 0)).toEqual(RED)
    expect(colourAt(pixels, 2, 1, 0)).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('returns null outside the image rather than reading a neighbour', () => {
    expect(colourAt(pixels, 2, 2, 0)).toBeNull()
    expect(colourAt(pixels, 2, -1, 0)).toBeNull()
    expect(colourAt(pixels, 0, 0, 0)).toBeNull()
  })

  it('returns null for an empty buffer', () => {
    expect(colourAt(new Uint8Array(), 2, 0, 0)).toBeNull()
  })
})

describe('paletteOf', () => {
  it('caps the swatch count', () => {
    const pixels = new Uint8Array(400 * 4)
    for (let i = 0; i < 400; i += 1) {
      pixels[i * 4] = i % 256
      pixels[i * 4 + 1] = 0
      pixels[i * 4 + 2] = 0
      pixels[i * 4 + 3] = 255
    }
    expect(paletteOf(pixels, 5)).toHaveLength(5)
  })
})

describe('parsePasted', () => {
  it('reads a hex or rgb string', () => {
    expect(parsePasted('#3b82f6').rgb).toEqual({ r: 59, g: 130, b: 246 })
    expect(parsePasted('rgb(59, 130, 246)').rgb).toEqual({ r: 59, g: 130, b: 246 })
  })

  it('asks for a colour when the box is empty', () => {
    expect(parsePasted('').error).toContain('Paste a colour')
  })

  it('explains what it does not read', () => {
    const result = parsePasted('hsl(217, 91%, 60%)')
    expect(result.rgb).toBeNull()
    expect(result.error).toContain('#abc')
    // It says why, rather than just rejecting.
    expect(result.error).toContain('need a browser')
  })
})
