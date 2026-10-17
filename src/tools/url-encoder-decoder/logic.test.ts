import { describe, expect, it } from 'vitest'

import {
  UrlError,
  buildQuery,
  countEscapes,
  decodeComponent,
  decodeUri,
  describeChange,
  encodeComponent,
  encodeUri,
  findMalformedEscape,
  parseQuery,
  queryToObject,
} from './logic'

describe('encodeComponent', () => {
  it('escapes a space as %20', () => {
    expect(encodeComponent('a b')).toBe('a%20b')
  })

  it('escapes reserved characters', () => {
    expect(encodeComponent('a&b=c?d#e')).toBe('a%26b%3Dc%3Fd%23e')
  })

  it('leaves unreserved characters alone', () => {
    expect(encodeComponent("aZ0-_.!~*'()")).toBe("aZ0-_.!~*'()")
  })

  it('encodes UTF-8', () => {
    expect(encodeComponent('é')).toBe('%C3%A9')
  })

  it('encodes an emoji', () => {
    expect(encodeComponent('😀')).toBe('%F0%9F%98%80')
  })

  it('returns an empty string for empty input', () => {
    expect(encodeComponent('')).toBe('')
  })
})

describe('encodeUri', () => {
  it('keeps the URL structure', () => {
    expect(encodeUri('https://example.com/a b?x=1&y=2')).toBe('https://example.com/a%20b?x=1&y=2')
  })

  it('still encodes non-ASCII', () => {
    expect(encodeUri('https://example.com/café')).toContain('caf%C3%A9')
  })
})

describe('decodeComponent', () => {
  it('decodes %20', () => {
    expect(decodeComponent('a%20b')).toBe('a b')
  })

  it('decodes UTF-8', () => {
    expect(decodeComponent('%C3%A9')).toBe('é')
  })

  it('leaves a plus sign alone', () => {
    expect(decodeComponent('a+b')).toBe('a+b')
  })

  it('returns an empty string for empty input', () => {
    expect(decodeComponent('')).toBe('')
  })

  it('round-trips arbitrary text', () => {
    const original = 'a b&c=d?é😀'
    expect(decodeComponent(encodeComponent(original))).toBe(original)
  })

  it('reports a malformed escape with the offending fragment', () => {
    expect(() => decodeComponent('a%ZZb')).toThrow(/%ZZ/)
  })

  it('reports a lone percent', () => {
    expect(() => decodeComponent('100%')).toThrow(UrlError)
  })

  it('reports a truncated escape', () => {
    expect(() => decodeComponent('%A')).toThrow(UrlError)
  })
})

describe('decodeUri', () => {
  it('keeps reserved characters', () => {
    expect(decodeUri('https://example.com/a%20b?x=1')).toBe('https://example.com/a b?x=1')
  })

  it('reports a malformed escape', () => {
    expect(() => decodeUri('%')).toThrow(UrlError)
  })
})

describe('findMalformedEscape', () => {
  it('returns null when every escape is valid', () => {
    expect(findMalformedEscape('a%20b%2F')).toBeNull()
  })

  it('returns null when there is no percent at all', () => {
    expect(findMalformedEscape('plain')).toBeNull()
  })

  it('finds the first bad escape', () => {
    expect(findMalformedEscape('ok%20bad%ZZ')).toBe('%ZZ')
  })

  it('accepts lowercase hex', () => {
    expect(findMalformedEscape('%c3%a9')).toBeNull()
  })

  it('rejects a percent followed by one digit', () => {
    expect(findMalformedEscape('%2')).toBe('%2')
  })
})

describe('parseQuery', () => {
  it('parses a bare query string', () => {
    expect(parseQuery('a=1&b=2')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('parses a full URL', () => {
    expect(parseQuery('https://example.com/?a=1')).toEqual([{ key: 'a', value: '1' }])
  })

  it('ignores the fragment', () => {
    expect(parseQuery('https://example.com/?a=1#top')).toEqual([{ key: 'a', value: '1' }])
  })

  it('decodes percent escapes', () => {
    expect(parseQuery('q=hello%20world')[0].value).toBe('hello world')
  })

  it('turns plus into a space', () => {
    expect(parseQuery('q=a+b')[0].value).toBe('a b')
  })

  it('handles a key with no value', () => {
    expect(parseQuery('flag')).toEqual([{ key: 'flag', value: '' }])
  })

  it('handles an empty value', () => {
    expect(parseQuery('a=')).toEqual([{ key: 'a', value: '' }])
  })

  it('returns an empty list for no query', () => {
    expect(parseQuery('')).toEqual([])
    expect(parseQuery('https://example.com')).toEqual([])
  })

  it('skips empty segments', () => {
    expect(parseQuery('a=1&&b=2')).toHaveLength(2)
  })

  it('keeps an equals sign inside the value', () => {
    expect(parseQuery('a=b=c')[0].value).toBe('b=c')
  })

  it('leaves a malformed value undecoded rather than throwing', () => {
    expect(parseQuery('a=%ZZ')[0].value).toBe('%ZZ')
  })
})

describe('buildQuery', () => {
  it('encodes keys and values', () => {
    expect(buildQuery([{ key: 'a b', value: 'c&d' }])).toBe('a%20b=c%26d')
  })

  it('joins pairs with an ampersand', () => {
    expect(buildQuery([{ key: 'a', value: '1' }, { key: 'b', value: '2' }])).toBe('a=1&b=2')
  })

  it('skips a pair with an empty key', () => {
    expect(buildQuery([{ key: '', value: 'x' }])).toBe('')
  })

  it('keeps a pair with an empty value', () => {
    expect(buildQuery([{ key: 'a', value: '' }])).toBe('a=')
  })

  it('round-trips through parseQuery', () => {
    const pairs = [{ key: 'q', value: 'hello world & more' }]
    expect(parseQuery(buildQuery(pairs))).toEqual(pairs)
  })
})

describe('queryToObject', () => {
  it('builds a plain object', () => {
    expect(queryToObject([{ key: 'a', value: '1' }])).toEqual({ a: '1' })
  })

  it('collects repeated keys into an array', () => {
    expect(
      queryToObject([
        { key: 'tag', value: 'a' },
        { key: 'tag', value: 'b' },
      ]),
    ).toEqual({ tag: ['a', 'b'] })
  })

  it('appends a third occurrence to the array', () => {
    expect(
      queryToObject([
        { key: 't', value: 'a' },
        { key: 't', value: 'b' },
        { key: 't', value: 'c' },
      ]),
    ).toEqual({ t: ['a', 'b', 'c'] })
  })

  it('returns an empty object for no pairs', () => {
    expect(queryToObject([])).toEqual({})
  })
})

describe('describeChange', () => {
  it('reports no change when identical', () => {
    expect(describeChange('abc', 'abc')).toContain('Nothing needed encoding')
  })

  it('reports the length change', () => {
    expect(describeChange('a b', 'a%20b')).toBe('3 → 5 characters (+2).')
  })
})

describe('countEscapes', () => {
  it('counts percent escapes', () => {
    expect(countEscapes('a%20b%2Fc')).toBe(2)
  })

  it('returns zero when there are none', () => {
    expect(countEscapes('plain')).toBe(0)
  })
})
