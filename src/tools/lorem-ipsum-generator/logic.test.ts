import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOREM_OPTIONS,
  LOREM_OPENING,
  LOREM_WORDS,
  clampCount,
  generateLorem,
  loremStats,
  type LoremOptions,
} from './logic'

/** A deterministic pseudo-random source, so generation is reproducible. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

/** A random source that always returns the same value. */
const fixed = (value: number) => () => value

describe('clampCount', () => {
  it('keeps a value inside the range', () => {
    expect(clampCount(5, 'paragraphs')).toBe(5)
  })

  it('clamps to the minimum of 1', () => {
    expect(clampCount(0, 'paragraphs')).toBe(1)
    expect(clampCount(-10, 'paragraphs')).toBe(1)
  })

  it('clamps to the per-unit maximum', () => {
    expect(clampCount(9999, 'words')).toBe(1000)
    expect(clampCount(9999, 'sentences')).toBe(200)
    expect(clampCount(9999, 'paragraphs')).toBe(50)
  })

  it('falls back to 1 for a non-finite count', () => {
    expect(clampCount(Number.NaN, 'words')).toBe(1)
  })

  it('rounds to a whole number', () => {
    expect(clampCount(3.7, 'paragraphs')).toBe(4)
  })
})

describe('generateLorem — words', () => {
  it('produces the requested number of words', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'words', count: 10, startWithLorem: false },
      seeded(1),
    )
    expect(text.split(/\s+/)).toHaveLength(10)
  })

  it('uses only vocabulary words', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'words', count: 40, startWithLorem: false },
      seeded(2),
    )
    for (const word of text.toLowerCase().split(/\s+/)) {
      expect(LOREM_WORDS).toContain(word)
    }
  })

  it('starts with the canonical opening when asked', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'words', count: 12, startWithLorem: true },
      seeded(3),
    )
    expect(text.toLowerCase().startsWith('lorem ipsum dolor sit amet')).toBe(true)
  })

  it('capitalises the first letter', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'words', count: 5, startWithLorem: false },
      seeded(4),
    )
    expect(text.charAt(0)).toBe(text.charAt(0).toUpperCase())
  })
})

describe('generateLorem — sentences', () => {
  it('produces the requested number of sentences', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'sentences', count: 4, startWithLorem: false },
      seeded(5),
    )
    expect((text.match(/\./g) ?? [])).toHaveLength(4)
  })

  it('starts with the canonical opening when asked', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'sentences', count: 3, startWithLorem: true },
      seeded(6),
    )
    expect(text.startsWith(LOREM_OPENING)).toBe(true)
  })

  it('respects a short sentence length', () => {
    const text = generateLorem(
      {
        ...DEFAULT_LOREM_OPTIONS,
        unit: 'sentences',
        count: 1,
        startWithLorem: false,
        length: 'short',
      },
      fixed(0.5),
    )
    // With a constant random source every sentence has the same word count.
    const words = text.replace(/\.$/, '').split(/\s+/)
    expect(words.length).toBeGreaterThanOrEqual(4)
    expect(words.length).toBeLessThanOrEqual(8)
  })
})

describe('generateLorem — paragraphs', () => {
  it('produces the requested number of paragraphs', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'paragraphs', count: 3, startWithLorem: false },
      seeded(7),
    )
    expect(text.split('\n\n')).toHaveLength(3)
  })

  it('starts the first paragraph with the canonical opening', () => {
    const text = generateLorem(
      { ...DEFAULT_LOREM_OPTIONS, unit: 'paragraphs', count: 2, startWithLorem: true },
      seeded(8),
    )
    expect(text.startsWith(LOREM_OPENING)).toBe(true)
  })

  it('wraps paragraphs in <p> tags when asked', () => {
    const text = generateLorem(
      {
        ...DEFAULT_LOREM_OPTIONS,
        unit: 'paragraphs',
        count: 2,
        htmlParagraphs: true,
        startWithLorem: false,
      },
      seeded(9),
    )
    expect(text.startsWith('<p>')).toBe(true)
    expect(text).toContain('</p>\n\n<p>')
  })
})

describe('generateLorem — determinism', () => {
  it('produces identical output for the same seed', () => {
    const options: LoremOptions = { ...DEFAULT_LOREM_OPTIONS, count: 2 }
    expect(generateLorem(options, seeded(42))).toBe(generateLorem(options, seeded(42)))
  })

  it('produces different output for different seeds', () => {
    const options: LoremOptions = { ...DEFAULT_LOREM_OPTIONS, count: 2 }
    expect(generateLorem(options, seeded(1))).not.toBe(generateLorem(options, seeded(2)))
  })
})

describe('loremStats', () => {
  it('counts paragraphs, sentences and words', () => {
    const stats = loremStats('One two. Three four.\n\nFive six.')
    expect(stats.paragraphs).toBe(2)
    expect(stats.sentences).toBe(3)
    expect(stats.words).toBe(6)
  })

  it('ignores <p> tags when counting', () => {
    const stats = loremStats('<p>One two.</p>')
    expect(stats.words).toBe(2)
    expect(stats.paragraphs).toBe(1)
  })

  it('reports zeros for empty input', () => {
    expect(loremStats('')).toEqual({ paragraphs: 0, sentences: 0, words: 0, characters: 0 })
  })

  it('counts characters including markup', () => {
    expect(loremStats('<p>ab</p>').characters).toBe(9)
  })
})

describe('LOREM_OPENING', () => {
  it('is the canonical phrase', () => {
    expect(LOREM_OPENING).toBe('Lorem ipsum dolor sit amet, consectetur adipiscing elit')
  })
})
