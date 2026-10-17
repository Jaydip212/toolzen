import { describe, expect, it } from 'vitest'
import {
  EASE_BANDS,
  RATES,
  analyse,
  countCharacters,
  countParagraphs,
  countSentences,
  countSyllables,
  countWords,
  easeBandFor,
  estimatePages,
  formatDuration,
  gradeLevel,
  readingEase,
  readingTime,
  speakingTime,
  wordList,
} from './logic'

const SAMPLE =
  'The quick brown fox jumps over the lazy dog. It was a bright cold day in April, and the clocks were striking thirteen. ' +
  'Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors.'

describe('countWords', () => {
  it('counts plain words', () => {
    expect(countWords('one two three')).toBe(3)
  })

  it('counts a hyphenated or apostrophised word once', () => {
    expect(countWords("well-known state-of-the-art don't")).toBe(3)
  })

  it('handles punctuation and whitespace runs', () => {
    expect(countWords('  hello,   world!  ')).toBe(2)
  })

  it('returns zero for empty or whitespace text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
  })

  it('counts numbers and unicode letters', () => {
    expect(countWords('order 42 arrived café')).toBe(4)
  })
})

describe('countCharacters', () => {
  it('counts with and without spaces', () => {
    expect(countCharacters('a b c', true)).toBe(5)
    expect(countCharacters('a b c', false)).toBe(3)
  })

  it('counts astral characters as one', () => {
    expect(countCharacters('😀')).toBe(1)
  })
})

describe('countSentences', () => {
  it('counts terminal punctuation', () => {
    expect(countSentences('One. Two! Three?')).toBe(3)
  })

  it('counts a fragment with no punctuation as one sentence', () => {
    expect(countSentences('just a fragment')).toBe(1)
  })

  it('returns zero for empty text', () => {
    expect(countSentences('')).toBe(0)
    expect(countSentences('   ')).toBe(0)
  })

  it('handles ellipses', () => {
    expect(countSentences('Wait... really?')).toBe(2)
  })
})

describe('countParagraphs', () => {
  it('splits on blank lines', () => {
    expect(countParagraphs('one\n\ntwo\n\nthree')).toBe(3)
  })

  it('ignores extra blank lines and trailing whitespace', () => {
    expect(countParagraphs('one\n\n\n\ntwo\n\n')).toBe(2)
  })

  it('returns zero for blank input', () => {
    expect(countParagraphs('\n\n')).toBe(0)
  })
})

describe('countSyllables', () => {
  it('counts simple words', () => {
    expect(countSyllables('cat')).toBe(1)
    expect(countSyllables('apple')).toBe(2)
    expect(countSyllables('banana')).toBe(3)
  })

  it('never returns zero for a real word', () => {
    for (const word of ['the', 'a', 'strengths', 'queue']) {
      expect(countSyllables(word)).toBeGreaterThanOrEqual(1)
    }
  })

  it('returns zero for a word with no letters', () => {
    expect(countSyllables('123')).toBe(0)
  })
})

describe('readingTime', () => {
  it('converts words to minutes at a rate', () => {
    expect(readingTime(238, 238)).toEqual({ minutes: 1, seconds: 60 })
  })

  it('scales with the rate', () => {
    const fast = readingTime(1000, 238)
    const slow = readingTime(1000, 120)
    expect(slow.minutes).toBeGreaterThan(fast.minutes)
  })

  it('rejects a zero rate', () => {
    expect(() => readingTime(100, 0)).toThrow(/above zero/)
  })

  it('handles no words', () => {
    expect(readingTime(0, 238)).toEqual({ minutes: 0, seconds: 0 })
  })
})

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(1)).toBe('1 second')
    expect(formatDuration(30)).toBe('30 seconds')
    expect(formatDuration(300)).toBe('5 minutes')
    expect(formatDuration(3600)).toBe('1 hour')
    expect(formatDuration(3660)).toBe('1 hour 1 min')
    expect(formatDuration(0)).toBe('under a second')
  })
})

describe('readability', () => {
  it('scores a simple sentence as easy', () => {
    const score = readingEase('The cat sat on the mat.')
    expect(score).not.toBeNull()
    expect(score as number).toBeGreaterThan(90)
  })

  it('scores dense prose as harder', () => {
    const easy = readingEase('The cat sat on the mat.') as number
    const hard = readingEase(
      'The institutionalisation of bureaucratic procedures necessitates comprehensive administrative oversight.',
    ) as number
    expect(hard).toBeLessThan(easy)
  })

  it('returns null when there is nothing to measure', () => {
    expect(readingEase('')).toBeNull()
    // A single one-syllable word scores very high but is still a number.
    expect(readingEase('word')).toBeCloseTo(121.2, 1)
  })

  it('maps scores to bands without gaps', () => {
    expect(easeBandFor(95).label).toContain('Very easy')
    expect(easeBandFor(75).label).toContain('Fairly easy')
    expect(easeBandFor(10).label).toContain('Very difficult')
    expect(EASE_BANDS).toHaveLength(7)
  })

  it('reports a grade level', () => {
    const grade = gradeLevel(SAMPLE)
    expect(grade).not.toBeNull()
    expect(grade as number).toBeGreaterThan(0)
    expect(grade as number).toBeLessThan(15)
  })

  it('returns null grade for empty text', () => {
    expect(gradeLevel('')).toBeNull()
  })
})

describe('pages and speaking', () => {
  it('estimates pages at a standard length', () => {
    expect(estimatePages(550)).toBe(2)
    expect(estimatePages(275)).toBe(1)
  })

  it('rejects a zero page length', () => {
    expect(() => estimatePages(100, 0)).toThrow(/above zero/)
  })

  it('speaks more slowly than it reads silently', () => {
    expect(speakingTime(1000)).toBeGreaterThan(readingTime(1000, 238).seconds)
  })
})

describe('RATES', () => {
  it('lists rates in descending order of speed', () => {
    const wpm = RATES.map((rate) => rate.wpm)
    expect([...wpm].sort((a, b) => b - a)).toEqual(wpm)
    expect(RATES.every((rate) => rate.note.length > 0)).toBe(true)
  })
})

describe('wordList', () => {
  it('returns the words themselves', () => {
    expect(wordList('one two')).toEqual(['one', 'two'])
  })

  it('returns an empty array for no text', () => {
    expect(wordList('')).toEqual([])
  })
})

describe('analyse', () => {
  it('returns a full set of statistics', () => {
    const stats = analyse(SAMPLE, 238)
    expect(stats.words).toBe(countWords(SAMPLE))
    expect(stats.paragraphs).toBe(1)
    expect(stats.sentences).toBe(3)
    expect(stats.seconds).toBeGreaterThan(0)
    expect(stats.readingEase).not.toBeNull()
    expect(stats.gradeLevel).not.toBeNull()
    expect(stats.syllables).toBeGreaterThan(stats.words)
  })

  it('returns zeroes for empty text without throwing', () => {
    const stats = analyse('', 238)
    expect(stats.words).toBe(0)
    expect(stats.readingEase).toBeNull()
    expect(stats.minutes).toBe(0)
  })

  it('takes only the text and the rate', () => {
    expect(analyse(SAMPLE, 238).words).toBe(countWords(SAMPLE))
  })
})
