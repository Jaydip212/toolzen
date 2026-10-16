/**
 * Pure character-analysis helpers for the Character Counter tool.
 */

export interface CharacterStats {
  /** Unicode code points, so emoji and accented letters count as one. */
  characters: number
  charactersNoSpaces: number
  letters: number
  digits: number
  punctuation: number
  whitespace: number
  lines: number
}

/** Count characters as Unicode code points. */
export function countCharacters(text: string): number {
  return [...text].length
}

/** Count characters excluding all whitespace. */
export function countCharactersNoSpaces(text: string): number {
  return [...text.replace(/\s/g, '')].length
}

/** Count letters across all scripts (Latin, Cyrillic, CJK, and so on). */
export function countLetters(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length
}

/** Count decimal digits. */
export function countDigits(text: string): number {
  return (text.match(/\p{Nd}/gu) ?? []).length
}

/** Count punctuation marks. */
export function countPunctuation(text: string): number {
  return (text.match(/\p{P}/gu) ?? []).length
}

/** Count whitespace characters, including spaces, tabs and line breaks. */
export function countWhitespace(text: string): number {
  return (text.match(/\s/gu) ?? []).length
}

/** Count lines, including blank lines. Empty input has zero lines. */
export function countLines(text: string): number {
  if (text.length === 0) return 0
  return text.split(/\r\n|\r|\n/).length
}

/** Analyse a block of text and return every statistic the tool displays. */
export function analyzeCharacters(text: string): CharacterStats {
  return {
    characters: countCharacters(text),
    charactersNoSpaces: countCharactersNoSpaces(text),
    letters: countLetters(text),
    digits: countDigits(text),
    punctuation: countPunctuation(text),
    whitespace: countWhitespace(text),
    lines: countLines(text),
  }
}
