export class Base64Error extends Error {}

const BASE64_CHARS = /^[A-Za-z0-9+/]*={0,2}$/

/** Encode a string as Base64, correctly handling non-ASCII characters. */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return encodeBase64Bytes(bytes)
}

/** Encode raw bytes as Base64. */
export function encodeBase64Bytes(bytes: Uint8Array): string {
  let binary = ''
  // Chunked so a large input does not blow the argument limit of String.fromCharCode.
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

/**
 * Decode Base64 back to a string.
 *
 * Throws `Base64Error` with a specific reason rather than returning mojibake,
 * because a silent wrong answer is worse than a clear refusal.
 */
export function decodeBase64(input: string): string {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned === '') return ''

  const problem = base64Problem(cleaned)
  if (problem) throw new Base64Error(problem)

  let binary: string
  try {
    binary = atob(cleaned)
  } catch {
    throw new Base64Error('That is not valid Base64.')
  }

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Base64Error(
      'The Base64 decodes to bytes that are not valid UTF-8 text. It is probably a binary file — use the file mode instead.',
    )
  }
}

/** Decode Base64 to raw bytes, for binary data. */
export function decodeBase64Bytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '')
  const problem = base64Problem(cleaned)
  if (problem) throw new Base64Error(problem)

  const binary = atob(cleaned)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

/**
 * Explain why a string is not valid Base64, or return `null`.
 *
 * Length must be a multiple of four once padding is accounted for, and the
 * alphabet is checked explicitly — `atob` is lenient in some browsers.
 */
export function base64Problem(cleaned: string): string | null {
  if (cleaned === '') return null
  // Padding placement is checked first so the message names the real problem.
  if (cleaned.includes('=') && !/^[A-Za-z0-9+/]*={1,2}$/.test(cleaned)) {
    return 'Padding is only allowed at the very end of the string.'
  }
  if (!BASE64_CHARS.test(cleaned)) {
    return 'That contains characters outside the Base64 alphabet (A–Z, a–z, 0–9, +, / and =).'
  }
  if (cleaned.length % 4 !== 0) {
    return `Base64 length must be a multiple of 4, but this is ${cleaned.length} characters. Check for a truncated copy.`
  }
  return null
}

/** Whether a string is valid Base64. */
export function isValidBase64(input: string): boolean {
  return base64Problem(input.replace(/\s+/g, '')) === null
}

/** Build a `data:` URL from bytes. */
export function toDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType || 'application/octet-stream'};base64,${encodeBase64Bytes(bytes)}`
}

export interface ParsedDataUrl {
  mimeType: string
  base64: string
  bytes: Uint8Array
}

/** Split a `data:` URL into its media type and payload. */
export function parseDataUrl(input: string): ParsedDataUrl {
  const match = /^data:([^;,]*)(;[^,]*)?,(.*)$/s.exec(input.trim())
  if (!match) throw new Base64Error('That is not a data: URL.')

  const mimeType = match[1] || 'text/plain'
  const parameters = match[2] ?? ''
  const payload = match[3]

  if (!/;base64/i.test(parameters)) {
    throw new Base64Error(
      'This data: URL is percent-encoded rather than Base64. Paste the Base64 form, or decode it with the URL tool instead.',
    )
  }

  const base64 = decodeURIComponent(payload)
  return { mimeType, base64, bytes: decodeBase64Bytes(base64) }
}

/** The decoded size in bytes, without allocating the result. */
export function base64ByteLength(input: string): number {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned === '') return 0
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding)
}

/** Byte length of a UTF-8 string. */
export function textByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Percentage overhead of Base64 relative to the raw bytes. */
export function base64Overhead(bytes: number): number {
  if (bytes === 0) return 0
  const encoded = Math.ceil(bytes / 3) * 4
  return Math.round(((encoded - bytes) / bytes) * 100)
}
