/**
 * Hashing helpers.
 *
 * SHA-1/256/384/512 come from the platform's Web Crypto implementation, so the
 * bytes never leave the browser. MD5 is not offered by Web Crypto, so a small
 * RFC 1321 implementation is included below — it is used for legacy checksum
 * comparisons only and is never used to protect anything.
 */

/* -------------------------------------------------------------------------- */
/* Encoding helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Lowercase hex string for a byte buffer. */
export function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/** Uppercase hex string for a byte buffer. */
export function toHexUpper(buffer: ArrayBuffer | Uint8Array): string {
  return toHex(buffer).toUpperCase()
}

/* -------------------------------------------------------------------------- */
/* Web Crypto digests                                                         */
/* -------------------------------------------------------------------------- */

/** Algorithms available through `crypto.subtle`. */
export type SubtleAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

/** Whether the Web Crypto digest API is available in this context. */
export function hasSubtleCrypto(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/** Digest raw bytes with Web Crypto. */
export async function digestBytes(
  algorithm: SubtleAlgorithm,
  data: ArrayBuffer | Uint8Array,
): Promise<ArrayBuffer> {
  if (!hasSubtleCrypto()) {
    throw new Error(
      'Web Crypto is unavailable. Open TOOLZEN over HTTPS or on localhost to hash files.',
    )
  }
  // A fresh copy avoids issues when a Uint8Array view does not cover its whole buffer.
  const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data)
  return crypto.subtle.digest(algorithm, bytes)
}

/** Hex digest of a string, UTF-8 encoded. */
export async function hashText(algorithm: SubtleAlgorithm, text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  return toHex(await digestBytes(algorithm, bytes))
}

/**
 * Hex digest of a File, read as an ArrayBuffer.
 * `onProgress` receives a 0–1 fraction so large files can show a progress bar.
 */
export async function hashFile(
  algorithm: SubtleAlgorithm,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  onProgress?.(0)
  const buffer = await file.arrayBuffer()
  onProgress?.(0.6)
  const result = await digestBytes(algorithm, buffer)
  onProgress?.(1)
  return toHex(result)
}

/* -------------------------------------------------------------------------- */
/* MD5 — RFC 1321                                                             */
/* -------------------------------------------------------------------------- */

/** Per-round left-rotation amounts. */
const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

/** Per-round additive constants: floor(abs(sin(i + 1)) * 2^32). */
const MD5_CONSTANTS = (() => {
  const table = new Uint32Array(64)
  for (let i = 0; i < 64; i += 1) {
    table[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)
  }
  return table
})()

/**
 * MD5 digest as a lowercase hex string.
 *
 * MD5 is cryptographically broken. It is included only so users can compare
 * legacy checksums, and TOOLZEN never recommends it for security purposes.
 */
export function md5(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const bitLength = bytes.length * 8

  // Pad to a multiple of 64 bytes, leaving 8 bytes for the length.
  const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) * 64)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLength >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLength / 4294967296), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const words = new Uint32Array(16)

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4, true)

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let i = 0; i < 64; i += 1) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }

      f = (f + a + MD5_CONSTANTS[i] + words[g]) >>> 0
      a = d
      d = c
      c = b
      b = (b + ((f << MD5_SHIFTS[i]) | (f >>> (32 - MD5_SHIFTS[i])))) >>> 0
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const littleEndianHex = (word: number) =>
    [(word >>> 0) & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

  return littleEndianHex(a0) + littleEndianHex(b0) + littleEndianHex(c0) + littleEndianHex(d0)
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                */
/* -------------------------------------------------------------------------- */

/** Every digest TOOLZEN can compute, in the order they are displayed. */
export const DIGEST_ALGORITHMS = [
  { id: 'md5', label: 'MD5', subtle: false },
  { id: 'SHA-1', label: 'SHA-1', subtle: true },
  { id: 'SHA-256', label: 'SHA-256', subtle: true },
  { id: 'SHA-384', label: 'SHA-384', subtle: true },
  { id: 'SHA-512', label: 'SHA-512', subtle: true },
] as const

export type DigestId = (typeof DIGEST_ALGORITHMS)[number]['id']

/** Compute any supported digest for a string. */
export async function digestText(id: DigestId, text: string): Promise<string> {
  if (id === 'md5') return md5(text)
  return hashText(id, text)
}

/** Compute any supported digest for a File. */
export async function digestFile(
  id: DigestId,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (id === 'md5') {
    onProgress?.(0.2)
    const buffer = await file.arrayBuffer()
    onProgress?.(0.7)
    const result = md5(new Uint8Array(buffer))
    onProgress?.(1)
    return result
  }
  return hashFile(id, file, onProgress)
}

/* -------------------------------------------------------------------------- */
/* Comparing checksums                                                        */
/* -------------------------------------------------------------------------- */

/** Hex length of each digest, used to guess which algorithm produced a value. */
const DIGEST_HEX_LENGTHS: ReadonlyArray<{ id: DigestId; label: string; length: number }> = [
  { id: 'md5', label: 'MD5', length: 32 },
  { id: 'SHA-1', label: 'SHA-1', length: 40 },
  { id: 'SHA-256', label: 'SHA-256', length: 64 },
  { id: 'SHA-384', label: 'SHA-384', length: 96 },
  { id: 'SHA-512', label: 'SHA-512', length: 128 },
]

/**
 * Normalise a pasted checksum so it can be compared.
 *
 * Removes whitespace, colons and a leading `0x`, then lowercases — the same
 * cleanup `sha256sum -c` and every other tool applies before comparing.
 */
export function normalizeDigest(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^0x/, '')
    .replace(/[\s:]/g, '')
}

/** Guess which algorithm produced a pasted checksum, from its length. */
export function guessDigestAlgorithm(
  value: string,
): { id: DigestId; label: string } | null {
  const normalized = normalizeDigest(value)
  if (normalized === '' || !/^[0-9a-f]+$/.test(normalized)) return null
  const match = DIGEST_HEX_LENGTHS.find((entry) => entry.length === normalized.length)
  return match ? { id: match.id, label: match.label } : null
}
