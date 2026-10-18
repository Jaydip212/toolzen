import { describe, expect, it } from 'vitest'

import {
  EC_LEVELS,
  OUTPUTS,
  SIZES,
  capacityFor,
  capabilityNote,
  contactError,
  fillOf,
  isTooLong,
  looksLikeLink,
  modeOf,
  qrName,
  qrSummary,
  vcardPayload,
  wifiPayload,
} from './logic'

describe('modeOf', () => {
  it('reads digits as numeric, which packs densest', () => {
    expect(modeOf('1234567890')).toBe('numeric')
  })

  it('reads QR’s own alphanumeric set as alphanumeric', () => {
    expect(modeOf('HELLO WORLD')).toBe('alphanumeric')
    expect(modeOf('A-B.C/D:E F$G%H*I+J')).toBe('alphanumeric')
  })

  it('falls back to byte data for anything else', () => {
    expect(modeOf('hello world')).toBe('byte')
    expect(modeOf('Привет')).toBe('byte')
    expect(modeOf('café')).toBe('byte')
  })

  it('treats an empty input as byte data rather than numeric', () => {
    expect(modeOf('')).toBe('byte')
  })
})

describe('capacityFor', () => {
  it('is largest for numeric, then alphanumeric, then byte', () => {
    expect(capacityFor('12345', 'M')).toBeGreaterThan(capacityFor('ABC12', 'M'))
    expect(capacityFor('ABC12', 'M')).toBeGreaterThan(capacityFor('abc12', 'M'))
  })

  it('shrinks as the correction level rises, because recovery costs room', () => {
    expect(capacityFor('abc', 'L')).toBeGreaterThan(capacityFor('abc', 'M'))
    expect(capacityFor('abc', 'M')).toBeGreaterThan(capacityFor('abc', 'Q'))
    expect(capacityFor('abc', 'Q')).toBeGreaterThan(capacityFor('abc', 'H'))
  })

  it('uses the largest QR version as the ceiling', () => {
    expect(capacityFor('abc', 'L')).toBe(2953)
  })
})

describe('isTooLong', () => {
  it('allows text that fits', () => {
    expect(isTooLong('a'.repeat(100), 'H')).toBe(false)
  })

  it('rejects text past the ceiling', () => {
    expect(isTooLong('a'.repeat(1274), 'H')).toBe(true)
    expect(isTooLong('a'.repeat(1273), 'H')).toBe(false)
  })

  it('allows more digits than words, because it packs denser', () => {
    const digits = '1'.repeat(3000)
    expect(isTooLong(digits, 'H')).toBe(false)
    expect(isTooLong('a'.repeat(3000), 'H')).toBe(true)
  })
})

describe('fillOf', () => {
  it('is a share of the room, not the length', () => {
    // 295 bytes against the 2,953-character byte-mode ceiling at level L.
    expect(fillOf('a'.repeat(295), 'L')).toBeCloseTo(295 / 2953, 6)
  })
})

describe('capabilityNote', () => {
  it('asks for input when there is none', () => {
    expect(capabilityNote('', 'M')).toContain('Enter the text')
  })

  it('says how far over the limit the text is', () => {
    const note = capabilityNote('a'.repeat(1300), 'H')
    expect(note).toContain('27 characters more')
    expect(note).toContain('1,273')
  })

  it('warns that a dense code is hard to scan', () => {
    expect(capabilityNote('a'.repeat(1000), 'H')).toContain('dense code')
  })

  it('mentions moderate density rather than staying silent', () => {
    expect(capabilityNote('a'.repeat(600), 'H')).toContain('moderately dense')
  })

  it('says nothing for an ordinary code', () => {
    expect(capabilityNote('https://example.com', 'M')).toBeNull()
  })
})

describe('qrSummary', () => {
  it('names the characters, the mode, the level and the room', () => {
    expect(qrSummary('hello', 'M')).toBe('5 characters as byte data, at M recovery — 2,331 characters of room.')
  })

  it('says so for empty input rather than showing a zero', () => {
    expect(qrSummary('', 'M')).toBe('Nothing to encode yet.')
  })

  it('gets the singular right', () => {
    expect(qrSummary('hi', 'L')).toContain('2 characters')
  })
})

describe('looksLikeLink', () => {
  it('recognises a link, which is what most codes hold', () => {
    expect(looksLikeLink('https://example.com/path')).toBe(true)
    expect(looksLikeLink('www.example.com')).toBe(true)
  })

  it('does not call plain words a link', () => {
    expect(looksLikeLink('just some words')).toBe(false)
    expect(looksLikeLink('example.com')).toBe(false)
  })
})

describe('the option lists', () => {
  it('offers four correction levels, L to H', () => {
    expect(EC_LEVELS.map((entry) => entry.value)).toEqual(['L', 'M', 'Q', 'H'])
  })

  it('offers four sizes and two output formats, each distinct', () => {
    expect(new Set(SIZES.map((entry) => entry.value)).size).toBe(4)
    expect(new Set(OUTPUTS.map((entry) => entry.value)).size).toBe(2)
  })
})

describe('qrName', () => {
  it('names the file after its format', () => {
    expect(qrName('png')).toBe('qr-code.png')
    expect(qrName('svg')).toBe('qr-code.svg')
  })
})

describe('wifiPayload', () => {
  it('writes the network and password a phone expects', () => {
    expect(wifiPayload('Jayvik Guest', 'hunter2', 'WPA')).toBe('WIFI:T:WPA;S:Jayvik Guest;P:hunter2;;')
  })

  it('leaves the password out of an open network rather than sending an empty one', () => {
    expect(wifiPayload('Cafe Free', '', 'nopass')).toBe('WIFI:T:nopass;S:Cafe Free;;')
  })

  it('escapes a network name that would otherwise split the payload', () => {
    const payload = wifiPayload('Cafe; Guest', 'pa:ss;word', 'WPA')
    expect(payload).toBe('WIFI:T:WPA;S:Cafe\\; Guest;P:pa\\:ss\\;word;;')
    // The escaping leaves exactly the four readings a phone would otherwise make.
    expect(payload.split(/(?<!\\);/).length).toBe(5)
  })
})

describe('contactError', () => {
  it('asks for something when the card is empty', () => {
    expect(contactError({ name: '', phone: '', organisation: '', email: '' })).toContain('at least a name')
  })

  it('accepts a phone number on its own', () => {
    expect(contactError({ name: '', phone: '+91 98765 43210', organisation: '', email: '' })).toBeNull()
  })
})

describe('vcardPayload', () => {
  it('writes a version and the fields that were given', () => {
    const card = vcardPayload({ name: 'Jaydip', phone: '+91 98765 43210', organisation: 'Jayvik Labs', email: '' })
    expect(card).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nFN:Jaydip\nORG:Jayvik Labs\nTEL;TYPE=CELL:+91 98765 43210\nEND:VCARD',
    )
  })

  it('omits empty fields instead of writing blank labels', () => {
    expect(vcardPayload({ name: 'Ana', phone: '', organisation: '', email: '' })).toBe('BEGIN:VCARD\nVERSION:3.0\nFN:Ana\nEND:VCARD')
  })
})
