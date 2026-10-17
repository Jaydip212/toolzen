import { describe, expect, it } from 'vitest'
import {
  AMBIGUOUS_CHARACTERS,
  DEFAULT_GENERATOR_OPTIONS,
  DIGIT_CHARACTERS,
  LOWER_CHARACTERS,
  MAX_LENGTH,
  MIN_LENGTH,
  SEPARATORS,
  SYMBOL_CHARACTERS,
  UPPER_CHARACTERS,
  WORDLIST,
  buildAlphabet,
  clampLength,
  clampWordCount,
  generateBatch,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  passwordEntropyBits,
  randomInt,
  selectedSets,
  shuffle,
  strengthVerdict,
  validateOptions,
  type GeneratorOptions,
  type RandomSource,
} from './logic'

/** A small deterministic LCG so the generation tests are reproducible. */
function seeded(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

const ALL: GeneratorOptions = { ...DEFAULT_GENERATOR_OPTIONS }

describe('selectedSets', () => {
  it('lists the sets that are switched on', () => {
    expect(selectedSets(ALL)).toEqual([
      LOWER_CHARACTERS,
      UPPER_CHARACTERS,
      DIGIT_CHARACTERS,
      SYMBOL_CHARACTERS,
    ])
  })

  it('is empty when nothing is selected', () => {
    expect(
      selectedSets({ ...ALL, lower: false, upper: false, digits: false, symbols: false }),
    ).toEqual([])
  })
})

describe('buildAlphabet', () => {
  it('joins the selected sets', () => {
    const alphabet = buildAlphabet({ ...ALL, upper: false, digits: false, symbols: false })
    expect(alphabet).toBe(LOWER_CHARACTERS)
  })

  it('removes ambiguous characters when asked', () => {
    const alphabet = buildAlphabet({ ...ALL, excludeAmbiguous: true })
    for (const character of AMBIGUOUS_CHARACTERS) {
      expect(alphabet).not.toContain(character)
    }
    // 'a' and 'z' are unambiguous and must survive.
    expect(alphabet).toContain('a')
    expect(alphabet).toContain('z')
  })

  it('is empty when nothing is selected', () => {
    expect(
      buildAlphabet({ ...ALL, lower: false, upper: false, digits: false, symbols: false }),
    ).toBe('')
  })
})

describe('validateOptions', () => {
  it('accepts the defaults', () => {
    expect(validateOptions(ALL)).toBeNull()
  })

  it('rejects an empty selection', () => {
    expect(
      validateOptions({ ...ALL, lower: false, upper: false, digits: false, symbols: false }),
    ).toMatch(/at least one character type/i)
  })

  it('enforces the length range', () => {
    expect(validateOptions({ ...ALL, length: 2 })).toMatch(/at least/i)
    expect(validateOptions({ ...ALL, length: 999 })).toMatch(/or fewer/i)
  })
})

describe('clampLength', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampLength(0)).toBe(MIN_LENGTH)
    expect(clampLength(1000)).toBe(MAX_LENGTH)
    expect(clampLength(24)).toBe(24)
  })

  it('falls back to the default for a non-finite value', () => {
    expect(clampLength(Number.NaN)).toBe(DEFAULT_GENERATOR_OPTIONS.length)
  })
})

describe('clampWordCount', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampWordCount(0)).toBe(2)
    expect(clampWordCount(99)).toBe(12)
    expect(clampWordCount(5)).toBe(5)
  })
})

describe('randomInt', () => {
  it('stays within the requested range', () => {
    const random = seeded(42)
    for (let index = 0; index < 200; index += 1) {
      const value = randomInt(10, random)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(10)
    }
  })

  it('produces every value for a small range', () => {
    const random = seeded(7)
    const seen = new Set<number>()
    for (let index = 0; index < 500; index += 1) seen.add(randomInt(6, random))
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('throws for a non-positive range', () => {
    expect(() => randomInt(0, seeded(1))).toThrow()
  })
})

describe('shuffle', () => {
  it('keeps exactly the same elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const output = shuffle([...input], seeded(3))
    expect([...output].sort()).toEqual([...input].sort())
  })

  it('actually reorders a large list', () => {
    const input = Array.from({ length: 50 }, (_, index) => index)
    const output = shuffle([...input], seeded(9))
    expect(output).not.toEqual(input)
  })
})

describe('generatePassword', () => {
  it('produces a password of the requested length', () => {
    expect(generatePassword({ ...ALL, length: 32 }, seeded(1))).toHaveLength(32)
  })

  it('only uses characters from the alphabet', () => {
    const options = { ...ALL, symbols: false, excludeAmbiguous: false }
    const alphabet = buildAlphabet(options)
    const password = generatePassword(options, seeded(5))
    for (const character of password) expect(alphabet).toContain(character)
  })

  it('includes at least one character from every selected set', () => {
    const password = generatePassword({ ...ALL, length: 8, requireEachSet: true }, seeded(11))
    expect(/[a-z]/.test(password)).toBe(true)
    expect(/[A-Z]/.test(password)).toBe(true)
    expect(/[0-9]/.test(password)).toBe(true)
    expect(SYMBOL_CHARACTERS.split('').some((symbol) => password.includes(symbol))).toBe(true)
  })

  it('never emits ambiguous characters when they are excluded', () => {
    const options = { ...ALL, excludeAmbiguous: true, length: 64 }
    const password = generatePassword(options, seeded(13))
    for (const character of AMBIGUOUS_CHARACTERS) expect(password).not.toContain(character)
  })

  it('returns an empty string when no sets are selected', () => {
    expect(
      generatePassword(
        { ...ALL, lower: false, upper: false, digits: false, symbols: false },
        seeded(1),
      ),
    ).toBe('')
  })

  it('is deterministic for a fixed random source', () => {
    expect(generatePassword(ALL, seeded(99))).toBe(generatePassword(ALL, seeded(99)))
  })

  it('differs between random sources', () => {
    expect(generatePassword(ALL, seeded(1))).not.toBe(generatePassword(ALL, seeded(2)))
  })

  it('respects the minimum length clamp', () => {
    expect(generatePassword({ ...ALL, length: 1 }, seeded(4))).toHaveLength(MIN_LENGTH)
  })

  it('skips the per-set guarantee when there is not enough room', () => {
    // Four sets but only four characters is fine; three would not be.
    const password = generatePassword({ ...ALL, length: 4, requireEachSet: true }, seeded(21))
    expect(password).toHaveLength(4)
  })
})

describe('generateBatch', () => {
  it('returns the requested number of passwords', () => {
    expect(generateBatch(5, ALL, seeded(1))).toHaveLength(5)
  })

  it('caps the batch size', () => {
    expect(generateBatch(500, ALL, seeded(1))).toHaveLength(50)
  })

  it('produces distinct passwords', () => {
    const batch = generateBatch(10, ALL, seeded(31))
    expect(new Set(batch).size).toBeGreaterThan(1)
  })
})

describe('WORDLIST', () => {
  it('has at least 256 unique words', () => {
    expect(WORDLIST.length).toBeGreaterThanOrEqual(256)
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length)
  })

  it('is all lowercase letters', () => {
    for (const word of WORDLIST) expect(word).toMatch(/^[a-z]+$/)
  })
})

describe('generatePassphrase', () => {
  it('produces the requested number of words', () => {
    const phrase = generatePassphrase(5, '-', seeded(1))
    expect(phrase.split('-')).toHaveLength(5)
  })

  it('uses the chosen separator', () => {
    expect(generatePassphrase(4, '.', seeded(2))).toContain('.')
  })

  it('joins with nothing when the separator is empty', () => {
    const phrase = generatePassphrase(3, '', seeded(3))
    expect(phrase).not.toContain('-')
    expect(phrase.length).toBeGreaterThan(0)
  })

  it('capitalises when asked', () => {
    const phrase = generatePassphrase(4, '-', seeded(4), true)
    for (const word of phrase.split('-')) {
      expect(word[0]).toBe(word[0].toUpperCase())
    }
  })

  it('is deterministic for a fixed random source', () => {
    expect(generatePassphrase(6, '-', seeded(5))).toBe(generatePassphrase(6, '-', seeded(5)))
  })

  it('clamps the word count', () => {
    expect(generatePassphrase(1, '-', seeded(6)).split('-')).toHaveLength(2)
    expect(generatePassphrase(99, '-', seeded(6)).split('-')).toHaveLength(12)
  })
})

describe('passwordEntropyBits', () => {
  it('is length times log2 of the pool', () => {
    expect(passwordEntropyBits(10, 2)).toBeCloseTo(10, 5)
  })

  it('is zero for degenerate input', () => {
    expect(passwordEntropyBits(0, 26)).toBe(0)
    expect(passwordEntropyBits(10, 1)).toBe(0)
  })

  it('grows with length', () => {
    expect(passwordEntropyBits(20, 94)).toBeGreaterThan(passwordEntropyBits(10, 94))
  })
})

describe('passphraseEntropyBits', () => {
  it('is about 8 bits per word for the 272-word list', () => {
    expect(passphraseEntropyBits(1, WORDLIST.length, 1)).toBeCloseTo(Math.log2(WORDLIST.length), 5)
  })

  it('adds bits for the separator choices', () => {
    expect(passphraseEntropyBits(4, WORDLIST.length, 6)).toBeGreaterThan(
      passphraseEntropyBits(4, WORDLIST.length, 1),
    )
  })

  it('is zero for zero words', () => {
    expect(passphraseEntropyBits(0)).toBe(0)
  })
})

describe('strengthVerdict', () => {
  it('buckets entropy into labels', () => {
    expect(strengthVerdict(10).label).toBe('Very weak')
    expect(strengthVerdict(35).label).toBe('Weak')
    expect(strengthVerdict(50).label).toBe('Fair')
    expect(strengthVerdict(75).label).toBe('Strong')
    expect(strengthVerdict(120).label).toBe('Very strong')
  })

  it('increases the score with entropy', () => {
    expect(strengthVerdict(10).score).toBeLessThan(strengthVerdict(120).score)
  })
})

describe('SEPARATORS', () => {
  it('includes an empty option', () => {
    expect(SEPARATORS).toContain('')
  })
})
