import { describe, expect, it } from 'vitest'
import { NAMED_ENTITIES, decodeEntities, encodeEntities, entityStats } from './logic'

describe('encodeEntities — minimal', () => {
  it('escapes only the five essential characters', () => {
    expect(encodeEntities('a & b < c > d " e \' f', 'minimal')).toBe(
      'a &amp; b &lt; c &gt; d &quot; e &#39; f',
    )
  })

  it('leaves everything else alone', () => {
    expect(encodeEntities('café © ½', 'minimal')).toBe('café © ½')
  })
})

describe('encodeEntities — named', () => {
  it('uses a named entity where one exists', () => {
    expect(encodeEntities('©', 'named')).toBe('&copy;')
    expect(encodeEntities('…', 'named')).toBe('&hellip;')
    expect(encodeEntities('→', 'named')).toBe('&rarr;')
  })

  it('falls back to a numeric reference for characters with no name', () => {
    expect(encodeEntities('☃', 'named')).toBe('&#9731;')
  })

  it('leaves printable ASCII alone', () => {
    expect(encodeEntities('Hello, world!', 'named')).toBe('Hello, world!')
  })

  it('still escapes the essential characters', () => {
    expect(encodeEntities('<b>', 'named')).toBe('&lt;b&gt;')
  })
})

describe('encodeEntities — numeric', () => {
  it('escapes non-ASCII as numeric references', () => {
    expect(encodeEntities('é', 'numeric')).toBe('&#233;')
  })

  it('leaves ASCII alone', () => {
    expect(encodeEntities('abc', 'numeric')).toBe('abc')
  })
})

describe('encodeEntities — all', () => {
  it('escapes every character', () => {
    expect(encodeEntities('ab', 'all')).toBe('&#97;&#98;')
  })

  it('handles astral characters as one code point', () => {
    // An emoji is a single code point above the basic multilingual plane.
    expect(encodeEntities('😀', 'all')).toBe('&#128512;')
  })
})

describe('encodeEntities — edge cases', () => {
  it('returns an empty string for empty input', () => {
    expect(encodeEntities('', 'named')).toBe('')
  })

  it('escapes ampersands first so entities do not double-encode', () => {
    expect(encodeEntities('&amp;', 'minimal')).toBe('&amp;amp;')
  })
})

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('&amp;&lt;&gt;&quot;&#39;')).toBe('&<>"\'')
  })

  it('decodes named entities outside the essential five', () => {
    expect(decodeEntities('&copy; &hellip; &rarr;')).toBe('© … →')
  })

  it('decodes decimal numeric references', () => {
    expect(decodeEntities('&#169;')).toBe('©')
  })

  it('decodes hexadecimal numeric references', () => {
    expect(decodeEntities('&#xA9;')).toBe('©')
    expect(decodeEntities('&#XA9;')).toBe('©')
  })

  it('leaves unknown entities exactly as written', () => {
    expect(decodeEntities('&notarealentity;')).toBe('&notarealentity;')
  })

  it('leaves a bare ampersand alone', () => {
    expect(decodeEntities('a & b')).toBe('a & b')
  })

  it('leaves an out-of-range code point alone', () => {
    expect(decodeEntities('&#999999999;')).toBe('&#999999999;')
  })

  it('handles several entities in one string', () => {
    expect(decodeEntities('&lt;p&gt;Hi&lt;/p&gt;')).toBe('<p>Hi</p>')
  })

  it('returns an empty string for empty input', () => {
    expect(decodeEntities('')).toBe('')
  })
})

describe('round trip', () => {
  const samples = [
    'TOOLZEN — free tools',
    '<div class="a">&amp;</div>',
    'café, naïve, résumé',
    '½ + ¼ = ¾',
    '€25 — 30% off',
    '日本語',
  ]

  it('survives encode(named) → decode', () => {
    for (const sample of samples) {
      expect(decodeEntities(encodeEntities(sample, 'named'))).toBe(sample)
    }
  })

  it('survives encode(numeric) → decode', () => {
    for (const sample of samples) {
      expect(decodeEntities(encodeEntities(sample, 'numeric'))).toBe(sample)
    }
  })

  it('survives encode(all) → decode', () => {
    for (const sample of samples) {
      expect(decodeEntities(encodeEntities(sample, 'all'))).toBe(sample)
    }
  })
})

describe('entityStats', () => {
  it('counts entities', () => {
    const stats = entityStats('&amp;&lt;&amp;')
    expect(stats.entities).toBe(3)
    expect(stats.distinctEntities).toBe(2)
  })

  it('counts non-ASCII characters', () => {
    expect(entityStats('café').nonAscii).toBe(1)
  })

  it('counts characters', () => {
    expect(entityStats('abc').characters).toBe(3)
  })

  it('reports zeros for empty input', () => {
    expect(entityStats('')).toEqual({
      characters: 0,
      entities: 0,
      distinctEntities: 0,
      nonAscii: 0,
    })
  })
})

describe('NAMED_ENTITIES table', () => {
  it('maps the essential characters', () => {
    expect(NAMED_ENTITIES.amp).toBe('&')
    expect(NAMED_ENTITIES.lt).toBe('<')
    expect(NAMED_ENTITIES.gt).toBe('>')
    expect(NAMED_ENTITIES.quot).toBe('"')
    expect(NAMED_ENTITIES.apos).toBe("'")
  })

  it('maps a non-breaking space', () => {
    expect(NAMED_ENTITIES.nbsp).toBe('\u00a0')
  })
})
