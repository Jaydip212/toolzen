import { describe, expect, it } from 'vitest'
import {
  analyzeCharacters,
  countCharacters,
  countCharactersNoSpaces,
  countDigits,
  countLetters,
  countLines,
  countPunctuation,
  countWhitespace,
} from './logic'

describe('countCharacters', () => {
  it('counts code points rather than UTF-16 units', () => {
    expect(countCharacters('a😀b')).toBe(3)
  })

  it('returns zero for empty input', () => {
    expect(countCharacters('')).toBe(0)
  })

  it('excludes whitespace in the no-spaces variant', () => {
    expect(countCharactersNoSpaces('a b\tc\nd')).toBe(4)
  })
})

describe('countLetters', () => {
  it('counts Latin letters', () => {
    expect(countLetters('abc')).toBe(3)
  })

  it('counts accented and non-Latin letters', () => {
    expect(countLetters('ÄÖ ü 日本語')).toBe(6)
  })

  it('ignores digits and punctuation', () => {
    expect(countLetters('a1!b')).toBe(2)
  })
})

describe('countDigits', () => {
  it('counts decimal digits only', () => {
    expect(countDigits('a1b2c3')).toBe(3)
    expect(countDigits('no digits here')).toBe(0)
  })
})

describe('countPunctuation', () => {
  it('counts punctuation marks', () => {
    expect(countPunctuation('Hi, there!')).toBe(2)
  })
})

describe('countWhitespace', () => {
  it('counts spaces, tabs and line breaks', () => {
    expect(countWhitespace('a b\tc\nd')).toBe(3)
  })
})

describe('countLines', () => {
  it('returns zero for empty input', () => {
    expect(countLines('')).toBe(0)
  })

  it('counts a single line', () => {
    expect(countLines('a')).toBe(1)
  })

  it('counts multiple lines and trailing line breaks', () => {
    expect(countLines('a\nb\nc')).toBe(3)
    expect(countLines('a\n')).toBe(2)
  })

  it('handles Windows line endings', () => {
    expect(countLines('a\r\nb')).toBe(2)
  })
})

describe('analyzeCharacters', () => {
  it('returns all zeros for empty text', () => {
    expect(analyzeCharacters('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      letters: 0,
      digits: 0,
      punctuation: 0,
      whitespace: 0,
      lines: 0,
    })
  })

  it('reports a consistent breakdown', () => {
    const stats = analyzeCharacters('Hi there!')
    expect(stats.characters).toBe(9)
    expect(stats.charactersNoSpaces).toBe(8)
    expect(stats.letters).toBe(7)
    expect(stats.punctuation).toBe(1)
    expect(stats.whitespace).toBe(1)
    expect(stats.lines).toBe(1)
  })
})
