export class UrlError extends Error {}

export type UrlMode = 'component' | 'uri' | 'query'

export interface QueryPair {
  key: string
  value: string
}

export const URL_MODES: Array<{ value: UrlMode; label: string; description: string }> = [
  {
    value: 'component',
    label: 'Component',
    description: 'encodeURIComponent — escapes / : ? # & = and everything else that is not unreserved. Use it for one value.',
  },
  {
    value: 'uri',
    label: 'Full URL',
    description: 'encodeURI — leaves the URL structure (scheme, slashes, question mark, ampersand) intact.',
  },
  {
    value: 'query',
    label: 'Query string',
    description: 'Reads a query string into its parameters, decoded.',
  },
]

/** Encode one value so it can sit safely inside a URL. */
export function encodeComponent(text: string): string {
  return encodeURIComponent(text)
}

/** Encode a whole URL, preserving its structure. */
export function encodeUri(text: string): string {
  return encodeURI(text)
}

/**
 * Decode a percent-encoded string.
 *
 * `decodeURIComponent` throws on a malformed sequence such as `%ZZ` or a lone
 * `%`. That error is turned into a specific message instead of a crash.
 */
export function decodeComponent(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    const bad = findMalformedEscape(text)
    if (bad !== null) {
      throw new UrlError(
        `“${bad}” is not a valid percent escape. A % must be followed by exactly two hexadecimal digits (00–FF).`,
      )
    }
    throw new UrlError('That is not valid percent-encoded text.')
  }
}

/** Decode a whole URL, leaving reserved characters in place. */
export function decodeUri(text: string): string {
  try {
    return decodeURI(text)
  } catch {
    const bad = findMalformedEscape(text)
    if (bad !== null) {
      throw new UrlError(
        `“${bad}” is not a valid percent escape. A % must be followed by exactly two hexadecimal digits (00–FF).`,
      )
    }
    throw new UrlError('That is not valid percent-encoded text.')
  }
}

/** Return the first malformed `%` sequence, or `null` when every escape is valid. */
export function findMalformedEscape(text: string): string | null {
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '%') continue
    const slice = text.slice(index, index + 3)
    if (!/^%[0-9A-Fa-f]{2}$/.test(slice)) return slice
  }
  return null
}

/** Split a URL or bare query string into decoded key/value pairs. */
export function parseQuery(input: string): QueryPair[] {
  const trimmed = input.trim()
  if (trimmed === '') return []

  let query = trimmed
  const questionMark = trimmed.indexOf('?')
  if (questionMark !== -1) {
    query = trimmed.slice(questionMark + 1)
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    // A URL with no "?" has no query string at all.
    return []
  }
  const hash = query.indexOf('#')
  if (hash !== -1) query = query.slice(0, hash)

  if (query === '') return []

  const pairs: QueryPair[] = []
  for (const part of query.split('&')) {
    if (part === '') continue
    const equals = part.indexOf('=')
    const rawKey = equals === -1 ? part : part.slice(0, equals)
    const rawValue = equals === -1 ? '' : part.slice(equals + 1)
    pairs.push({ key: safeDecode(rawKey), value: safeDecode(rawValue) })
  }
  return pairs
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

/** Rebuild a query string from pairs, encoding each key and value. */
export function buildQuery(pairs: QueryPair[]): string {
  return pairs
    .filter((pair) => pair.key !== '')
    .map((pair) => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`)
    .join('&')
}

/** Convert pairs to a JSON object, joining repeated keys into an array. */
export function queryToObject(pairs: QueryPair[]): Record<string, string | string[]> {
  const object: Record<string, string | string[]> = {}
  for (const pair of pairs) {
    const existing = object[pair.key]
    if (existing === undefined) object[pair.key] = pair.value
    else if (Array.isArray(existing)) existing.push(pair.value)
    else object[pair.key] = [existing, pair.value]
  }
  return object
}

/** A short explanation of what happened, for the result header. */
export function describeChange(before: string, after: string): string {
  if (before === after) return 'Nothing needed encoding — every character is already safe.'
  const added = after.length - before.length
  return `${before.length} → ${after.length} characters (+${added}).`
}

/** Count the percent escapes in a string. */
export function countEscapes(text: string): number {
  return (text.match(/%[0-9A-Fa-f]{2}/g) ?? []).length
}
