export const NIL_UUID = '00000000-0000-0000-0000-000000000000'

export interface UuidOptions {
  uppercase?: boolean
  braces?: boolean
  hyphens?: boolean
}

export interface ParsedUuid {
  valid: boolean
  /** The canonical lowercase, hyphenated form. */
  normalized: string
  /** The version digit, or `null` when the string is not a versioned UUID. */
  version: number | null
  /** RFC 4122 variant name, or `null`. */
  variant: string | null
  /** True for the all-zero UUID. */
  isNil: boolean
  /** True for the all-ones UUID. */
  isMax: boolean
  error: string | null
}

/** Generate one version 4 UUID. */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback: build a v4 UUID from random bytes.
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  }

  // Version 4, variant 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Apply the chosen formatting to a UUID. */
export function formatUuid(uuid: string, options: UuidOptions = {}): string {
  let value = uuid
  if (options.hyphens === false) value = value.replace(/-/g, '')
  if (options.uppercase) value = value.toUpperCase()
  if (options.braces) value = `{${value}}`
  return value
}

/** Generate a batch of UUIDs. */
export function generateBatch(count: number, options: UuidOptions = {}): string[] {
  const safe = Math.max(1, Math.min(1000, Math.floor(count)))
  return Array.from({ length: safe }, () => formatUuid(generateUuid(), options))
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Parse and classify a UUID.
 *
 * Accepts braces, uppercase and a missing hyphens form. Reports the version
 * digit and the RFC 4122 variant rather than just "valid".
 */
export function parseUuid(input: string): ParsedUuid {
  const cleaned = input.trim().replace(/^\{|\}$/g, '')
  const invalid: ParsedUuid = {
    valid: false,
    normalized: '',
    version: null,
    variant: null,
    isNil: false,
    isMax: false,
    error: null,
  }

  if (cleaned === '') return { ...invalid, error: 'Enter a UUID.' }

  // Restore hyphens when they were stripped.
  const withHyphens = /^[0-9a-f]{32}$/i.test(cleaned)
    ? `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`
    : cleaned

  const match = UUID_PATTERN.exec(withHyphens)
  if (!match) {
    return {
      ...invalid,
      error: 'That is not a UUID. A canonical UUID has 32 hexadecimal digits in five groups: 8-4-4-4-12.',
    }
  }

  const normalized = withHyphens.toLowerCase()
  const version = Number(match[1])
  const variantNibble = parseInt(match[2], 16)

  let variant: string
  if ((variantNibble & 0x8) === 0) variant = 'NCS (reserved)'
  else if ((variantNibble & 0xc) === 0x8) variant = 'RFC 4122'
  else if ((variantNibble & 0xe) === 0xc) variant = 'Microsoft (reserved)'
  else variant = 'Reserved'

  return {
    valid: true,
    normalized,
    version,
    variant,
    isNil: normalized === NIL_UUID,
    isMax: normalized === 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    error: null,
  }
}

/** What a version number means, in plain English. */
export function describeVersion(version: number | null): string {
  switch (version) {
    case 1:
      return 'Version 1 — time-based. Includes a timestamp and the generating node, which can leak a MAC address.'
    case 2:
      return 'Version 2 — DCE security. Rarely used.'
    case 3:
      return 'Version 3 — MD5 name-based. Deterministic: the same name always produces the same UUID.'
    case 4:
      return 'Version 4 — random. 122 random bits, the usual choice for identifiers.'
    case 5:
      return 'Version 5 — SHA-1 name-based. Deterministic, like version 3 but with SHA-1.'
    case 6:
      return 'Version 6 — reordered time-based, sortable by creation time.'
    case 7:
      return 'Version 7 — Unix-time-based and sortable, designed for database keys.'
    case 8:
      return 'Version 8 — custom. The layout is defined by the implementation.'
    default:
      return 'Not a standard version number.'
  }
}

/** Rough collision guidance for a v4 UUID, for the honesty note. */
export function collisionNote(): string {
  return (
    'A version 4 UUID carries 122 random bits. You would need to generate about 2.7 × 10¹⁸ of them ' +
    'before a 50% chance of any collision — but it is random, not sequential, so it is a poor ' +
    'primary key if you need rows to sort by insertion order.'
  )
}

/** True when the string is a valid UUID. */
export function isValidUuid(input: string): boolean {
  return parseUuid(input).valid
}
