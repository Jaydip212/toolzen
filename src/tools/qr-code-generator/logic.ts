/**
 * QR code decisions.
 *
 * A QR code has a fixed amount of room, and how much depends on the error
 * correction level and on what kind of characters are being stored. The tool
 * says where the input sits against that limit, rather than letting the
 * encoder throw or silently produce a code nobody can scan.
 */

/** The error correction levels, in the order they appear. */
export const EC_LEVELS = [
  { value: 'L', label: 'L — 7% recovery', share: 0.07 },
  { value: 'M', label: 'M — 15% recovery', share: 0.15 },
  { value: 'Q', label: 'Q — 25% recovery', share: 0.25 },
  { value: 'H', label: 'H — 30% recovery', share: 0.3 },
] as const

export type EcLevel = (typeof EC_LEVELS)[number]['value']

/** The kind of data being stored, which decides how densely it packs. */
export type QrMode = 'numeric' | 'alphanumeric' | 'byte'

/** The most characters each mode holds at each correction level. */
const CAPACITY: Record<QrMode, Record<EcLevel, number>> = {
  // The largest QR version, version 40, at each correction level.
  numeric: { L: 7089, M: 5590, Q: 3993, H: 3057 },
  alphanumeric: { L: 4296, M: 3391, Q: 2420, H: 1852 },
  byte: { L: 2953, M: 2331, Q: 1663, H: 1273 },
}

/** QR's own alphanumeric alphabet: uppercase, digits and nine symbols. */
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/

/** Which mode the text packs as. */
export function modeOf(text: string): QrMode {
  if (text === '') return 'byte'
  if (/^[0-9]*$/.test(text)) return 'numeric'
  if (ALPHANUMERIC.test(text)) return 'alphanumeric'
  return 'byte'
}

/** How many characters the code can hold for this text and correction level. */
export function capacityFor(text: string, level: EcLevel): number {
  return CAPACITY[modeOf(text)][level]
}

/** The share of the code's room the text uses, 0 to 1. */
export function fillOf(text: string, level: EcLevel): number {
  const capacity = capacityFor(text, level)
  return capacity === 0 ? 0 : text.length / capacity
}

/** Whether the text cannot fit in a QR code at all. */
export function isTooLong(text: string, level: EcLevel): boolean {
  return text.length > capacityFor(text, level)
}

/**
 * What to tell the user about how the code will scan.
 *
 * A denser code is a harder code: more modules means less tolerance for a
 * scratched label or a phone camera at an angle. That is a real trade against
 * the recovery level, and it deserves saying.
 */
export function capabilityNote(text: string, level: EcLevel): string | null {
  if (text === '') return 'Enter the text or a link to put in the code.'
  if (isTooLong(text, level)) {
    const capacity = capacityFor(text, level)
    return `That is ${text.length - capacity} characters more than a QR code at this recovery level can hold (${capacity.toLocaleString()}). Shorten it, or use a lower correction level.`
  }
  const fill = fillOf(text, level)
  if (fill > 0.75) {
    return 'That is a dense code. It holds the data, but the modules are small, so a scratched label or an angled phone camera may struggle to read it.'
  }
  if (fill > 0.4) {
    return 'That is a moderately dense code. It will scan fine at a reasonable size and in good light.'
  }
  return null
}

/** A line describing the code, e.g. "42 characters as byte data at M recovery". */
export function qrSummary(text: string, level: EcLevel): string {
  if (text === '') return 'Nothing to encode yet.'
  const mode = modeOf(text)
  const room = capacityFor(text, level)
  const chars = text.length === 1 ? '1 character' : `${text.length} characters`
  const modeLabel = mode === 'byte' ? 'byte data' : `${mode} data`
  return `${chars} as ${modeLabel}, at ${level} recovery — ${room.toLocaleString()} characters of room.`
}

/**
 * The sizes on offer, in pixels.
 *
 * The quiet zone matters as much as the size: four modules of margin is what
 * the specification asks for, and it is built into the renderer's options.
 */
export const SIZES = [
  { value: '128', label: '128 px — small' },
  { value: '256', label: '256 px — normal' },
  { value: '512', label: '512 px — print' },
  { value: '1024', label: '1024 px — poster' },
] as const

/** The output formats the tool can write. */
export const OUTPUTS = [
  { value: 'png', label: 'PNG image' },
  { value: 'svg', label: 'SVG vector' },
] as const

export type QrOutput = (typeof OUTPUTS)[number]['value']

/** The name for the downloaded file. */
export function qrName(output: QrOutput): string {
  return `qr-code.${output}`
}

/** Whether the text looks like a link rather than plain words. */
export function looksLikeLink(text: string): boolean {
  return /^(https?:\/\/|www\.)\S+$/i.test(text.trim())
}

/* ------------------------------------------------------------------ */
/* Wi-Fi payloads                                                      */
/* ------------------------------------------------------------------ */

/** The security types a phone expects in a Wi-Fi payload. */
export const WIFI_SECURITY = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3 — the usual one' },
  { value: 'WEP', label: 'WEP — old routers only' },
  { value: 'nopass', label: 'No password — an open network' },
] as const

export type WifiSecurity = (typeof WIFI_SECURITY)[number]['value']

/**
 * The `WIFI:` payload a phone camera recognises.
 *
 * Semicolons separate the fields, and a backslash escapes the ones that can
 * appear inside a network name or password. Without the escaping, a network
 * called "Cafe; Guest" produces a payload the phone misreads.
 */
export function wifiPayload(network: string, password: string, security: WifiSecurity): string {
  const escape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1')
  const fields = [`T:${security}`, `S:${escape(network.trim())}`]
  if (security !== 'nopass') fields.push(`P:${escape(password)}`)
  return `WIFI:${fields.join(';')};;`
}

/* ------------------------------------------------------------------ */
/* Contact card payloads                                               */
/* ------------------------------------------------------------------ */

/** The fields the contact card carries. */
export type ContactFields = {
  name: string
  phone: string
  organisation: string
  email: string
}

/** Whether the contact card has enough in it to be worth encoding. */
export function contactError(contact: ContactFields): string | null {
  if (contact.name.trim() === '' && contact.phone.trim() === '') {
    return 'A contact card needs at least a name or a phone number.'
  }
  return null
}

/**
 * A vCard 3.0 payload.
 *
 * vCard is the format contacts import from, and every phone camera that can
 * read a QR code at all can read one of these.
 */
export function vcardPayload(contact: ContactFields): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  if (contact.name.trim() !== '') lines.push(`FN:${contact.name.trim()}`)
  if (contact.organisation.trim() !== '') lines.push(`ORG:${contact.organisation.trim()}`)
  if (contact.phone.trim() !== '') lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`)
  if (contact.email.trim() !== '') lines.push(`EMAIL;TYPE=INTERNET:${contact.email.trim()}`)
  // Newlines inside a QR code are encoded as part of the byte string, which
  // every reader handles for vCard specifically.
  lines.push('END:VCARD')
  return lines.join('\n')
}
