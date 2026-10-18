/**
 * Barcode decisions.
 *
 * Barcode formats are fussier than people expect: an EAN-13 carries its own
 * check digit, and a code that is one digit short does not scan at all. The
 * tool validates the input against the format's rules and computes a missing
 * check digit, rather than handing a broken code to the encoder.
 */

/** The formats on offer, in the order they appear. */
export const FORMATS = [
  { value: 'CODE128', label: 'CODE 128 — any text' },
  { value: 'EAN13', label: 'EAN-13 — product codes' },
  { value: 'EAN8', label: 'EAN-8 — small products' },
  { value: 'CODE39', label: 'CODE 39 — uppercase and digits' },
  { value: 'ITF14', label: 'ITF-14 — cartons' },
] as const

export type BarcodeFormat = (typeof FORMATS)[number]['value']

/** What the format expects from the user. */
const RULES: Record<BarcodeFormat, { digitsOnly: boolean; lengths: number[]; label: string }> = {
  CODE128: { digitsOnly: false, lengths: [], label: 'any printable characters' },
  EAN13: { digitsOnly: true, lengths: [12, 13], label: '12 digits, or 13 with the check digit' },
  EAN8: { digitsOnly: true, lengths: [7, 8], label: '7 digits, or 8 with the check digit' },
  CODE39: { digitsOnly: false, lengths: [], label: 'uppercase letters, digits and - . $ / + % space' },
  ITF14: { digitsOnly: true, lengths: [13, 14], label: '13 digits, or 14 with the check digit' },
}

/** Whether the format only takes digits. */
export function isNumeric(format: BarcodeFormat): boolean {
  return RULES[format].digitsOnly
}

/** The characters CODE 39 accepts — a small, unforgiving set. */
const CODE39 = /^[0-9A-Z\-.*$/+% ]*$/

/**
 * Check the input against the format's rules.
 *
 * Returns null when the input is acceptable, and a sentence naming the
 * specific problem when it is not.
 */
export function validateInput(format: BarcodeFormat, input: string): string | null {
  const rules = RULES[format]
  const text = input.trim()

  if (text === '') return 'Enter the data to encode.'
  if (rules.digitsOnly && !/^[0-9]*$/.test(text)) {
    return `${format} takes digits only. Spaces, letters and punctuation are not allowed in this format.`
  }
  if (format === 'CODE39' && !CODE39.test(text)) {
    return 'CODE 39 allows uppercase letters, digits, and - . $ / + % and space. Lowercase is not allowed.'
  }
  if (rules.lengths.length > 0 && !rules.lengths.includes(text.length)) {
    const expected = rules.lengths.map((length) => `${length} digits`).join(' or ')
    return `${format} needs ${expected}, and that is ${text.length}.`
  }
  if (format === 'EAN13' && text.length === 13 && !hasValidCheckDigit(text)) {
    return `That check digit is wrong: a 13-digit EAN with those first 12 digits ends in ${checkDigit(text.slice(0, 12))}.`
  }
  if (format === 'EAN8' && text.length === 8 && !hasValidCheckDigit(text)) {
    return `That check digit is wrong: an 8-digit EAN with those first 7 digits ends in ${checkDigit(text.slice(0, 7))}.`
  }
  if (format === 'ITF14' && text.length === 14 && !hasValidCheckDigit(text)) {
    return `That check digit is wrong: an ITF-14 with those first 13 digits ends in ${checkDigit(text.slice(0, 13))}.`
  }
  return null
}

/**
 * The EAN/ITF check digit for a payload without one.
 *
 * Weighted alternating 3 and 1 from the right, then the amount needed to
 * reach the next multiple of ten.
 */
export function checkDigit(payload: string): string {
  if (!/^[0-9]+$/.test(payload)) return ''
  let sum = 0
  for (let index = 0; index < payload.length; index += 1) {
    // The rightmost payload digit carries weight 3.
    const weight = (payload.length - index) % 2 === 0 ? 1 : 3
    sum += Number(payload[index]) * weight
  }
  return String((10 - (sum % 10)) % 10)
}

/** Whether a full code's last digit is the right one for the rest. */
export function hasValidCheckDigit(full: string): boolean {
  if (!/^[0-9]+$/.test(full) || full.length < 2) return false
  return checkDigit(full.slice(0, -1)) === full.slice(-1)
}

/** The value to hand the encoder, with the check digit filled in. */
export function encodeValue(format: BarcodeFormat, input: string): string | null {
  const text = input.trim()
  const error = validateInput(format, text)
  if (error) return null
  if (!isNumeric(format)) return text

  // One digit short means the user gave a payload without its check digit, so
  // the digit is computed rather than asked for.
  if (text.length === 12 && format === 'EAN13') return text + checkDigit(text)
  if (text.length === 7 && format === 'EAN8') return text + checkDigit(text)
  if (text.length === 13 && format === 'ITF14') return text + checkDigit(text)
  return text
}

/** A line describing what the encoder will be given. */
export function barcodeSummary(format: BarcodeFormat, input: string): string {
  const rules = RULES[format]
  const value = encodeValue(format, input)
  const text = input.trim()
  if (!value) return `${format} — ${rules.label}.`

  const filled = value.length !== text.length ? ' (check digit added)' : ''
  return `${format}, ${value.length} characters${filled}.`
}

/** The name for the downloaded file. */
export function barcodeName(format: BarcodeFormat): string {
  return `barcode-${format.toLowerCase()}.png`
}
