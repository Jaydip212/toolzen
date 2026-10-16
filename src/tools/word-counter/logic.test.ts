import { describe, expect, it } from 'vitest'
import {
  analyzeText,
  countCharacters,
  countCharactersNoSpaces,
  countParagraphs,
  countSentences,
  countWords,
  formatDuration,
} from './logic'

describe('countWords', () => {
  it('returns zero for empty or whitespace-only input', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t  ')).toBe(0)
  })

  it('counts whitespace-separated words across lines', () => {
    expect(countWords('one two three')).toBe(3)
    expect(countWords('one\n\ntwo\tthree')).toBe(3)
  })

  it('ignores leading and trailing whitespace', () => {
    expect(countWords('   hello world   ')).toBe(2)
  })
})

describe('countSentences', () => {
  it('returns zero for empty input', () => {
    expect(countSentences('')).toBe(0)
  })

  it('counts each terminal punctuation mark', () => {
    expect(countSentences('One. Two! Three?')).toBe(3)
  })

  it('treats text without terminal punctuation as one sentence', () => {
    expect(countSentences('Just one phrase')).toBe(1)
  })
})

describe('countParagraphs', () => {
  it('counts non-empty blocks separated by line breaks', () => {
    expect(countParagraphs('a\n\nb\n\nc')).toBe(3)
    expect(countParagraphs('a\nb')).toBe(2)
  })

  it('collapses runs of blank lines', () => {
    expect(countParagraphs('a\n\n\n\nb')).toBe(2)
  })

  it('returns zero for whitespace-only input', () => {
    expect(countParagraphs('   ')).toBe(0)
  })
})

describe('countCharacters', () => {
  it('counts code points so an emoji counts as one character', () => {
    expect(countCharacters('a😀b')).toBe(3)
  })

  it('ignores whitespace in the no-spaces variant', () => {
    expect(countCharactersNoSpaces('a b c')).toBe(3)
    expect(countCharactersNoSpaces('a\tb\nc')).toBe(3)
  })
})

describe('analyzeText', () => {
  it('returns all zeros for empty text', () => {
    expect(analyzeText('')).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingMinutes: 0,
      speakingMinutes: 0,
    })
  })

  it('derives reading time from the word count', () => {
    const text = Array.from({ length: 400 }, () => 'word').join(' ')
    const stats = analyzeText(text)
    expect(stats.words).toBe(400)
    expect(stats.readingMinutes).toBeCloseTo(2, 5)
  })
})

describe('formatDuration', () => {
  it('formats zero, seconds and whole minutes', () => {
    expect(formatDuration(0)).toBe('0 sec')
    expect(formatDuration(0.5)).toBe('30 sec')
    expect(formatDuration(1)).toBe('1 min')
  })

  it('formats mixed minutes and seconds', () => {
    expect(formatDuration(2.5)).toBe('2 min 30 sec')
  })

  it('treats negative durations as zero', () => {
    expect(formatDuration(-5)).toBe('0 sec')
  })
})
