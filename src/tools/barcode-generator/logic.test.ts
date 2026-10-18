import { describe, expect, it } from 'vitest'

import {
  FORMATS,
  barcodeName,
  barcodeSummary,
  checkDigit,
  encodeValue,
  hasValidCheckDigit,
  isNumeric,
  validateInput,
} from './logic'

describe('checkDigit', () => {
  it('computes the EAN-13 check digit from the payload', () => {
    // The worked example from the EAN-13 specification.
    expect(checkDigit('400638133393')).toBe('1')
  })

  it('computes the EAN-8 check digit', () => {
    // 96385074 is a valid EAN-8; its payload is 9638507.
    expect(checkDigit('9638507')).toBe('4')
  })

  it('computes the ITF-14 check digit', () => {
    // 15400141288763 is a valid ITF-14; its payload is 1540014128876.
    expect(checkDigit('1540014128876')).toBe('3')
  })

  it('returns a digit for a payload that lands on a multiple of ten', () => {
    // A payload whose weighted sum is already a multiple of ten checks to 0.
    expect(checkDigit('000000000000')).toBe('0')
  })

  it('refuses a payload that is not digits, rather than inventing a digit', () => {
    expect(checkDigit('12345x')).toBe('')
  })
})

describe('hasValidCheckDigit', () => {
  it('accepts a correctly checked code', () => {
    expect(hasValidCheckDigit('4006381333931')).toBe(true)
    expect(hasValidCheckDigit('96385074')).toBe(true)
  })

  it('rejects one wrong digit, wherever it sits', () => {
    expect(hasValidCheckDigit('4006381333932')).toBe(false)
    expect(hasValidCheckDigit('4006381333941')).toBe(false)
  })

  it('rejects a non-numeric or empty code', () => {
    expect(hasValidCheckDigit('40063813339x')).toBe(false)
    expect(hasValidCheckDigit('')).toBe(false)
    expect(hasValidCheckDigit('7')).toBe(false)
  })
})

describe('validateInput', () => {
  it('accepts a payload one digit short and lets the digit be computed', () => {
    expect(validateInput('EAN13', '400638133393')).toBeNull()
  })

  it('accepts a full code with a correct check digit', () => {
    expect(validateInput('EAN13', '4006381333931')).toBeNull()
  })

  it('names the right digit when the check digit is wrong', () => {
    const error = validateInput('EAN13', '4006381333932')
    expect(error).toContain('check digit is wrong')
    expect(error).toContain('ends in 1')
  })

  it('rejects the wrong length, naming what was given', () => {
    expect(validateInput('EAN13', '12345')).toContain('that is 5')
  })

  it('rejects letters in a numeric format, saying which', () => {
    expect(validateInput('EAN13', '40063813339x')).toContain('digits only')
  })

  it('accepts any text for CODE 128', () => {
    expect(validateInput('CODE128', 'literally anything')).toBeNull()
  })

  it('holds CODE 39 to its alphabet', () => {
    expect(validateInput('CODE39', 'HELLO-1.2')).toBeNull()
    expect(validateInput('CODE39', 'hello')).toContain('Lowercase is not allowed')
  })

  it('asks for input when there is none', () => {
    expect(validateInput('CODE128', '   ')).toContain('Enter the data')
  })
})

describe('encodeValue', () => {
  it('adds the check digit to a short payload', () => {
    expect(encodeValue('EAN13', '400638133393')).toBe('4006381333931')
    expect(encodeValue('EAN8', '9638507')).toBe('96385074')
    expect(encodeValue('ITF14', '1540014128876')).toBe('15400141288763')
  })

  it('leaves a full, correct code alone', () => {
    expect(encodeValue('EAN13', '4006381333931')).toBe('4006381333931')
  })

  it('passes CODE 128 text through untouched', () => {
    expect(encodeValue('CODE128', 'Hello, World')).toBe('Hello, World')
  })

  it('returns null for anything invalid, so nothing is encoded wrong', () => {
    expect(encodeValue('EAN13', '123')).toBeNull()
    expect(encodeValue('EAN13', '4006381333932')).toBeNull()
    expect(encodeValue('CODE39', 'lowercase')).toBeNull()
  })
})

describe('barcodeSummary', () => {
  it('says when a check digit was added', () => {
    expect(barcodeSummary('EAN13', '400638133393')).toBe('EAN13, 13 characters (check digit added).')
  })

  it('does not claim an addition when there was none', () => {
    expect(barcodeSummary('CODE128', 'ABC')).toBe('CODE128, 3 characters.')
  })

  it('falls back to the format’s rules for invalid input', () => {
    expect(barcodeSummary('EAN13', 'x')).toBe('EAN13 — 12 digits, or 13 with the check digit.')
  })
})

describe('isNumeric', () => {
  it('is true for the product formats and false for the free-text ones', () => {
    expect(isNumeric('EAN13')).toBe(true)
    expect(isNumeric('ITF14')).toBe(true)
    expect(isNumeric('CODE128')).toBe(false)
    expect(isNumeric('CODE39')).toBe(false)
  })
})

describe('barcodeName', () => {
  it('names the file after the format', () => {
    expect(barcodeName('EAN13')).toBe('barcode-ean13.png')
    expect(barcodeName('CODE128')).toBe('barcode-code128.png')
  })
})

describe('FORMATS', () => {
  it('offers five formats, each distinct', () => {
    expect(new Set(FORMATS.map((entry) => entry.value)).size).toBe(5)
  })
})
