/**
 * Base64 conversion for images, plus the data-URL plumbing around it.
 */

/** MIME to file extension, for building a download name from a data URL. */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/x-icon': 'ico',
}

export function extensionForMime(mime: string): string {
  return MIME_TO_EXTENSION[mime] ?? 'bin'
}

/** Parse a data URL into its MIME type and its raw bytes. */
export function parseDataUrl(input: string): { mime: string; bytes: Uint8Array } | null {
  const match = input.match(/^data:([^;,]+)(?:;[^,]*)?,(.*)$/s)
  if (!match) return null
  const mime = match[1].trim().toLowerCase()
  const payload = match[2]

  try {
    if (/;base64$/i.test(input.split(',')[0] ?? '')) {
      const binary = atob(payload)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      return { mime, bytes }
    }
    return { mime, bytes: new TextEncoder().encode(decodeURIComponent(payload)) }
  } catch {
    return null
  }
}

/** The extension implied by a data URL, or null if it is not an image. */
export function extensionForDataUrl(input: string): string | null {
  const parsed = parseDataUrl(input)
  if (!parsed) return null
  if (!parsed.mime.startsWith('image/')) return null
  return extensionForMime(parsed.mime)
}

/**
 * Validate a pasted Base64 string.
 *
 * The most common mistake is pasting the whole data URL where the raw Base64
 * was expected, so that is named specifically rather than lumped into a
 * generic "invalid" error.
 */
export function validateBase64(input: string): { ok: true; bytes: Uint8Array } | { ok: false; error: string } {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Paste some Base64 text first.' }

  if (trimmed.startsWith('data:')) {
    return {
      ok: false,
      error:
        'That is a whole data URL, not the Base64 on its own. Copy the part after "base64," and paste that instead.',
    }
  }

  const cleaned = trimmed.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    return { ok: false, error: 'That is not valid Base64. It may contain a character outside the Base64 alphabet, or the padding is in the wrong place.' }
  }
  if (cleaned.length % 4 !== 0) {
    return {
      ok: false,
      error: `That Base64 is ${cleaned.length % 4} character(s) short of a whole group. A length that is not a multiple of four means the text was truncated.`,
    }
  }

  try {
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return { ok: true, bytes }
  } catch {
    return { ok: false, error: 'The browser could not decode that Base64. It may be corrupted.' }
  }
}

/** How much bigger Base64 makes a file, which is always about 33%. */
export function overheadNote(byteLength: number): string {
  if (byteLength <= 0) return 'Nothing to measure yet.'
  const encoded = Math.ceil(byteLength / 3) * 4
  return `${encoded.toLocaleString()} characters for ${byteLength.toLocaleString()} bytes — Base64 uses four characters for every three bytes, so the result is always about a third larger.`
}

/**
 * Read the image format from the first bytes of the data.
 *
 * A data URL's MIME type is only a claim by whoever wrote it; the bytes are
 * the actual answer. PNG, JPEG, GIF and WebP are recognised from their
 * signatures, and anything else is reported as unrecognised rather than
 * guessed at.
 */
export function sniffImage(bytes: Uint8Array): { mime: string; extension: string } {
  const magic = Array.from(bytes.subarray(0, 12))
  const isAscii = (text: string, at: number) =>
    text.split('').every((ch, index) => magic[at + index] === ch.charCodeAt(0))

  if (isAscii('PNG', 1)) return { mime: 'image/png', extension: 'png' }
  if (magic[0] === 0xff && magic[1] === 0xd8) return { mime: 'image/jpeg', extension: 'jpg' }
  if (isAscii('GIF8', 0)) return { mime: 'image/gif', extension: 'gif' }
  if (isAscii('RIFF', 0) && isAscii('WEBP', 8)) return { mime: 'image/webp', extension: 'webp' }
  return { mime: 'application/octet-stream', extension: 'bin' }
}

/** A suggested filename for the decoded image. */
export function suggestImageName(bytes: Uint8Array): string {
  return `decoded-image.${sniffImage(bytes).extension}`
}
