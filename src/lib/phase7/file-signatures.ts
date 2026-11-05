/**
 * File signature (magic number) identification.
 *
 * Pure and client-side: a small prefix is enough to identify most formats.
 * An unknown prefix is reported as unknown — never guessed from the file
 * extension, which is exactly the kind of claim that gets file handling wrong.
 */

export interface FileSignature {
  name: string
  extension: string
  mime: string
  note?: string
}

interface SignatureRule extends FileSignature {
  /** Bytes at fixed offsets, or a prefix match. */
  test: (bytes: Uint8Array) => boolean
}

function startsWith(bytes: Uint8Array, hex: string): boolean {
  const expected = hex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16))
  if (bytes.length < expected.length) return false
  return expected.every((value, index) => bytes[index] === value)
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return Array.from(bytes.slice(offset, offset + length), (byte) => String.fromCharCode(byte)).join('')
}

const RULES: SignatureRule[] = [
  { name: 'PNG image', extension: 'png', mime: 'image/png', test: (b) => startsWith(b, '89504e470d0a1a0a') },
  { name: 'JPEG image', extension: 'jpg', mime: 'image/jpeg', test: (b) => startsWith(b, 'ffd8ff') },
  { name: 'GIF image', extension: 'gif', mime: 'image/gif', test: (b) => ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a' },
  { name: 'WebP image', extension: 'webp', mime: 'image/webp', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP' },
  { name: 'WAV audio', extension: 'wav', mime: 'audio/wav', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WAVE' },
  { name: 'Windows bitmap', extension: 'bmp', mime: 'image/bmp', test: (b) => ascii(b, 0, 2) === 'BM' },
  { name: 'ICO icon', extension: 'ico', mime: 'image/x-icon', test: (b) => startsWith(b, '00000100') },
  { name: 'TIFF image (little-endian)', extension: 'tif', mime: 'image/tiff', test: (b) => startsWith(b, '49492a00') },
  { name: 'TIFF image (big-endian)', extension: 'tif', mime: 'image/tiff', test: (b) => startsWith(b, '4d4d002a') },
  { name: 'PDF document', extension: 'pdf', mime: 'application/pdf', test: (b) => ascii(b, 0, 5) === '%PDF-' },
  { name: 'ZIP archive (also DOCX, XLSX, PPTX, ODT)', extension: 'zip', mime: 'application/zip', note: 'Office Open XML files are ZIP containers — the extension tells you which document type.', test: (b) => startsWith(b, '504b0304') },
  { name: 'GZIP archive', extension: 'gz', mime: 'application/gzip', test: (b) => startsWith(b, '1f8b') },
  { name: '7-Zip archive', extension: '7z', mime: 'application/x-7z-compressed', test: (b) => startsWith(b, '377abcaf271c') },
  { name: 'RAR archive', extension: 'rar', mime: 'application/vnd.rar', test: (b) => startsWith(b, '526172211a07') },
  { name: 'SQLite database', extension: 'sqlite', mime: 'application/vnd.sqlite3', test: (b) => ascii(b, 0, 16) === 'SQLite format 3\u0000' },
  { name: 'ELF executable', extension: 'elf', mime: 'application/x-elf', test: (b) => startsWith(b, '7f454c46') },
  { name: 'MP3 audio (ID3 tag)', extension: 'mp3', mime: 'audio/mpeg', test: (b) => ascii(b, 0, 3) === 'ID3' },
  { name: 'OGG container', extension: 'ogg', mime: 'application/ogg', test: (b) => ascii(b, 0, 4) === 'OggS' },
  { name: 'WOFF font', extension: 'woff', mime: 'font/woff', test: (b) => ascii(b, 0, 4) === 'wOFF' },
  { name: 'WOFF2 font', extension: 'woff2', mime: 'font/woff2', test: (b) => ascii(b, 0, 4) === 'wOF2' },
]

/** Identify a file from its leading bytes, or null when unrecognised. */
export function identifySignature(bytes: Uint8Array): FileSignature | null {
  for (const rule of RULES) {
    if (rule.test(bytes)) {
      const { name, extension, mime, note } = rule
      return { name, extension, mime, ...(note ? { note } : {}) }
    }
  }
  // SVG, HTML and plain text have no magic number — only check printable text,
  // and label it as a text-based guess rather than a confirmed signature.
  const head = ascii(bytes, 0, Math.min(bytes.length, 256)).trimStart().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml') && head.includes('<svg')) {
    return { name: 'SVG image (text-based)', extension: 'svg', mime: 'image/svg+xml', note: 'Detected from the text content, not a magic number.' }
  }
  return null
}

/** Hex dump of the first bytes, for the "unknown" state. */
export function hexPreview(bytes: Uint8Array, count = 16): string {
  return Array.from(bytes.slice(0, count), (byte) => byte.toString(16).padStart(2, '0')).join(' ')
}

export const SIGNATURE_COUNT = RULES.length
