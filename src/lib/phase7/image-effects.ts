/**
 * Image pixel effects, as pure RGBA array transforms.
 *
 * Keeping them as plain array functions means the maths is unit-testable in
 * Node, while the UI just pushes the pixels through a canvas. Each function
 * returns a NEW array — the original is never mutated, so "before/after"
 * previews cannot accidentally share state.
 */

export type ImageEffect = 'grayscale' | 'invert' | 'brightness' | 'contrast'

export const IMAGE_EFFECTS: { id: ImageEffect; label: string; hasAmount: boolean; description: string }[] = [
  { id: 'grayscale', label: 'Grayscale', hasAmount: false, description: 'Luminance-weighted conversion to shades of grey.' },
  { id: 'invert', label: 'Invert colours', hasAmount: false, description: 'Each colour channel becomes its opposite.' },
  { id: 'brightness', label: 'Brightness', hasAmount: true, description: 'Add light evenly across all channels, -100 to 100.' },
  { id: 'contrast', label: 'Contrast', hasAmount: true, description: 'Push channels away from mid-grey, -100 to 100.' },
]

/** How many pixels the browser UI will process before refusing a file. */
export const MAX_IMAGE_PIXELS = 12_000_000

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function mapChannels(
  pixels: Uint8ClampedArray,
  transform: (r: number, g: number, b: number) => [number, number, number],
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels.length)
  for (let index = 0; index < pixels.length; index += 4) {
    const [r, g, b] = transform(pixels[index]!, pixels[index + 1]!, pixels[index + 2]!)
    output[index] = clamp(r)
    output[index + 1] = clamp(g)
    output[index + 2] = clamp(b)
    output[index + 3] = pixels[index + 3]! // alpha never changes
  }
  return output
}

export function applyGrayscale(pixels: Uint8ClampedArray): Uint8ClampedArray {
  return mapChannels(pixels, (r, g, b) => {
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return [luminance, luminance, luminance]
  })
}

export function applyInvert(pixels: Uint8ClampedArray): Uint8ClampedArray {
  return mapChannels(pixels, (r, g, b) => [255 - r, 255 - g, 255 - b])
}

export function applyBrightness(pixels: Uint8ClampedArray, amount: number): Uint8ClampedArray {
  const delta = Math.max(-100, Math.min(100, amount)) * 2.55
  return mapChannels(pixels, (r, g, b) => [r + delta, g + delta, b + delta])
}

export function applyContrast(pixels: Uint8ClampedArray, amount: number): Uint8ClampedArray {
  const c = Math.max(-100, Math.min(100, amount)) * 2.55
  const factor = (259 * (c + 255)) / (255 * (259 - c))
  return mapChannels(pixels, (r, g, b) => [
    factor * (r - 128) + 128,
    factor * (g - 128) + 128,
    factor * (b - 128) + 128,
  ])
}

/** Throws on a malformed amount so the UI can show an error, never a fake result. */
export function applyEffect(
  effect: ImageEffect,
  pixels: Uint8ClampedArray,
  amount = 0,
): Uint8ClampedArray {
  if (pixels.length % 4 !== 0) throw new Error('Pixel data must be RGBA (four channels per pixel).')
  switch (effect) {
    case 'grayscale': return applyGrayscale(pixels)
    case 'invert': return applyInvert(pixels)
    case 'brightness': return applyBrightness(pixels, amount)
    case 'contrast': return applyContrast(pixels, amount)
  }
}
