/**
 * Colour picking from an image and from the page.
 *
 * Every function here is pure so the read-out can be tested without a canvas.
 */

import {
  averageColour,
  contrastRatio,
  describeColour,
  extractPalette,
  parseColour,
  readableTextOn,
  rgbToHsl,
  toHex,
  toHexUpper,
  toHslString,
  toRgbString,
  wcagLevel,
  type Rgb,
} from '@/lib/colour'

export interface PickedColour {
  hex: string
  upper: string
  rgb: string
  hsl: string
  description: string
  /** Contrast against white and black, the two you have to pick between. */
  onWhite: number
  onBlack: number
  /** Which of the pair reads better. */
  betterOn: 'white' | 'black'
}

/** Everything the read-out shows for one colour. */
export function readout(rgb: Rgb): PickedColour {
  const contrastWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 })
  const contrastBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 })
  return {
    hex: toHex(rgb),
    upper: toHexUpper(rgb),
    rgb: toRgbString(rgb),
    hsl: toHslString(rgbToHsl(rgb)),
    description: describeColour(rgb),
    onWhite: Math.round(contrastWhite * 100) / 100,
    onBlack: Math.round(contrastBlack * 100) / 100,
    betterOn: contrastWhite >= contrastBlack ? 'white' : 'black',
  }
}

/** Copy-ready export formats, offered as buttons. */
export const EXPORTS: Array<{ label: string; test: string; pick: (colour: PickedColour) => string }> = [
  { label: 'HEX', test: '#', pick: (colour) => colour.hex },
  { label: 'HEX upper', test: '#', pick: (colour) => colour.upper },
  { label: 'RGB', test: 'rgb', pick: (colour) => colour.rgb },
  { label: 'HSL', test: 'hsl', pick: (colour) => colour.hsl },
  {
    label: 'CSS variable',
    test: '--',
    pick: (colour) => `--brand: ${colour.hex};`,
  },
  {
    label: 'Tailwind class',
    test: 'text-',
    pick: (colour) => `text-[${colour.hex}]`,
  },
  {
    label: 'Swift UIColor',
    test: 'UIColor',
    pick: (colour) => {
      const parts = colour.rgb.match(/\d+/g) ?? []
      return `UIColor(red: ${Number(parts[0]) / 255}, green: ${Number(parts[1]) / 255}, blue: ${Number(parts[2]) / 255}, alpha: 1)`
    },
  },
]

/**
 * A contrast verdict between two picked colours.
 *
 * Reported as a grade plus a plain sentence, because "AA" alone means nothing
 * to most people using the tool.
 */
export function contrastVerdict(foreground: Rgb, background: Rgb): {
  ratio: number
  level: string
  sentence: string
  suggested: string | null
} {
  const ratio = contrastRatio(foreground, background)
  const level = wcagLevel(foreground, background)
  const sentences: Record<string, string> = {
    AAA: 'Comfortable for any text, at any size.',
    AA: 'Fine for body text at normal sizes.',
    'AA Large': 'Only safe for large text or icons, not for body copy.',
    Fail: 'Too low to read. Change one of the two colours.',
  }
  const suggested =
    level === 'Fail' || level === 'AA Large'
      ? `Try ${toHex(readableTextOn(background))} as the text colour on ${toHex(background)}.`
      : null

  return { ratio: Math.round(ratio * 100) / 100, level, sentence: sentences[level], suggested }
}

/**
 * Read the colour at a point on a canvas.
 *
 * The coordinate is in device pixels relative to the image, so the tool has to
 * account for how the image was scaled to fit — the caller does that, and this
 * function refuses to read outside the image rather than returning whatever
 * the neighbouring transparent pixel happened to be.
 */
export function colourAt(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  x: number,
  y: number,
): Rgb | null {
  if (width <= 0) return null
  const index = (y * width + x) * 4
  if (index < 0 || index + 3 >= pixels.length) return null
  return { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2] }
}

/** The palette read-out for a whole image. */
export function paletteOf(pixels: Uint8ClampedArray | Uint8Array, maxColours = 12) {
  return extractPalette(pixels, { maxColours })
}

/** The average colour, which is often what people actually want. */
export function averageOf(pixels: Uint8ClampedArray | Uint8Array): PickedColour {
  return readout(averageColour(pixels))
}

/** Parse a pasted colour string, or explain what is wrong with it. */
export function parsePasted(input: string): { rgb: Rgb | null; error: string | null } {
  const trimmed = input.trim()
  if (!trimmed) return { rgb: null, error: 'Paste a colour such as #3b82f6 or rgb(59, 130, 246).' }
  const rgb = parseColour(trimmed)
  if (!rgb) {
    return {
      rgb: null,
      error:
        'That is not a colour this tool reads. It understands #abc, #aabbcc and rgb(r, g, b) — nothing with a hue in it, because those need a browser to resolve.',
    }
  }
  return { rgb, error: null }
}
