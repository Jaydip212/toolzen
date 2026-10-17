/**
 * Regular expression testing.
 *
 * Patterns run with `new RegExp`, so an invalid pattern produces a real error
 * message from the engine rather than a guess. Matching is capped so a
 * pathological pattern cannot hang the tab.
 */

export interface RegexMatch {
  /** Index of the match in the input. */
  index: number
  /** The matched text. */
  value: string
  /** Capture groups 1..n, `undefined` where a group did not participate. */
  groups: (string | undefined)[]
  /** Named capture groups, when the pattern uses them. */
  namedGroups?: Record<string, string | undefined>
}

export interface RegexResult {
  matches: RegexMatch[]
  /** A real error message when the pattern or flags are invalid. */
  error: string | null
  /** True when the match limit was reached and results were cut short. */
  truncated: boolean
  /** Time taken in milliseconds. */
  durationMs: number
}

/** Maximum matches collected, so a global pattern on a huge input stays fast. */
export const MAX_MATCHES = 5000

/** The flags offered in the UI, with plain-English explanations. */
export const REGEX_FLAGS = [
  { flag: 'g', label: 'g', description: 'global — find every match, not just the first' },
  { flag: 'i', label: 'i', description: 'ignore case' },
  { flag: 'm', label: 'm', description: 'multiline — ^ and $ match at line breaks' },
  { flag: 's', label: 's', description: 'dotall — . also matches newlines' },
  { flag: 'u', label: 'u', description: 'unicode — enable full Unicode matching' },
  { flag: 'y', label: 'y', description: 'sticky — match only from lastIndex' },
] as const

export const ALLOWED_FLAGS = 'gimsuy'

/** Remove duplicate and unknown flags, keeping the canonical order. */
export function normalizeFlags(flags: string): string {
  const unique = new Set(flags.split('').filter((flag) => ALLOWED_FLAGS.includes(flag)))
  return ALLOWED_FLAGS.split('')
    .filter((flag) => unique.has(flag))
    .join('')
}

/** Build a RegExp, returning the engine's error message when it is invalid. */
export function buildRegex(pattern: string, flags: string): { regex: RegExp } | { error: string } {
  try {
    return { regex: new RegExp(pattern, normalizeFlags(flags)) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'The pattern is not valid.' }
  }
}

/** Test a pattern against input and collect the matches. */
export function testRegex(
  pattern: string,
  flags: string,
  input: string,
  limit: number = MAX_MATCHES,
): RegexResult {
  if (pattern === '') {
    return { matches: [], error: null, truncated: false, durationMs: 0 }
  }

  const built = buildRegex(pattern, flags)
  if ('error' in built) {
    return { matches: [], error: built.error, truncated: false, durationMs: 0 }
  }

  const { regex } = built
  const matches: RegexMatch[] = []
  const started = performance.now()
  let truncated = false

  if (!regex.global && !regex.sticky) {
    const match = regex.exec(input)
    if (match) matches.push(toMatch(match))
    return { matches, error: null, truncated: false, durationMs: performance.now() - started }
  }

  // Reset lastIndex so a reused RegExp does not start mid-string.
  regex.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    matches.push(toMatch(match))
    if (matches.length >= limit) {
      truncated = true
      break
    }
    // A zero-length match would loop forever without this nudge.
    if (match.index === regex.lastIndex) regex.lastIndex += 1
    if (regex.lastIndex > input.length) break
  }

  return { matches, error: null, truncated, durationMs: performance.now() - started }
}

/** Convert a raw exec result into a serialisable match. */
function toMatch(match: RegExpExecArray): RegexMatch {
  const named = match.groups
  return {
    index: match.index,
    value: match[0],
    groups: match.slice(1),
    namedGroups: named ? { ...named } : undefined,
  }
}

/** A slice of the input, optionally highlighted as a match. */
export interface HighlightSegment {
  text: string
  matchIndex: number | null
}

/** Split input into alternating plain and matched segments. */
export function highlightMatches(input: string, matches: RegexMatch[]): HighlightSegment[] {
  if (matches.length === 0) return input === '' ? [] : [{ text: input, matchIndex: null }]

  const segments: HighlightSegment[] = []
  let cursor = 0

  matches.forEach((match, index) => {
    // Skip overlapping matches, which cannot be highlighted cleanly.
    if (match.index < cursor) return
    if (match.index > cursor) {
      segments.push({ text: input.slice(cursor, match.index), matchIndex: null })
    }
    if (match.value.length > 0) {
      segments.push({ text: match.value, matchIndex: index })
    }
    cursor = match.index + match.value.length
  })

  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), matchIndex: null })
  }

  return segments
}

export interface ReplaceResult {
  output: string
  count: number
  error: string | null
}

/**
 * Run a search-and-replace.
 * Replaces only the first match unless the `g` flag is set, matching the
 * behaviour of `String.prototype.replace`.
 */
export function replaceWithRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): ReplaceResult {
  const built = buildRegex(pattern, flags)
  if ('error' in built) return { output: input, count: 0, error: built.error }

  const { regex } = built
  const matches = testRegex(pattern, flags, input)
  if (matches.error) return { output: input, count: 0, error: matches.error }

  // The replacement may contain `$&`, `$1` and friends, which is intended.
  return {
    output: input.replace(regex, replacement),
    count: regex.global ? matches.matches.length : Math.min(1, matches.matches.length),
    error: null,
  }
}

/** Describe a pattern's structure in plain English, at a high level. */
export interface PatternPart {
  token: string
  meaning: string
}

/** A small reference table of the most common regex tokens. */
export const REGEX_CHEATSHEET: PatternPart[] = [
  { token: '.', meaning: 'any character except a newline' },
  { token: '\\d', meaning: 'any digit, 0–9' },
  { token: '\\w', meaning: 'any word character (letter, digit or underscore)' },
  { token: '\\s', meaning: 'any whitespace character' },
  { token: '\\D \\W \\S', meaning: 'the opposite of the lowercase version' },
  { token: '^', meaning: 'start of the string, or of a line with the m flag' },
  { token: '$', meaning: 'end of the string, or of a line with the m flag' },
  { token: '*', meaning: 'zero or more of the previous token' },
  { token: '+', meaning: 'one or more of the previous token' },
  { token: '?', meaning: 'zero or one of the previous token, or makes the previous token lazy' },
  { token: '{n,m}', meaning: 'between n and m repetitions' },
  { token: '[abc]', meaning: 'any one of the characters listed' },
  { token: '[^abc]', meaning: 'any character except those listed' },
  { token: '(abc)', meaning: 'a capturing group' },
  { token: '(?:abc)', meaning: 'a non-capturing group' },
  { token: '(?<name>abc)', meaning: 'a named capturing group' },
  { token: 'a|b', meaning: 'either a or b' },
  { token: '\\b', meaning: 'a word boundary' },
]
