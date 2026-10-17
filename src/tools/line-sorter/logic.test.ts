import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT_OPTIONS, numericValue, sortLines, type SortOptions } from './logic'

const base: SortOptions = { ...DEFAULT_SORT_OPTIONS }

describe('numericValue', () => {
  it('parses integers and decimals', () => {
    expect(numericValue('42')).toBe(42)
    expect(numericValue('-3.5')).toBe(-3.5)
    expect(numericValue('+7')).toBe(7)
  })

  it('accepts thousands separators', () => {
    expect(numericValue('1,000')).toBe(1000)
  })

  it('rejects non-numeric text', () => {
    expect(numericValue('abc')).toBeNull()
    expect(numericValue('')).toBeNull()
    expect(numericValue('12abc')).toBeNull()
  })
})

describe('sortLines — alphabetical', () => {
  it('sorts ascending, case-insensitively by default', () => {
    expect(sortLines('banana\nApple\ncherry', base).text).toBe('Apple\nbanana\ncherry')
  })

  it('sorts descending', () => {
    expect(sortLines('banana\nApple\ncherry', { ...base, direction: 'desc' }).text).toBe(
      'cherry\nbanana\nApple',
    )
  })

  it('respects case when asked', () => {
    // With case sensitivity, uppercase letters collate before lowercase.
    const result = sortLines('banana\nApple', { ...base, caseSensitive: true })
    expect(result.text).toBe('Apple\nbanana')
  })
})

describe('sortLines — natural', () => {
  it('orders numbers inside text numerically', () => {
    const result = sortLines('item10\nitem2\nitem1', { ...base, mode: 'natural' })
    expect(result.text).toBe('item1\nitem2\nitem10')
  })

  it('keeps plain alphabetical order for words', () => {
    const result = sortLines('b\na\nc', { ...base, mode: 'natural' })
    expect(result.text).toBe('a\nb\nc')
  })
})

describe('sortLines — numeric', () => {
  it('orders by value, not by text', () => {
    const result = sortLines('100\n7\n42', { ...base, mode: 'numeric' })
    expect(result.text).toBe('7\n42\n100')
  })

  it('pushes non-numeric lines to the bottom when ascending', () => {
    const result = sortLines('10\nlabel\n2', { ...base, mode: 'numeric' })
    expect(result.text).toBe('2\n10\nlabel')
  })

  it('keeps non-numeric lines at the bottom when descending', () => {
    const result = sortLines('10\nlabel\n2', { ...base, mode: 'numeric', direction: 'desc' })
    expect(result.text).toBe('10\n2\nlabel')
  })
})

describe('sortLines — length', () => {
  it('orders shortest first, breaking ties alphabetically', () => {
    const result = sortLines('ccc\nb\naa\nbb', { ...base, mode: 'length' })
    expect(result.text).toBe('b\naa\nbb\nccc')
  })
})

describe('sortLines — cleanup options', () => {
  it('trims lines when asked', () => {
    const result = sortLines('  b  \n  a  ', { ...base, trimLines: true })
    expect(result.text).toBe('a\nb')
  })

  it('removes empty lines and reports the count', () => {
    const result = sortLines('b\n\na\n   ', { ...base, removeEmptyLines: true })
    expect(result.text).toBe('a\nb')
    expect(result.removedEmpty).toBe(2)
  })

  it('removes duplicates and reports the count', () => {
    const result = sortLines('a\nb\na', { ...base, removeDuplicates: true })
    expect(result.text).toBe('a\nb')
    expect(result.removedDuplicates).toBe(1)
  })

  it('treats differently-cased duplicates according to case sensitivity', () => {
    const insensitive = sortLines('a\nA', { ...base, removeDuplicates: true, caseSensitive: false })
    expect(insensitive.removedDuplicates).toBe(1)

    const sensitive = sortLines('a\nA', { ...base, removeDuplicates: true, caseSensitive: true })
    expect(sensitive.removedDuplicates).toBe(0)
  })
})

describe('sortLines — statistics', () => {
  it('reports input and output line counts', () => {
    const result = sortLines('b\na\nb', { ...base, removeDuplicates: true })
    expect(result.totalLines).toBe(3)
    expect(result.outputLines).toBe(2)
  })

  it('returns empty output for empty input', () => {
    expect(sortLines('', base).text).toBe('')
  })
})

describe('DEFAULT_SORT_OPTIONS', () => {
  it('sorts alphabetically, ascending and case-insensitively', () => {
    expect(DEFAULT_SORT_OPTIONS).toEqual({
      mode: 'alphabetical',
      direction: 'asc',
      caseSensitive: false,
      removeDuplicates: false,
      removeEmptyLines: false,
      trimLines: false,
    })
  })
})
