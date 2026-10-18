/**
 * URL slug generation that survives real-world text.
 *
 * Unicode-aware: accents are transliterated away (é → e), punctuation and
 * separators collapse, and scripts with no latin equivalent (CJK, Cyrillic,
 * emoji) are dropped rather than mangled — the caller sees the emptiness
 * instead of a slug that looks fine and means nothing.
 */

export interface SlugOptions {
  separator: '-' | '_' | '.'
  /** Lowercase the result. Default true — most URL schemes expect it. */
  lowercase: boolean
  /** Cap the slug at this many characters, cutting on a separator boundary. */
  maxLength: number | null
}

export const DEFAULT_OPTIONS: SlugOptions = { separator: '-', lowercase: true, maxLength: null }

/** Transliterate the accents that NFKD decomposes into base letter + mark. */
function stripDiacritics(text: string): string {
  // ß, æ, œ and friends never decompose under NFKD, so they are expanded
  // explicitly first; ø, đ and ł decompose into odd shapes and are mapped too.
  const expansions: Record<string, string> = { 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ł': 'l' }
  const expanded = text.replace(/[ßæœøđł]/g, (char) => expansions[char] ?? char)
  return expanded.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

/** Generate one slug from arbitrary text. */
export function slugify(input: string, options: Partial<SlugOptions> = {}): string {
  const { separator, lowercase, maxLength } = { ...DEFAULT_OPTIONS, ...options }
  let worked = stripDiacritics(input)
  if (lowercase) worked = worked.toLowerCase()

  // Keep latin letters, digits, and characters that are word-ish in any script
  // we intend to preserve (none today — see the module note). Everything else
  // becomes a separator candidate. String.replace does not interpret regex
  // metacharacters in the replacement, so the separator goes in raw.
  worked = worked.replace(/[^a-z0-9]+/gi, separator)

  // Collapse runs of the separator and trim it from both ends.
  const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const run = new RegExp(`${escaped}{2,}`, 'g')
  const trim = new RegExp(`^${escaped}+|${escaped}+$`, 'g')
  let slug = worked.replace(run, separator).replace(trim, '')

  if (maxLength !== null && slug.length > maxLength) {
    // Cut on the last separator before the cap so words stay whole.
    const cut = slug.slice(0, maxLength)
    const boundary = cut.lastIndexOf(separator)
    slug = boundary > 0 ? cut.slice(0, boundary) : cut
    slug = slug.replace(new RegExp(`${escaped}+$`), '')
  }
  return slug
}

/** Slug every line, skipping lines that produce nothing. */
export function slugifyLines(input: string, options: Partial<SlugOptions> = {}): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => slugify(line.trim(), options))
    .filter((slug) => slug !== '')
}

/** How many of the input lines produced a usable slug. */
export function slugStats(input: string, options: Partial<SlugOptions> = {}): { lines: number; slugs: number } {
  const lines = input.split(/\r?\n/).filter((line) => line.trim() !== '').length
  return { lines, slugs: slugifyLines(input, options).length }
}
