/**
 * HTML entity encoding and decoding.
 *
 * Decoding resolves the full named-entity set in `NAMED_ENTITIES` plus numeric
 * references (`&#169;` and `&#xA9;`). Anything it does not recognise is left
 * exactly as written rather than silently dropped.
 */

/** Named entities supported for decoding and named-mode encoding. */
export const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '\u00ad',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  times: '×',
  divide: '÷',
  ndash: '–',
  mdash: '—',
  lsquo: '\u2018',
  rsquo: '\u2019',
  sbquo: '\u201a',
  ldquo: '\u201c',
  rdquo: '\u201d',
  bdquo: '\u201e',
  dagger: '†',
  Dagger: '‡',
  bull: '•',
  hellip: '…',
  permil: '‰',
  prime: '′',
  Prime: '″',
  lsaquo: '‹',
  rsaquo: '›',
  oline: '‾',
  frasl: '⁄',
  euro: '€',
  trade: '™',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  lArr: '⇐',
  uArr: '⇑',
  rArr: '⇒',
  dArr: '⇓',
  hArr: '⇔',
  forall: '∀',
  part: '∂',
  exist: '∃',
  empty: '∅',
  nabla: '∇',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  prod: '∏',
  sum: '∑',
  minus: '−',
  lowast: '∗',
  radic: '√',
  prop: '∝',
  infin: '∞',
  ang: '∠',
  and: '∧',
  or: '∨',
  cap: '∩',
  cup: '∪',
  int: '∫',
  there4: '∴',
  sim: '∼',
  cong: '≅',
  asymp: '≈',
  ne: '≠',
  equiv: '≡',
  le: '≤',
  ge: '≥',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  oplus: '⊕',
  otimes: '⊗',
  perp: '⊥',
  sdot: '⋅',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
  lang: '⟨',
  rang: '⟩',
  loz: '◊',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigmaf: 'ς',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  thetasym: 'ϑ',
  upsih: 'ϒ',
  piv: 'ϖ',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
}

/** Reverse lookup: character → preferred entity name. */
const REVERSE_ENTITIES: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [name, char] of Object.entries(NAMED_ENTITIES)) {
    // Keep the first name registered for a character, which favours the
    // conventional spelling (e.g. `copy` over a later duplicate).
    if (!(char in map)) map[char] = name
  }
  return map
})()

export type EncodeMode = 'minimal' | 'named' | 'numeric' | 'all'

/** The five characters that must always be escaped in HTML text or attributes. */
const ESSENTIAL: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Encode a string for safe use in HTML. */
export function encodeEntities(input: string, mode: EncodeMode = 'named'): string {
  if (input === '') return ''

  return [...input]
    .map((char) => {
      if (char in ESSENTIAL) return ESSENTIAL[char]

      if (mode === 'minimal') return char

      const codePoint = char.codePointAt(0) as number

      // ASCII printable characters never need escaping in named mode.
      if (mode === 'named') {
        const named = REVERSE_ENTITIES[char]
        if (named) return `&${named};`
        return codePoint > 127 ? `&#${codePoint};` : char
      }

      if (mode === 'numeric') {
        return codePoint > 127 ? `&#${codePoint};` : char
      }

      // 'all' — escape every character, including plain ASCII letters.
      return `&#${codePoint};`
    })
    .join('')
}

/**
 * Matches a named entity, a decimal numeric reference (`&#169;`) or a
 * hexadecimal one (`&#xA9;`). The HTML spec only requires a lowercase `x`, but
 * both cases are accepted here because rejecting the uppercase form helps
 * nobody and decoding it cannot break anything.
 */
const ENTITY_PATTERN = /&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g

/** Decode named and numeric HTML entities back to characters. */
export function decodeEntities(input: string): string {
  return input.replace(ENTITY_PATTERN, (match, body: string) => {
    if (body[1] === 'x' || body[1] === 'X') {
      const codePoint = Number.parseInt(body.slice(2), 16)
      return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint, match) : match
    }
    if (body.startsWith('#')) {
      const codePoint = Number.parseInt(body.slice(1), 10)
      return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint, match) : match
    }
    return NAMED_ENTITIES[body] ?? match
  })
}

/** Convert a code point, returning `fallback` when it is out of range. */
function safeFromCodePoint(codePoint: number, fallback: string): string {
  if (codePoint < 0 || codePoint > 0x10ffff) return fallback
  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return fallback
  }
}

export interface EntityStats {
  characters: number
  entities: number
  /** Distinct entity names or numeric references used. */
  distinctEntities: number
  /** Characters outside the printable ASCII range. */
  nonAscii: number
}

/** Summarise an encoded or decoded string. */
export function entityStats(text: string): EntityStats {
  const found = text.match(ENTITY_PATTERN) ?? []
  const characters = [...text]
  return {
    characters: characters.length,
    entities: found.length,
    distinctEntities: new Set(found).size,
    nonAscii: characters.filter((char) => (char.codePointAt(0) as number) > 127).length,
  }
}
