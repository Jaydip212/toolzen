/**
 * Lorem ipsum generation.
 *
 * The generator takes an explicit `random` function so tests are deterministic.
 * The word list is the classic Latin filler text; no sentence is copied from a
 * source, they are assembled from the vocabulary below.
 */

/** The classic Lorem ipsum vocabulary. */
export const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos', 'accusamus',
  'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis', 'praesentium', 'voluptatum',
  'deleniti', 'atque', 'corrupti', 'quos', 'quas', 'molestias', 'excepturi', 'occaecati',
  'cupiditate', 'provident', 'similique', 'mollitia', 'animi', 'laboriosam', 'nihil',
  'molestiae', 'illum', 'fugit', 'quo', 'voluptas', 'nulla', 'pariatur', 'harum', 'quidem',
  'rerum', 'facilis', 'expedita', 'distinctio', 'nam', 'libero', 'tempore', 'cum', 'soluta',
  'nobis', 'eligendi', 'optio', 'cumque', 'impedit', 'minus', 'quod', 'maxime', 'placeat',
  'facere', 'possimus', 'omnis', 'assumenda', 'repellendus', 'temporibus', 'quibusdam',
  'officiis', 'debitis', 'necessitatibus', 'saepe', 'eveniet', 'voluptates', 'repudiandae',
  'recusandae', 'itaque', 'earum', 'hic', 'tenetur', 'sapiente', 'delectus', 'reiciendis',
  'voluptatibus', 'maiores', 'doloribus', 'asperiores', 'repellat',
] as const

/** The canonical opening, used when `startWithLorem` is on. */
export const LOREM_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'

export type LoremUnit = 'paragraphs' | 'sentences' | 'words'
export type LoremLength = 'short' | 'medium' | 'long'

export interface LoremOptions {
  unit: LoremUnit
  /** How many of `unit` to produce. */
  count: number
  /** Begin with the canonical "Lorem ipsum dolor sit amet…" opening. */
  startWithLorem: boolean
  /** Rough sentence length. */
  length: LoremLength
  /** Wrap the output in <p> tags. */
  htmlParagraphs: boolean
}

export const DEFAULT_LOREM_OPTIONS: LoremOptions = {
  unit: 'paragraphs',
  count: 3,
  startWithLorem: true,
  length: 'medium',
  htmlParagraphs: false,
}

/** Word counts per sentence band. */
const SENTENCE_LENGTHS: Record<LoremLength, [number, number]> = {
  short: [4, 8],
  medium: [8, 16],
  long: [16, 28],
}

/** Pick an integer in `[min, max]` using the supplied random source. */
function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

/** Build one sentence. */
function makeSentence(random: () => number, length: LoremLength): string {
  const [min, max] = SENTENCE_LENGTHS[length]
  const wordCount = randomInt(random, min, max)
  const words: string[] = []
  for (let i = 0; i < wordCount; i += 1) {
    words.push(LOREM_WORDS[randomInt(random, 0, LOREM_WORDS.length - 1)])
  }
  const sentence = words.join(' ')
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

/** Build one paragraph of `sentenceCount` sentences. */
function makeParagraph(random: () => number, length: LoremLength, sentenceCount: number): string {
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i += 1) {
    sentences.push(makeSentence(random, length))
  }
  return sentences.join(' ')
}

/** Clamp a requested count into a range that will not lock up the tab. */
export function clampCount(count: number, unit: LoremUnit): number {
  const max = unit === 'words' ? 1000 : unit === 'sentences' ? 200 : 50
  if (!Number.isFinite(count)) return 1
  return Math.min(max, Math.max(1, Math.round(count)))
}

/** Generate Lorem ipsum text. */
export function generateLorem(
  options: LoremOptions = DEFAULT_LOREM_OPTIONS,
  random: () => number = Math.random,
): string {
  const count = clampCount(options.count, options.unit)

  if (options.unit === 'words') {
    const words: string[] = []
    for (let i = 0; i < count; i += 1) {
      words.push(LOREM_WORDS[randomInt(random, 0, LOREM_WORDS.length - 1)])
    }
    if (options.startWithLorem) {
      const opening = LOREM_OPENING.toLowerCase().split(' ')
      for (let i = 0; i < Math.min(opening.length, count); i += 1) words[i] = opening[i]
    }
    const text = words.join(' ')
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
  }

  if (options.unit === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < count; i += 1) sentences.push(makeSentence(random, options.length))
    if (options.startWithLorem) sentences[0] = `${LOREM_OPENING}.`
    return sentences.join(' ')
  }

  const paragraphs: string[] = []
  for (let i = 0; i < count; i += 1) {
    // Roughly three to six sentences per paragraph, scaled by length.
    const sentenceCount = options.length === 'short' ? 3 : options.length === 'medium' ? 4 : 5
    paragraphs.push(makeParagraph(random, options.length, sentenceCount))
  }
  if (options.startWithLorem) {
    paragraphs[0] = paragraphs[0].replace(/^[^.]*\./, `${LOREM_OPENING}.`)
  }

  if (options.htmlParagraphs) {
    return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('\n\n')
  }
  return paragraphs.join('\n\n')
}

export interface LoremStats {
  paragraphs: number
  sentences: number
  words: number
  characters: number
}

/** Count the structure of generated text. */
export function loremStats(text: string): LoremStats {
  const plain = text.replace(/<\/?p>/g, '')
  const trimmed = plain.trim()
  return {
    paragraphs: plain.split(/\n{2,}/).filter((block) => block.trim() !== '').length,
    sentences: trimmed === '' ? 0 : (trimmed.match(/[.!?]+/g) ?? []).length,
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    characters: [...text].length,
  }
}
