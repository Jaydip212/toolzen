/**
 * Pure text-analysis helpers for the Word Counter tool.
 * Kept free of React so the behaviour can be unit tested directly.
 */

export const WORDS_PER_MINUTE_READING = 200
export const WORDS_PER_MINUTE_SPEAKING = 130

export interface WordCountStats {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  /** Estimated minutes to read, as a decimal. */
  readingMinutes: number
  /** Estimated minutes to read aloud, as a decimal. */
  speakingMinutes: number
}

/**
 * Count words as whitespace-separated tokens.
 * Empty or whitespace-only input counts as zero.
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/**
 * Count sentences. A sentence ends at `.`, `!`, `?` or `…`, optionally
 * followed by closing quotes or brackets. Text without terminal punctuation
 * still counts as one sentence when it contains any words.
 */
export function countSentences(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const matches = trimmed.match(/[^.!?…]+[.!?…]+(\s|$)/g)
  if (matches) return matches.length
  // No terminal punctuation: treat a non-empty block as a single sentence.
  return 1
}

/**
 * Count paragraphs as non-empty blocks separated by one or more line breaks.
 */
export function countParagraphs(text: string): number {
  return text.split(/\n+/).filter((block) => block.trim().length > 0).length
}

/** Number of Unicode code points, so emoji and accents count as one character. */
export function countCharacters(text: string): number {
  return [...text].length
}

/** Character count ignoring all whitespace. */
export function countCharactersNoSpaces(text: string): number {
  return [...text.replace(/\s/g, '')].length
}

/** Analyse a block of text and return every statistic the tool displays. */
export function analyzeText(text: string): WordCountStats {
  const words = countWords(text)
  return {
    words,
    characters: countCharacters(text),
    charactersNoSpaces: countCharactersNoSpaces(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    readingMinutes: words / WORDS_PER_MINUTE_READING,
    speakingMinutes: words / WORDS_PER_MINUTE_SPEAKING,
  }
}

/** Format a duration in minutes for display, e.g. "42 sec" or "2 min 10 sec". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 sec'
  const totalSeconds = Math.round(minutes * 60)
  if (totalSeconds < 60) return `${totalSeconds} sec`
  const wholeMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds === 0 ? `${wholeMinutes} min` : `${wholeMinutes} min ${seconds} sec`
}
