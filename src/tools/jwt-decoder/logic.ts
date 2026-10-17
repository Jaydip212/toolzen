/**
 * JWT decoding for the JWT Decoder tool.
 *
 * IMPORTANT: this decodes only. It does NOT verify the signature, and the UI
 * must say so. A decoded token proves nothing about who issued it — anyone can
 * craft a token with any payload.
 */

export class JwtError extends Error {}

/** Decode a Base64URL string into a UTF-8 string. */
export function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  let binary: string
  try {
    binary = atob(padded)
  } catch {
    throw new JwtError('The token contains a segment that is not valid Base64URL.')
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Encode a UTF-8 string as Base64URL without padding. */
export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  /** The raw Base64URL signature segment. */
  signature: string
  /** Base64URL segments as they appeared in the token. */
  segments: { header: string; payload: string; signature: string }
}

/** Decode a JWT into its header and payload. Throws `JwtError` when malformed. */
export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim()
  if (trimmed === '') throw new JwtError('Paste a token first.')

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    throw new JwtError(
      `A JWT has three dot-separated segments (header.payload.signature), but this one has ${parts.length}.`,
    )
  }

  const [headerSegment, payloadSegment, signature] = parts

  const parse = (segment: string, label: string): Record<string, unknown> => {
    const json = base64UrlDecode(segment)
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new JwtError(`The ${label} segment is not valid JSON.`)
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new JwtError(`The ${label} segment must be a JSON object.`)
    }
    return parsed as Record<string, unknown>
  }

  return {
    header: parse(headerSegment, 'header'),
    payload: parse(payloadSegment, 'payload'),
    signature,
    segments: { header: headerSegment, payload: payloadSegment, signature },
  }
}

/** A claim rendered for display. */
export interface ClaimRow {
  key: string
  /** Friendly name for the registered claims. */
  label: string
  /** The value as text. */
  value: string
  /** Human-readable form, for the numeric date claims. */
  human?: string
  /** A short description of what the claim means. */
  description?: string
}

/** Registered claims from RFC 7519. */
const REGISTERED: Record<string, { label: string; description: string; date?: boolean }> = {
  iss: { label: 'Issuer', description: 'Who issued the token.' },
  sub: { label: 'Subject', description: 'Who or what the token is about.' },
  aud: { label: 'Audience', description: 'Who the token is intended for.' },
  exp: { label: 'Expires at', description: 'The token is invalid after this time.', date: true },
  nbf: { label: 'Not before', description: 'The token is invalid before this time.', date: true },
  iat: { label: 'Issued at', description: 'When the token was created.', date: true },
  jti: { label: 'JWT ID', description: 'A unique identifier for this token.' },
}

/** Render a value for display. */
function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Turn the payload into displayable rows, registered claims first. */
export function describeClaims(payload: Record<string, unknown>): ClaimRow[] {
  const rows: ClaimRow[] = []

  for (const [key, meta] of Object.entries(REGISTERED)) {
    if (!(key in payload)) continue
    const raw = payload[key]
    const row: ClaimRow = {
      key,
      label: meta.label,
      value: stringify(raw),
      description: meta.description,
    }
    if (meta.date && typeof raw === 'number' && Number.isFinite(raw)) {
      row.human = new Date(raw * 1000).toUTCString()
    }
    rows.push(row)
  }

  for (const [key, raw] of Object.entries(payload)) {
    if (key in REGISTERED) continue
    rows.push({ key, label: key, value: stringify(raw) })
  }

  return rows
}

export interface JwtStatus {
  /** `null` when the token has no `exp` claim. */
  expired: boolean | null
  /** `null` when the token has no `nbf` claim. */
  notYetValid: boolean | null
  issuedAt: Date | null
  expiresAt: Date | null
  notBefore: Date | null
  /** Seconds until expiry; negative once expired. `null` without an `exp`. */
  secondsUntilExpiry: number | null
}

/** Evaluate the time-based claims. `now` is in milliseconds. */
export function jwtStatus(payload: Record<string, unknown>, now: number = Date.now()): JwtStatus {
  const asDate = (value: unknown): Date | null =>
    typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null

  const issuedAt = asDate(payload.iat)
  const expiresAt = asDate(payload.exp)
  const notBefore = asDate(payload.nbf)

  return {
    expired: expiresAt ? expiresAt.getTime() <= now : null,
    notYetValid: notBefore ? notBefore.getTime() > now : null,
    issuedAt,
    expiresAt,
    notBefore,
    secondsUntilExpiry: expiresAt ? Math.round((expiresAt.getTime() - now) / 1000) : null,
  }
}

/** Render a number of seconds as a compact human duration. */
export function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds)
  const sign = seconds < 0 ? 'ago' : 'from now'
  if (abs < 60) return `${abs} second${abs === 1 ? '' : 's'} ${sign}`
  if (abs < 3600) return `${Math.round(abs / 60)} minute${Math.round(abs / 60) === 1 ? '' : 's'} ${sign}`
  if (abs < 86400) return `${Math.round(abs / 3600)} hour${Math.round(abs / 3600) === 1 ? '' : 's'} ${sign}`
  const days = Math.round(abs / 86400)
  if (days < 365) return `${days} day${days === 1 ? '' : 's'} ${sign}`
  const years = (abs / 31557600).toFixed(1)
  return `${years} years ${sign}`
}

/** A short summary of the signing algorithm, for the header panel. */
export function describeAlgorithm(header: Record<string, unknown>): string {
  const alg = header.alg
  if (typeof alg !== 'string') return 'No `alg` field in the header.'
  if (alg === 'none') return 'The header declares `none` — this token is NOT signed.'
  if (alg.startsWith('HS')) return `${alg} is a symmetric HMAC algorithm. The same secret signs and verifies.`
  if (alg.startsWith('RS') || alg.startsWith('PS')) return `${alg} is an asymmetric RSA algorithm.`
  if (alg.startsWith('ES')) return `${alg} is an asymmetric ECDSA algorithm.`
  return `${alg} is not a recognised JOSE algorithm.`
}
