export interface ReadingStats {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  /** Estimated reading duration in minutes, never rounded up to a whole minute in the data. */
  minutes: number
  /** Seconds for the same estimate, so short text can be shown precisely. */
  seconds: number
  syllables: number
  /** Flesch Reading Ease score, or null when there is no sentence to measure. */
  readingEase: number | null
  /** Flesch–Kincaid grade level, or null when there is no sentence to measure. */
  gradeLevel: number | null
}

export interface ReadingRate {
  id: string
  label: string
  /** Words per minute. */
  wpm: number
  note: string
}

/**
 * Words-per-minute figures from published meta-analyses of reading research
 * (Marc Brysbaert's 2019 review for silent reading; Ducharne & Faber for
 * non-fiction aloud). They are averages — an individual rate varies a lot.
 */
export const RATES: ReadingRate[] = [
  { id: 'silent', label: 'Silent reading', wpm: 238, note: 'Average adult, non-fiction, on screen.' },
  { id: 'aloud', label: 'Reading aloud', wpm: 183, note: 'Typical adult pace when speaking text.' },
  { id: 'dense', label: 'Technical or legal text', wpm: 150, note: 'Unfamiliar terms force re-reading.' },
  { id: 'slow', label: 'Proof-reading or a second language', wpm: 120, note: 'Deliberate pace with checking.' },
]

/** A hyphenated or apostrophised word counts once. */
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu

export function countWords(text: string): number {
  if (!text) return 0
  return text.match(WORD_PATTERN)?.length ?? 0
}

export function countCharacters(text: string, includeSpaces = true): number {
  if (includeSpaces) return [...text].length
  return [...text.replace(/\s/g, '')].length
}

/** Sentences split on terminal punctuation, which is what a word counter needs. */
export function countSentences(text: string): number {
  const chunks = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)
  return chunks ? chunks.filter((chunk) => chunk.trim() !== '').length : 0
}

export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((block) => block.trim() !== '').length
}

/** Words alone, used by the syllable and readability maths. */
export function wordList(text: string): string[] {
  return text.match(WORD_PATTERN) ?? []
}

/**
 * A vowel-group syllable estimate.
 *
 * This is a heuristic, not a dictionary lookup: it is right most of the time on
 * ordinary prose and it says so rather than claiming precision.
 */
export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned === '') return 0
  if (cleaned.length <= 3) return 1

  let count = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g)?.length ?? 0

  return Math.max(1, count)
}

export function readingTime(wordCount: number, wpm: number): { minutes: number; seconds: number } {
  if (wpm <= 0) throw new Error('The reading rate has to be above zero words per minute.')
  const totalSeconds = (wordCount / wpm) * 60
  return {
    minutes: Math.round((totalSeconds / 60) * 100) / 100,
    seconds: Math.round(totalSeconds),
  }
}

/** "6 minutes" or "1 minute" or "about 4 minutes", never "0 minutes" for real text. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'under a second'
  if (seconds < 45) return `${seconds} second${seconds === 1 ? '' : 's'}`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const hourPart = `${hours} hour${hours === 1 ? '' : 's'}`
  return rest === 0 ? hourPart : `${hourPart} ${rest} min`
}

export function readingEase(text: string): number | null {
  const wordCount = countWords(text)
  const sentenceCount = countSentences(text)
  if (wordCount === 0 || sentenceCount === 0) return null
  const syllableTotal = wordList(text).reduce((total, word) => total + countSyllables(word), 0)
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableTotal / wordCount)
  return Math.round(score * 10) / 10
}

/** Flesch–Kincaid grade level, matching a US school year. */
export function gradeLevel(text: string): number | null {
  const wordCount = countWords(text)
  const sentenceCount = countSentences(text)
  if (wordCount === 0 || sentenceCount === 0) return null
  const syllableTotal = wordList(text).reduce((total, word) => total + countSyllables(word), 0)
  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableTotal / wordCount) - 15.59
  return Math.round(Math.max(0, grade) * 10) / 10
}

export interface EaseBand {
  lower: number
  upper: number | null
  label: string
}

/** The standard Flesch Reading Ease bands. */
export const EASE_BANDS: EaseBand[] = [
  { lower: 90, upper: null, label: 'Very easy — 5th grade' },
  { lower: 80, upper: 90, label: 'Easy — 6th grade' },
  { lower: 70, upper: 80, label: 'Fairly easy — 7th grade' },
  { lower: 60, upper: 70, label: 'Plain English — 8th–9th grade' },
  { lower: 50, upper: 60, label: 'Fairly difficult — 10th–12th grade' },
  { lower: 30, upper: 50, label: 'Difficult — college level' },
  { lower: -Infinity, upper: 30, label: 'Very difficult — graduate level' },
]

export function easeBandFor(score: number): EaseBand {
  return EASE_BANDS.find((band) => score >= band.lower && (band.upper === null || score < band.upper)) ?? EASE_BANDS[0]
}

/** Speaking time uses a slower rate than silent reading. */
export function speakingTime(wordCount: number, wpm = 150): number {
  return Math.round((wordCount / wpm) * 60)
}

/** Pages at a common single-spaced page length. */
export function estimatePages(wordCount: number, wordsPerPage = 275): number {
  if (wordsPerPage <= 0) throw new Error('Words per page has to be above zero.')
  return Math.round((wordCount / wordsPerPage) * 100) / 100
}

/** Everything about a piece of text, in one pass. Page counts come from `estimatePages`. */
export function analyse(text: string, wpm: number): ReadingStats {
  const wordCount = countWords(text)
  const time = readingTime(wordCount, wpm)
  return {
    words: wordCount,
    characters: countCharacters(text, true),
    charactersNoSpaces: countCharacters(text, false),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    minutes: time.minutes,
    seconds: time.seconds,
    syllables: wordList(text).reduce((total, word) => total + countSyllables(word), 0),
    readingEase: readingEase(text),
    gradeLevel: gradeLevel(text),
  }
}

