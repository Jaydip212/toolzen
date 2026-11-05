/**
 * Generators and secure randomness for Phase 7 tools.
 *
 * Anything that generates HTML/XML here escapes user input. Anything random
 * uses crypto.getRandomValues with rejection sampling so no character or
 * number is favoured by a modulo bias. Randomness functions accept an
 * injectable byte source for deterministic tests.
 */

export type RandomByteSource = (count: number) => Uint8Array

export const cryptoBytes: RandomByteSource = (count) => {
  const bytes = new Uint8Array(count)
  crypto.getRandomValues(bytes)
  return bytes
}

/** Uniform integer in [0, bound), with rejection sampling — no modulo bias. */
export function secureRandomInt(bound: number, source: RandomByteSource = cryptoBytes): number {
  if (!Number.isInteger(bound) || bound <= 0 || bound > 2 ** 32) {
    throw new Error('bound must be a positive integer up to 2^32')
  }
  const range = 2 ** 32
  const limit = range - (range % bound)
  for (;;) {
    const bytes = source(4)
    const value = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false)
    if (value < limit) return value % bound
  }
}

// --- Random numbers ---------------------------------------------------------

export interface RandomNumberOptions {
  min: number
  max: number
  count: number
  unique: boolean
}

export function randomNumbers(
  options: RandomNumberOptions,
  source: RandomByteSource = cryptoBytes,
): { ok: true; values: number[] } | { ok: false; error: string } {
  const { min, max, count, unique } = options
  if (![min, max, count].every(Number.isInteger)) return { ok: false, error: 'Bounds and count must be whole numbers.' }
  if (min > max) return { ok: false, error: 'The minimum cannot be larger than the maximum.' }
  if (count < 1 || count > 1000) return { ok: false, error: 'Generate between 1 and 1000 numbers at a time.' }
  const range = max - min + 1
  if (unique && count > range) {
    return { ok: false, error: `Cannot produce ${count} unique values from only ${range} possible numbers.` }
  }
  const values: number[] = []
  const seen = new Set<number>()
  while (values.length < count) {
    const value = min + secureRandomInt(range, source)
    if (unique && seen.has(value)) continue
    if (unique) seen.add(value)
    values.push(value)
  }
  return { ok: true, values }
}

// --- Random tokens ----------------------------------------------------------

export type TokenCharset = 'hex' | 'base64url' | 'alphanumeric' | 'symbols'

export const TOKEN_CHARSETS: Record<TokenCharset, { label: string; characters: string }> = {
  hex: { label: 'Hex (0-9a-f)', characters: '0123456789abcdef' },
  base64url: {
    label: 'URL-safe (A-Za-z0-9_-)',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  },
  alphanumeric: {
    label: 'Letters and digits',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  },
  symbols: {
    label: 'Letters, digits and symbols',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+',
  },
}

/** Uniform characters, again via rejection sampling. */
export function randomToken(
  charset: TokenCharset,
  length: number,
  source: RandomByteSource = cryptoBytes,
): string {
  const characters = TOKEN_CHARSETS[charset].characters
  const alphabetSize = characters.length
  const limit = 256 - (256 % alphabetSize)
  let result = ''
  while (result.length < length) {
    for (const byte of source(Math.ceil((length - result.length) * 1.5) + 8)) {
      if (byte >= limit) continue
      result += characters[byte % alphabetSize]
      if (result.length === length) break
    }
  }
  return result
}

export function generateTokens(
  charset: TokenCharset,
  length: number,
  count: number,
  source: RandomByteSource = cryptoBytes,
): { ok: true; tokens: string[] } | { ok: false; error: string } {
  if (!Number.isInteger(length) || length < 8 || length > 256) {
    return { ok: false, error: 'Length must be between 8 and 256 characters.' }
  }
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    return { ok: false, error: 'Generate between 1 and 50 tokens at a time.' }
  }
  if (!(charset in TOKEN_CHARSETS)) return { ok: false, error: 'Unknown character set.' }
  return {
    ok: true,
    tokens: Array.from({ length: count }, () => randomToken(charset, length, source)),
  }
}

// --- List shuffler ----------------------------------------------------------

/** Fisher-Yates with an external uniform-integer source, for testability. */
export function shuffle<T>(items: T[], randInt: (bound: number) => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randInt(index + 1)
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

/** Shuffle non-empty lines, preserving every line including duplicates. */
export function shuffleLines(
  text: string,
  randInt: (bound: number) => number = (bound) => secureRandomInt(bound),
): string[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  return shuffle(lines, randInt)
}

// --- Meta tags --------------------------------------------------------------

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeXml(value: string): string {
  return escapeHtml(value)
}

export interface MetaTagInput {
  title: string
  description?: string
  url?: string
  siteName?: string
  image?: string
  type?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image'
}

/** Build escaped <meta> tags; never inject raw user text into attributes. */
export function buildMetaTags(input: MetaTagInput): { ok: true; tags: string } | { ok: false; error: string } {
  const title = input.title.trim()
  if (title === '') return { ok: false, error: 'A page title is required.' }
  if (title.length > 200) return { ok: false, error: 'Keep the title under 200 characters.' }

  const lines: string[] = []
  const add = (attribute: string, content: string) => {
    if (content.trim() !== '') lines.push(`<meta ${attribute} content="${escapeHtml(content.trim())}" />`)
  }
  add('name="description"', input.description ?? '')
  add('property="og:title"', title)
  add('property="og:type"', input.type ?? 'website')
  add('property="og:description"', input.description ?? '')
  add('property="og:url"', input.url ?? '')
  add('property="og:site_name"', input.siteName ?? '')
  add('property="og:image"', input.image ?? '')
  add('name="twitter:card"', input.twitterCard ?? 'summary')
  add('name="twitter:title"', title)
  add('name="twitter:description"', input.description ?? '')
  add('name="twitter:image"', input.image ?? '')
  return { ok: true, tags: `<title>${escapeHtml(title)}</title>\n${lines.join('\n')}` }
}

// --- robots.txt -------------------------------------------------------------

export interface RobotsInput {
  userAgent: string
  allow: string[]
  disallow: string[]
  crawlDelay: number | null
  sitemap: string
}

function safePath(path: string): string | null {
  const trimmed = path.trim()
  if (trimmed === '') return null
  if (!trimmed.startsWith('/') || /[\r\n]/.test(trimmed)) return null
  return trimmed
}

export function buildRobotsTxt(input: RobotsInput): { ok: true; text: string } | { ok: false; error: string } {
  const agent = input.userAgent.trim() || '*'
  if (/[\r\n]/.test(agent)) return { ok: false, error: 'The user-agent cannot contain line breaks.' }
  const lines = [`User-agent: ${agent}`]
  for (const path of input.allow) {
    if (safePath(path) === null && path.trim() !== '') return { ok: false, error: `Invalid Allow path: ${path}` }
  }
  for (const path of input.disallow) {
    if (safePath(path) === null && path.trim() !== '') return { ok: false, error: `Invalid Disallow path: ${path}` }
  }
  for (const path of input.allow) if (safePath(path)) lines.push(`Allow: ${safePath(path)}`)
  for (const path of input.disallow) if (safePath(path)) lines.push(`Disallow: ${safePath(path)}`)
  if (input.crawlDelay !== null) {
    if (!Number.isFinite(input.crawlDelay) || input.crawlDelay < 0 || input.crawlDelay > 1000) {
      return { ok: false, error: 'Crawl delay must be between 0 and 1000 seconds.' }
    }
    lines.push(`Crawl-delay: ${input.crawlDelay}`)
  }
  if (input.sitemap.trim() !== '') {
    const sitemap = input.sitemap.trim()
    let valid = false
    try {
      const url = new URL(sitemap)
      valid = url.protocol === 'https:' || url.protocol === 'http:'
    } catch { /* not a URL */ }
    if (!valid) return { ok: false, error: 'The sitemap must be a full http(s) URL.' }
    lines.push(`Sitemap: ${sitemap}`)
  }
  return { ok: true, text: lines.join('\n') + '\n' }
}

// --- Sitemap XML ------------------------------------------------------------

export function buildSitemapXml(urlText: string): { ok: true; xml: string; count: number } | { ok: false; error: string } {
  const lines = urlText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '')
  if (lines.length === 0) return { ok: false, error: 'Add at least one URL.' }
  if (lines.length > 5000) return { ok: false, error: 'At most 5000 URLs per file — split into several sitemaps.' }
  for (const line of lines) {
    try {
      const url = new URL(line)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { ok: false, error: `Only http(s) URLs are allowed: ${line}` }
      }
    } catch {
      return { ok: false, error: `That is not a valid URL: ${line}` }
    }
  }
  const entries = lines.map((line) => `  <url>\n    <loc>${escapeXml(line)}</loc>\n  </url>`).join('\n')
  return {
    ok: true,
    count: lines.length,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
  }
}
