import { describe, expect, it } from 'vitest'
import {
  ATTACK_SCENARIOS,
  CHARSET_SIZES,
  COMMON_PASSWORDS,
  analyzeCharset,
  analyzePassword,
  crackTimeSeconds,
  detectPatterns,
  estimateEntropyBits,
  estimateGuesses,
  formatDuration,
  isCommonPassword,
} from './logic'

describe('analyzeCharset', () => {
  it('returns an empty pool for an empty password', () => {
    const info = analyzeCharset('')
    expect(info.poolSize).toBe(0)
    expect(info.labels).toEqual([])
  })

  it('detects a lowercase-only pool', () => {
    const info = analyzeCharset('abcdef')
    expect(info.lower).toBe(true)
    expect(info.upper).toBe(false)
    expect(info.poolSize).toBe(26)
    expect(info.labels).toEqual(['lowercase letters'])
  })

  it('sums the pools of every set present', () => {
    const info = analyzeCharset('aA1!')
    expect(info.lower).toBe(true)
    expect(info.upper).toBe(true)
    expect(info.digits).toBe(true)
    expect(info.symbols).toBe(true)
    expect(info.poolSize).toBe(
      CHARSET_SIZES.lower + CHARSET_SIZES.upper + CHARSET_SIZES.digits + CHARSET_SIZES.symbols,
    )
  })

  it('counts spaces and non-English characters', () => {
    const info = analyzeCharset('a b€')
    expect(info.spaces).toBe(true)
    expect(info.unicode).toBe(true)
    expect(info.labels).toContain('spaces')
    expect(info.labels).toContain('non-English characters')
  })
})

describe('isCommonPassword', () => {
  it('recognises an exact common password', () => {
    expect(isCommonPassword('password')).toBe(true)
    expect(isCommonPassword('123456')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isCommonPassword('PassWord')).toBe(true)
  })

  it('sees through trailing digits and symbols', () => {
    expect(isCommonPassword('password123!')).toBe(true)
    expect(isCommonPassword('admin2024')).toBe(true)
  })

  it('does not flag a genuinely unusual password', () => {
    expect(isCommonPassword('tR7#kLm9$wQz')).toBe(false)
  })

  it('does not treat a short fragment as common', () => {
    // "abc" is not in the list on its own, and the stripped value must be >= 4 chars.
    expect(isCommonPassword('abc')).toBe(false)
  })

  it('exposes a non-trivial blocklist', () => {
    expect(COMMON_PASSWORDS.length).toBeGreaterThan(40)
  })
})

describe('detectPatterns', () => {
  it('flags a digits-only password', () => {
    const ids = detectPatterns('8472916').map((p) => p.id)
    expect(ids).toContain('digits-only')
  })

  it('flags repeated characters', () => {
    const ids = detectPatterns('aaaabbbb').map((p) => p.id)
    expect(ids).toContain('repeat')
  })

  it('flags ascending and descending sequences', () => {
    expect(detectPatterns('xyzabcd9').map((p) => p.id)).toContain('sequence')
    expect(detectPatterns('9876abcd').map((p) => p.id)).toContain('sequence')
  })

  it('flags a keyboard walk', () => {
    expect(detectPatterns('qwertyX9!').map((p) => p.id)).toContain('keyboard')
  })

  it('flags a trailing four-digit year', () => {
    expect(detectPatterns('River!Stone1999').map((p) => p.id)).toContain('trailing-year')
  })

  it('returns nothing for an empty password', () => {
    expect(detectPatterns('')).toEqual([])
  })

  it('finds nothing wrong with a random-looking password', () => {
    expect(detectPatterns('tR7#kLm9$wQz')).toEqual([])
  })
})

describe('estimateEntropyBits', () => {
  it('is zero for an empty password', () => {
    expect(estimateEntropyBits('')).toBe(0)
  })

  it('grows with length', () => {
    expect(estimateEntropyBits('abcdefghij')).toBeGreaterThan(estimateEntropyBits('abcde'))
  })

  it('caps a known-breached password at 8 bits however long it is', () => {
    expect(estimateEntropyBits('password1234567890')).toBeLessThanOrEqual(8)
  })

  it('gives a long random password a high figure', () => {
    expect(estimateEntropyBits('tR7#kLm9$wQz2Xp4')).toBeGreaterThan(80)
  })

  it('never returns a negative number', () => {
    expect(estimateEntropyBits('111111')).toBeGreaterThanOrEqual(0)
  })
})

describe('estimateGuesses', () => {
  it('returns 1 for an empty password', () => {
    expect(estimateGuesses('')).toBe(1)
  })

  it('is half of the search space', () => {
    const bits = estimateEntropyBits('tR7#kLm9$wQz')
    expect(estimateGuesses('tR7#kLm9$wQz')).toBeCloseTo(Math.pow(2, bits - 1), 0)
  })
})

describe('crackTimeSeconds', () => {
  it('divides guesses by the rate', () => {
    expect(crackTimeSeconds(1000, 10)).toBe(100)
  })

  it('is infinite for a non-positive rate', () => {
    expect(crackTimeSeconds(1000, 0)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('formatDuration', () => {
  it('describes sub-second times as instant', () => {
    expect(formatDuration(0.4)).toBe('instantly')
  })

  it('uses singular and plural units', () => {
    expect(formatDuration(1)).toBe('1 second')
    expect(formatDuration(2)).toBe('2 seconds')
    expect(formatDuration(90)).toBe('1.5 minutes')
  })

  it('reports centuries as thousands of years', () => {
    expect(formatDuration(60 * 60 * 24 * 365 * 5000)).toBe('about 5 thousand years')
  })

  it('reports geological timescales in billions of years', () => {
    expect(formatDuration(60 * 60 * 24 * 365 * 1e9)).toBe('about 1 billion years')
    expect(formatDuration(60 * 60 * 24 * 365 * 5e9)).toBe('about 5 billion years')
  })

  it('caps at the age of the universe', () => {
    expect(formatDuration(60 * 60 * 24 * 365 * 1e12)).toBe(
      'longer than the universe has existed',
    )
  })

  it('handles infinity', () => {
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('essentially forever')
  })
})

describe('ATTACK_SCENARIOS', () => {
  it('is ordered from slowest attacker to fastest', () => {
    const rates = ATTACK_SCENARIOS.map((scenario) => scenario.guessesPerSecond)
    const sorted = [...rates].sort((a, b) => a - b)
    expect(rates).toEqual(sorted)
  })
})

describe('analyzePassword', () => {
  it('describes an empty password without crashing', () => {
    const result = analyzePassword('')
    expect(result.band.level).toBe('empty')
    expect(result.advice).toEqual([])
    expect(result.estimates).toHaveLength(ATTACK_SCENARIOS.length)
  })

  it('rates a breached password as very weak', () => {
    expect(analyzePassword('password').band.level).toBe('very-weak')
  })

  it('rates a long random password as very strong', () => {
    const result = analyzePassword('tR7#kLm9$wQz2Xp4Qv8!')
    expect(['strong', 'very-strong']).toContain(result.band.level)
  })

  it('tells you to make a short password longer', () => {
    const advice = analyzePassword('Ab1!').advice.join(' ')
    expect(advice).toMatch(/longer/i)
  })

  it('says a strong password only has reuse and breach left to worry about', () => {
    const advice = analyzePassword('tR7#kLm9$wQz2Xp4Qv8!').advice.join(' ')
    expect(advice).toMatch(/reusing|password manager/i)
  })

  it('gives a longer crack time as the attacker gets slower', () => {
    const result = analyzePassword('correct-horse-battery')
    const online = result.estimates.find((e) => e.scenario.id === 'online')!
    const offline = result.estimates.find((e) => e.scenario.id === 'offline-fast')!
    expect(online.seconds).toBeGreaterThan(offline.seconds)
  })
})
