import { describe, expect, it, vi } from 'vitest'
import {
  buildMetaTags,
  buildRobotsTxt,
  buildSitemapXml,
  escapeHtml,
  generateTokens,
  randomNumbers,
  randomToken,
  secureRandomInt,
  shuffle,
  shuffleLines,
  TOKEN_CHARSETS,
  type RandomByteSource,
} from './generators'

/** Deterministic byte source for tests — never used by the app. */
function fixedBytes(values: number[]): RandomByteSource {
  let index = 0
  return (count) => {
    const result = new Uint8Array(count)
    for (let i = 0; i < count; i += 1) result[i] = values[index++ % values.length]!
    return result
  }
}

/** Deterministic but non-repeating, for tests that need distinct outputs. */
function lcgSource(): RandomByteSource {
  let state = 123456789
  return (count) => {
    const result = new Uint8Array(count)
    for (let i = 0; i < count; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      result[i] = (state >>> 24) & 255
    }
    return result
  }
}

describe('secureRandomInt', () => {
  it('rejects sampling (no modulo bias)', () => {
    // Two bytes: the first is >= the rejection limit (2^32 - (2^32 % 3)),
    // the second is a valid draw. bound 3 -> limit 4294967295.
    const source = fixedBytes([255, 255, 255, 255, 0, 0, 0, 1])
    expect(secureRandomInt(3, source)).toBe(1 % 3)
  })

  it('throws on invalid bounds', () => {
    expect(() => secureRandomInt(0)).toThrow()
    expect(() => secureRandomInt(-1)).toThrow()
  })
})

describe('randomNumbers', () => {
  const source = fixedBytes([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4])

  it('produces values inside the bounds', () => {
    const result = randomNumbers({ min: 5, max: 9, count: 4, unique: false }, source)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values).toHaveLength(4)
    expect(result.values.every((value) => value >= 5 && value <= 9)).toBe(true)
  })

  it('enforces uniqueness and rejects impossible requests', () => {
    const impossible = randomNumbers({ min: 1, max: 3, count: 4, unique: true }, source)
    expect(impossible).toMatchObject({ ok: false })
    expect(impossible.ok === false && impossible.error).toContain('unique')
  })

  it('rejects bad bounds and counts', () => {
    expect(randomNumbers({ min: 9, max: 5, count: 1, unique: false }, source).ok).toBe(false)
    expect(randomNumbers({ min: 1, max: 5, count: 0, unique: false }, source).ok).toBe(false)
    expect(randomNumbers({ min: 1.5, max: 5, count: 1, unique: false }, source).ok).toBe(false)
  })
})

describe('random tokens', () => {
  const source = fixedBytes(Array.from({ length: 256 }, (_, i) => i % 256))

  it('produces the requested length and only characters from the charset', () => {
    for (const charset of Object.keys(TOKEN_CHARSETS) as (keyof typeof TOKEN_CHARSETS)[]) {
      const token = randomToken(charset, 32, source)
      expect(token).toHaveLength(32)
      const allowed = new Set(TOKEN_CHARSETS[charset].characters)
      for (const char of token) expect(allowed.has(char)).toBe(true)
    }
  })

  it('generates distinct tokens for a batch', () => {
    const result = generateTokens('hex', 16, 3, lcgSource())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tokens).toHaveLength(3)
    expect(new Set(result.tokens).size).toBe(3)
  })

  it('validates length, count and charset', () => {
    expect(generateTokens('hex', 4, 1, source).ok).toBe(false)
    expect(generateTokens('hex', 16, 0, source).ok).toBe(false)
    expect(generateTokens('nope' as never, 16, 1, source).ok).toBe(false)
  })
})

describe('shuffle', () => {
  it('preserves every element, including duplicates', () => {
    const input = ['a', 'b', 'a', 'c', 'b']
    const result = shuffle(input, () => 0)
    expect(result).toHaveLength(input.length)
    expect([...result].sort()).toEqual([...input].sort())
    expect(input).toEqual(['a', 'b', 'a', 'c', 'b'])
  })

  it('uses the supplied RNG for a deterministic permutation', () => {
    const rng = vi.fn(() => 0)
    shuffle([1, 2, 3], rng)
    expect(rng).toHaveBeenCalledTimes(2)
  })

  it('drops blank lines but keeps everything else', () => {
    expect(shuffleLines('a\n\nb\nc', () => 0).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('escapeHtml', () => {
  it('escapes every attribute-dangerous character', () => {
    expect(escapeHtml(`a&b<c>"d'e`)).toBe('a&amp;b&lt;c&gt;&quot;d&#39;e')
  })
})

describe('buildMetaTags', () => {
  it('builds escaped tags from real fields', () => {
    const result = buildMetaTags({
      title: 'A "quoted" title',
      description: 'Short & sweet',
      url: 'https://example.com/p?q=1',
      siteName: 'TOOLZEN',
      type: 'article',
      twitterCard: 'summary_large_image',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tags).toContain('&quot;quoted&quot;')
    expect(result.tags).toContain('Short &amp; sweet')
    expect(result.tags).toContain('property="og:type" content="article"')
    expect(result.tags).toContain('name="twitter:card" content="summary_large_image"')
  })

  it('omits empty optional fields', () => {
    const result = buildMetaTags({ title: 'Hello' })
    expect(result.ok && result.tags).not.toContain('og:image')
  })

  it('requires a title and caps its length', () => {
    expect(buildMetaTags({ title: '   ' }).ok).toBe(false)
    expect(buildMetaTags({ title: 'x'.repeat(201) }).ok).toBe(false)
  })
})

describe('buildRobotsTxt', () => {
  it('builds a valid file with defaults', () => {
    const result = buildRobotsTxt({ userAgent: '*', allow: ['/public/'], disallow: ['/admin/'], crawlDelay: 10, sitemap: 'https://example.com/sitemap.xml' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.text).toContain('User-agent: *')
    expect(result.text).toContain('Allow: /public/')
    expect(result.text).toContain('Disallow: /admin/')
    expect(result.text).toContain('Crawl-delay: 10')
    expect(result.text).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('refuses path injection and bad sitemaps', () => {
    expect(buildRobotsTxt({ userAgent: '*', allow: [], disallow: ['/admin\nUser-agent: evil'], crawlDelay: null, sitemap: '' }).ok).toBe(false)
    expect(buildRobotsTxt({ userAgent: '*\nBad: 1', allow: [], disallow: [], crawlDelay: null, sitemap: '' }).ok).toBe(false)
    expect(buildRobotsTxt({ userAgent: '*', allow: [], disallow: [], crawlDelay: null, sitemap: 'javascript:alert(1)' }).ok).toBe(false)
    expect(buildRobotsTxt({ userAgent: '*', allow: [], disallow: [], crawlDelay: -1, sitemap: '' }).ok).toBe(false)
  })
})

describe('buildSitemapXml', () => {
  it('escapes XML-significant characters in URLs', () => {
    const result = buildSitemapXml('https://example.com/a?x=1&y=2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.count).toBe(1)
    expect(result.xml).toContain('&amp;')
    expect(result.xml).toContain('<urlset xmlns=')
  })

  it('rejects empty, invalid and unsafe URLs', () => {
    expect(buildSitemapXml('').ok).toBe(false)
    expect(buildSitemapXml('not-a-url').ok).toBe(false)
    expect(buildSitemapXml('javascript:alert(1)').ok).toBe(false)
  })

  it('caps the number of URLs', () => {
    const many = Array.from({ length: 5001 }, (_, i) => `https://example.com/${i}`).join('\n')
    expect(buildSitemapXml(many).ok).toBe(false)
  })
})
