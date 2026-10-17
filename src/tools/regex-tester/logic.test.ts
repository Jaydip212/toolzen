import { describe, expect, it } from 'vitest'
import {
  ALLOWED_FLAGS,
  buildRegex,
  highlightMatches,
  normalizeFlags,
  replaceWithRegex,
  testRegex,
} from './logic'

describe('normalizeFlags', () => {
  it('keeps the canonical order', () => {
    expect(normalizeFlags('yusmig')).toBe('gimsuy')
  })

  it('removes duplicates', () => {
    expect(normalizeFlags('ggii')).toBe('gi')
  })

  it('removes unknown flags', () => {
    expect(normalizeFlags('gXZ')).toBe('g')
  })

  it('returns an empty string when nothing is valid', () => {
    // x and z are not real flags; y is the sticky flag, so it survives.
    expect(normalizeFlags('xz')).toBe('')
    expect(normalizeFlags('xyz')).toBe('y')
  })

  it('exposes the allowed set', () => {
    expect(ALLOWED_FLAGS).toBe('gimsuy')
  })
})

describe('buildRegex', () => {
  it('builds a valid regex', () => {
    const built = buildRegex('a+', 'g')
    expect('error' in built).toBe(false)
  })

  it('returns the engine error message for an invalid pattern', () => {
    const built = buildRegex('(', 'g')
    expect('error' in built).toBe(true)
    if ('error' in built) expect(built.error.length).toBeGreaterThan(0)
  })
})

describe('testRegex', () => {
  it('finds a single match', () => {
    const result = testRegex('b', '', 'abc')
    expect(result.error).toBeNull()
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].value).toBe('b')
    expect(result.matches[0].index).toBe(1)
  })

  it('finds every match with the g flag', () => {
    const result = testRegex('a', 'g', 'banana')
    expect(result.matches.map((match) => match.index)).toEqual([1, 3, 5])
  })

  it('finds only the first match without the g flag', () => {
    expect(testRegex('a', '', 'banana').matches).toHaveLength(1)
  })

  it('respects the i flag', () => {
    expect(testRegex('A', 'gi', 'aAa').matches).toHaveLength(3)
    expect(testRegex('A', 'g', 'aAa').matches).toHaveLength(1)
  })

  it('respects the m flag for anchors', () => {
    expect(testRegex('^b', 'gm', 'a\nb\nc').matches).toHaveLength(1)
  })

  it('respects the s flag for dotall', () => {
    expect(testRegex('a.b', 's', 'a\nb').matches).toHaveLength(1)
    expect(testRegex('a.b', '', 'a\nb').matches).toHaveLength(0)
  })

  it('captures numbered groups', () => {
    const result = testRegex('(\\w+)@(\\w+)', '', 'mail me at bob@example')
    expect(result.matches[0].groups).toEqual(['bob', 'example'])
  })

  it('reports an unmatched optional group as undefined', () => {
    const result = testRegex('(a)(b)?', '', 'a')
    expect(result.matches[0].groups).toEqual(['a', undefined])
  })

  it('captures named groups', () => {
    const result = testRegex('(?<user>\\w+)@(?<host>\\w+)', '', 'bob@example')
    expect(result.matches[0].namedGroups).toEqual({ user: 'bob', host: 'example' })
  })

  it('returns an error for an invalid pattern', () => {
    const result = testRegex('(', '', 'abc')
    expect(result.error).not.toBeNull()
    expect(result.matches).toEqual([])
  })

  it('returns nothing for an empty pattern', () => {
    const result = testRegex('', 'g', 'abc')
    expect(result.matches).toEqual([])
    expect(result.error).toBeNull()
  })

  it('does not hang on a zero-length match', () => {
    const result = testRegex('a*', 'g', 'bbb')
    expect(result.error).toBeNull()
    // Every position matches the empty string, but the loop must terminate.
    expect(result.matches.length).toBeLessThanOrEqual(5)
  })

  it('reports the time taken', () => {
    expect(testRegex('a', 'g', 'aaa').durationMs).toBeGreaterThanOrEqual(0)
  })

  it('caps the number of matches', () => {
    const result = testRegex('a', 'g', 'a'.repeat(100), 10)
    expect(result.matches).toHaveLength(10)
    expect(result.truncated).toBe(true)
  })

  it('does not report truncation when under the cap', () => {
    expect(testRegex('a', 'g', 'aaa', 10).truncated).toBe(false)
  })

  it('does not leak lastIndex between calls', () => {
    const first = testRegex('a', 'g', 'aaa')
    const second = testRegex('a', 'g', 'aaa')
    expect(second.matches).toHaveLength(first.matches.length)
  })
})

describe('highlightMatches', () => {
  it('splits text into plain and matched segments', () => {
    const matches = testRegex('b', 'g', 'abc').matches
    expect(highlightMatches('abc', matches)).toEqual([
      { text: 'a', matchIndex: null },
      { text: 'b', matchIndex: 0 },
      { text: 'c', matchIndex: null },
    ])
  })

  it('returns one plain segment when there are no matches', () => {
    expect(highlightMatches('abc', [])).toEqual([{ text: 'abc', matchIndex: null }])
  })

  it('returns nothing for empty input', () => {
    expect(highlightMatches('', [])).toEqual([])
  })

  it('handles a match at the very start', () => {
    const matches = testRegex('a', 'g', 'ab').matches
    expect(highlightMatches('ab', matches)[0]).toEqual({ text: 'a', matchIndex: 0 })
  })

  it('handles a match at the very end', () => {
    const matches = testRegex('b', 'g', 'ab').matches
    expect(highlightMatches('ab', matches).at(-1)).toEqual({ text: 'b', matchIndex: 0 })
  })

  it('skips overlapping matches', () => {
    const segments = highlightMatches('aaa', [
      { index: 0, value: 'aa', groups: [] },
      { index: 1, value: 'aa', groups: [] },
    ])
    // The second match overlaps the first, so it is not highlighted.
    expect(segments.filter((segment) => segment.matchIndex !== null)).toHaveLength(1)
  })
})

describe('replaceWithRegex', () => {
  it('replaces all matches with the g flag', () => {
    expect(replaceWithRegex('a', 'g', 'banana', 'o').output).toBe('bonono')
  })

  it('replaces only the first match without the g flag', () => {
    expect(replaceWithRegex('a', '', 'banana', 'o').output).toBe('bonana')
  })

  it('supports capture group references', () => {
    const result = replaceWithRegex('(\\w+)@(\\w+)', 'g', 'bob@example', '$2:$1')
    expect(result.output).toBe('example:bob')
  })

  it('supports named group references', () => {
    const result = replaceWithRegex('(?<u>\\w+)@', 'g', 'bob@example', '$<u>-')
    expect(result.output).toBe('bob-example')
  })

  it('reports the replacement count', () => {
    expect(replaceWithRegex('a', 'g', 'banana', 'o').count).toBe(3)
    expect(replaceWithRegex('a', '', 'banana', 'o').count).toBe(1)
  })

  it('returns the input unchanged and an error for an invalid pattern', () => {
    const result = replaceWithRegex('(', 'g', 'abc', 'x')
    expect(result.output).toBe('abc')
    expect(result.error).not.toBeNull()
  })

  it('supports $& for the whole match', () => {
    expect(replaceWithRegex('\\d+', 'g', 'a1b22', '[$&]').output).toBe('a[1]b[22]')
  })
})
