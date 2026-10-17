import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FORMAT_OPTIONS,
  formatText,
  normalizeNewlines,
  sizeReduction,
  textStats,
  type TextFormatOptions,
} from './logic'

/** Options with every rule switched off, for isolating one rule at a time. */
const OFF: TextFormatOptions = {
  trimLines: false,
  collapseSpaces: false,
  removeBlankLines: false,
  collapseBlankLines: false,
  tabsToSpaces: false,
  tabSize: 4,
  trimDocument: false,
}

describe('normalizeNewlines', () => {
  it('converts CRLF and lone CR to LF', () => {
    expect(normalizeNewlines('a\r\nb\rc')).toBe('a\nb\nc')
  })
})

describe('formatText — trimLines', () => {
  it('trims each line', () => {
    expect(formatText('  a  \n\tb\t', { ...OFF, trimLines: true })).toBe('a\nb')
  })

  it('leaves interior spacing alone', () => {
    expect(formatText('a  b', { ...OFF, trimLines: true })).toBe('a  b')
  })
})

describe('formatText — collapseSpaces', () => {
  it('collapses runs of spaces to one', () => {
    expect(formatText('a    b', { ...OFF, collapseSpaces: true })).toBe('a b')
  })

  it('keeps single spaces untouched', () => {
    expect(formatText('a b', { ...OFF, collapseSpaces: true })).toBe('a b')
  })
})

describe('formatText — blank lines', () => {
  it('removes every blank line', () => {
    expect(formatText('a\n\n\nb', { ...OFF, removeBlankLines: true })).toBe('a\nb')
  })

  it('treats whitespace-only lines as blank', () => {
    expect(formatText('a\n   \nb', { ...OFF, removeBlankLines: true })).toBe('a\nb')
  })

  it('collapses runs of blank lines to one', () => {
    expect(formatText('a\n\n\n\nb', { ...OFF, collapseBlankLines: true })).toBe('a\n\nb')
  })

  it('leaves a single blank line intact when collapsing', () => {
    expect(formatText('a\n\nb', { ...OFF, collapseBlankLines: true })).toBe('a\n\nb')
  })

  it('lets removeBlankLines win over collapseBlankLines', () => {
    expect(
      formatText('a\n\n\nb', { ...OFF, removeBlankLines: true, collapseBlankLines: true }),
    ).toBe('a\nb')
  })
})

describe('formatText — tabs', () => {
  it('converts tabs using the configured width', () => {
    expect(formatText('a\tb', { ...OFF, tabsToSpaces: true, tabSize: 2 })).toBe('a  b')
  })

  it('clamps the tab width into 1–16', () => {
    expect(formatText('a\tb', { ...OFF, tabsToSpaces: true, tabSize: 99 })).toBe(
      `a${' '.repeat(16)}b`,
    )
    expect(formatText('a\tb', { ...OFF, tabsToSpaces: true, tabSize: 0 })).toBe('a b')
  })

  it('falls back to 4 for a non-finite width', () => {
    expect(formatText('a\tb', { ...OFF, tabsToSpaces: true, tabSize: Number.NaN })).toBe('a    b')
  })
})

describe('formatText — trimDocument', () => {
  it('trims the whole document', () => {
    expect(formatText('\n\n  a  \n\n', { ...OFF, trimDocument: true })).toBe('a')
  })
})

describe('formatText — defaults', () => {
  it('cleans up a messy sample', () => {
    const messy = '  hello  \r\n\r\n\r\n\r\n  world  \r\n'
    expect(formatText(messy, DEFAULT_FORMAT_OPTIONS)).toBe('hello\n\nworld')
  })

  it('returns an empty string for empty input', () => {
    expect(formatText('', DEFAULT_FORMAT_OPTIONS)).toBe('')
  })

  it('does not reorder or alter content words', () => {
    const result = formatText('  one two  \n  three  ', DEFAULT_FORMAT_OPTIONS)
    expect(result.split('\n')).toEqual(['one two', 'three'])
  })
})

describe('textStats', () => {
  it('counts lines, words and blank lines', () => {
    const stats = textStats('a b\n\nc')
    expect(stats.lines).toBe(3)
    expect(stats.nonBlankLines).toBe(2)
    expect(stats.blankLines).toBe(1)
    expect(stats.words).toBe(3)
  })

  it('reports zero for empty text', () => {
    expect(textStats('')).toEqual({
      lines: 0,
      nonBlankLines: 0,
      blankLines: 0,
      words: 0,
      characters: 0,
      bytes: 0,
    })
  })

  it('counts bytes as UTF-8 length, not character length', () => {
    expect(textStats('é').characters).toBe(1)
    expect(textStats('é').bytes).toBe(2)
  })
})

describe('sizeReduction', () => {
  it('reports a positive reduction when output is smaller', () => {
    expect(sizeReduction('aaaa', 'aa')).toBe(50)
  })

  it('reports a negative value when output is larger', () => {
    expect(sizeReduction('aa', 'aaaa')).toBe(-100)
  })

  it('returns zero for empty input', () => {
    expect(sizeReduction('', 'anything')).toBe(0)
  })
})
