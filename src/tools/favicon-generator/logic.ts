/**
 * Favicon generation from a single source image.
 */

export interface IconSpec {
  /** The pixel size of one edge. */
  size: number
  /** What it is for. */
  purpose: string
  /** The filename it should be saved as. */
  filename: string
}

/**
 * The set of files a site needs.
 *
 * `apple-touch-icon` is 180×180 and is deliberately opaque, because iOS masks
 * it with its own rounded corners on top of a black square — a transparent
 * PNG there shows as black.
 */
export const ICON_SPECS: IconSpec[] = [
  { size: 16, purpose: 'Browser tab, at standard density', filename: 'favicon-16x16.png' },
  { size: 32, purpose: 'Browser tab, at high density', filename: 'favicon-32x32.png' },
  { size: 180, purpose: 'Apple touch icon, shown on the home screen', filename: 'apple-touch-icon.png' },
  { size: 192, purpose: 'Android home screen', filename: 'android-chrome-192x192.png' },
  { size: 512, purpose: 'Android splash screen and PWA icon', filename: 'android-chrome-512x512.png' },
]

/** Whether the source image is good enough to produce these. */
export function sourceVerdict(size: { width: number; height: number }): { ok: boolean; note: string } {
  const smallest = Math.min(size.width, size.height)
  // The refusal has to be checked first, or a 100-pixel source is told its
  // 512 icon will be "soft" when the Apple icon cannot be made at all.
  if (smallest < 180) {
    return {
      ok: false,
      note: 'A source smaller than 180 pixels cannot produce the Apple icon at all. Choose a larger image.',
    }
  }
  if (smallest < 512) {
    return {
      ok: true,
      note: `A ${smallest}-pixel source will still work for the small icons, but the 512×512 one will be soft. Start from at least 512×512 if you can.`,
    }
  }
  return { ok: true, note: 'That source is large enough for every size, so nothing will be upscaled.' }
}

/** The HTML that links the icons, ready to paste. */
export function linkTags(prefix = '/'): string {
  return [
    `<link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="${prefix}favicon-16x16.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${prefix}apple-touch-icon.png">`,
    `<link rel="manifest" href="${prefix}site.webmanifest">`,
  ].join('\n')
}

/** The web app manifest that goes with the icons. */
export function manifestJson(name: string): string {
  return JSON.stringify(
    {
      name,
      short_name: name,
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    },
    null,
    2,
  )
}

/**
 * Fit a source into a square icon without distorting it.
 *
 * A non-square logo is padded rather than stretched, because a stretched
 * favicon is one of the most obviously broken things on a site.
 */
export function fitInSquare(
  source: { width: number; height: number },
  size: number,
): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
  const ratio = Math.min(size / source.width, size / source.height)
  const drawWidth = Math.max(1, Math.round(source.width * ratio))
  const drawHeight = Math.max(1, Math.round(source.height * ratio))
  return {
    drawWidth,
    drawHeight,
    offsetX: Math.max(0, Math.round((size - drawWidth) / 2)),
    offsetY: Math.max(0, Math.round((size - drawHeight) / 2)),
  }
}

/** The real ICO format needs its own container; the tool says it is not making one. */
export const ICO_NOTE =
  'This tool produces PNG icons. A true .ico file with several sizes inside is not offered, because a browser can use a PNG directly and a wrong ICO is worse than none.'
