import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, slugify, slugifyLines, slugStats } from './logic'

describe('slugify', () => {
  it('lowercases and separates with hyphens by default', () => {
    expect(slugify('My First Blog Post!')).toBe('my-first-blog-post')
  })

  it('collapses runs of punctuation and whitespace', () => {
    expect(slugify('Hello,   weird --- punctuation!!!')).toBe('hello-weird-punctuation')
  })

  it('transliterates accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme')
    expect(slugify('Über Straße')).toBe('uber-strasse')
  })

  it('keeps digits', () => {
    expect(slugify('Episode 42: the sequel')).toBe('episode-42-the-sequel')
  })

  it('supports underscore and dot separators', () => {
    expect(slugify('Two Words', { separator: '_' })).toBe('two_words')
    expect(slugify('Two Words', { separator: '.' })).toBe('two.words')
  })

  it('can keep the original case', () => {
    expect(slugify('My Post', { lowercase: false })).toBe('My-Post')
  })

  it('truncates on a word boundary when a max length is set', () => {
    expect(slugify('a very long title indeed', { maxLength: 12 })).toBe('a-very-long')
  })

  it('cuts hard when no separator fits before the cap', () => {
    expect(slugify('extraordinarily', { maxLength: 6 })).toBe('extrao')
  })

  it('returns an empty string for input with no latin letters', () => {
    expect(slugify('日本語のテキスト')).toBe('')
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })

  it('handles mixed CJK and latin by keeping the latin part', () => {
    expect(slugify('Learn JavaScript 入门')).toBe('learn-javascript')
  })
})

describe('slugifyLines', () => {
  it('slugs each line and skips empty results', () => {
    expect(slugifyLines('First Post\n\nSecond: Post!\n日本語')).toEqual(['first-post', 'second-post'])
  })

  it('handles CRLF line endings', () => {
    expect(slugifyLines('one\r\ntwo')).toEqual(['one', 'two'])
  })
})

describe('slugStats', () => {
  it('counts non-empty lines against produced slugs', () => {
    expect(slugStats('One\nTwo\n日本語\n\n')).toEqual({ lines: 3, slugs: 2 })
  })

  it('reports zero lines for blank input', () => {
    expect(slugStats('')).toEqual({ lines: 0, slugs: 0 })
  })
})

describe('DEFAULT_OPTIONS', () => {
  it('uses hyphens, lowercase and no cap', () => {
    expect(DEFAULT_OPTIONS).toEqual({ separator: '-', lowercase: true, maxLength: null })
  })
})
