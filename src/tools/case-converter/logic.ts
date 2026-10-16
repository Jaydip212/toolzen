/**
 * Pure case-conversion helpers for the Case Converter tool.
 */

export type CaseStyle =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'

export interface CaseStyleOption {
  id: CaseStyle
  label: string
  /** Short description of the output shape. */
  description: string
}

export const caseStyles: CaseStyleOption[] = [
  { id: 'upper', label: 'UPPER CASE', description: 'Every letter capitalised' },
  { id: 'lower', label: 'lower case', description: 'Every letter lowercased' },
  { id: 'title', label: 'Title Case', description: 'First letter of each word capitalised' },
  { id: 'sentence', label: 'Sentence case', description: 'First letter of each sentence capitalised' },
  { id: 'camel', label: 'camelCase', description: 'Words joined, later words capitalised' },
  { id: 'pascal', label: 'PascalCase', description: 'Words joined, every word capitalised' },
  { id: 'snake', label: 'snake_case', description: 'Words joined with underscores' },
  { id: 'kebab', label: 'kebab-case', description: 'Words joined with hyphens' },
  { id: 'constant', label: 'CONSTANT_CASE', description: 'Uppercase words joined with underscores' },
  { id: 'alternating', label: 'aLtErNaTiNg', description: 'Letters alternate between cases' },
]

/**
 * Split text into words, handling spaces, punctuation, and camelCase or
 * acronym boundaries such as `myHTTPServer` → `my HTTP Server`.
 */
export function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)
}

function toTitleCase(text: string): string {
  return text.replace(/[\p{L}][\p{L}'’]*/gu, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

function toSentenceCase(text: string): string {
  const lower = text.toLowerCase()
  return lower.replace(
    /(^\s*[\p{L}])|([.!?…]\s+[\p{L}])|(\n\s*[\p{L}])/gu,
    (match) => match.toUpperCase(),
  )
}

function toAlternatingCase(text: string): string {
  let letterIndex = 0
  return [...text]
    .map((char) => {
      if (!/\p{L}/u.test(char)) return char
      const result = letterIndex % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      letterIndex += 1
      return result
    })
    .join('')
}

function toJoinedCase(text: string, separator: string, transform: (word: string) => string): string {
  return splitWords(text).map(transform).join(separator)
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Convert `text` to the requested case style. */
export function convertCase(text: string, style: CaseStyle): string {
  switch (style) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'title':
      return toTitleCase(text)
    case 'sentence':
      return toSentenceCase(text)
    case 'camel': {
      const words = splitWords(text)
      return words
        .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word)))
        .join('')
    }
    case 'pascal':
      return splitWords(text).map(capitalize).join('')
    case 'snake':
      return toJoinedCase(text, '_', (word) => word.toLowerCase())
    case 'kebab':
      return toJoinedCase(text, '-', (word) => word.toLowerCase())
    case 'constant':
      return toJoinedCase(text, '_', (word) => word.toUpperCase())
    case 'alternating':
      return toAlternatingCase(text)
    default:
      return text
  }
}
