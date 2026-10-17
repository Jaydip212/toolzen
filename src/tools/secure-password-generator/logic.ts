/**
 * Secure password and passphrase generation.
 *
 * Randomness comes from `crypto.getRandomValues`, with rejection sampling so
 * every character is equally likely (a plain `% poolSize` would bias the first
 * few characters). The random source is injectable so the logic can be tested
 * deterministically.
 */

/* -------------------------------------------------------------------------- */
/* Character sets                                                             */
/* -------------------------------------------------------------------------- */

export const LOWER_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz'
export const UPPER_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const DIGIT_CHARACTERS = '0123456789'
export const SYMBOL_CHARACTERS = '!@#$%^&*()-_=+[]{};:,.?'

/** Characters that are easy to confuse when read aloud or transcribed. */
export const AMBIGUOUS_CHARACTERS = '0OoIl1|`\'"[]{}()/\\'

export interface GeneratorOptions {
  /** Total number of characters. */
  length: number
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
  /** Remove look-alike characters such as 0/O and 1/l/I. */
  excludeAmbiguous: boolean
  /** Guarantee at least one character from every selected set. */
  requireEachSet: boolean
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  requireEachSet: true,
}

export const MIN_LENGTH = 4
export const MAX_LENGTH = 128
export const MIN_WORDS = 2
export const MAX_WORDS = 12

/** The character sets that are currently switched on, in a stable order. */
export function selectedSets(options: GeneratorOptions): string[] {
  const sets: string[] = []
  if (options.lower) sets.push(LOWER_CHARACTERS)
  if (options.upper) sets.push(UPPER_CHARACTERS)
  if (options.digits) sets.push(DIGIT_CHARACTERS)
  if (options.symbols) sets.push(SYMBOL_CHARACTERS)
  return sets
}

/** The full alphabet a password is drawn from, after any exclusions. */
export function buildAlphabet(options: GeneratorOptions): string {
  const joined = selectedSets(options).join('')
  if (!options.excludeAmbiguous) return joined
  return joined
    .split('')
    .filter((character) => !AMBIGUOUS_CHARACTERS.includes(character))
    .join('')
}

/** A human-readable error for an impossible combination, or `null`. */
export function validateOptions(options: GeneratorOptions): string | null {
  if (selectedSets(options).length === 0) {
    return 'Choose at least one character type.'
  }
  if (!Number.isFinite(options.length)) return 'Enter a length.'
  if (options.length < MIN_LENGTH) return `Length must be at least ${MIN_LENGTH}.`
  if (options.length > MAX_LENGTH) return `Length must be ${MAX_LENGTH} or fewer.`
  return null
}

/* -------------------------------------------------------------------------- */
/* Randomness                                                                 */
/* -------------------------------------------------------------------------- */

/** A source of floats in [0, 1). Injectable so tests are deterministic. */
export type RandomSource = () => number

function cryptoUnit(): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / 0x1_0000_0000
}

/**
 * A uniformly random integer in [0, maxExclusive).
 *
 * Uses rejection sampling so the distribution is exactly uniform — taking a
 * modulus of a raw 32-bit value would make low numbers slightly more likely.
 */
export function randomInt(maxExclusive: number, random: RandomSource = cryptoUnit): number {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
    throw new Error('randomInt needs a positive range.')
  }
  if (random !== cryptoUnit) {
    // A test-supplied source: straightforward scaling is fine.
    return Math.min(maxExclusive - 1, Math.floor(random() * maxExclusive))
  }
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  const buffer = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]
  } while (value >= limit)
  return value % maxExclusive
}

function pickOne(characters: string, random: RandomSource): string {
  return characters.charAt(randomInt(characters.length, random))
}

/** Fisher–Yates shuffle, in place, using the supplied random source. */
export function shuffle<T>(items: T[], random: RandomSource = cryptoUnit): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1, random)
    const temporary = items[index]
    items[index] = items[swap]
    items[swap] = temporary
  }
  return items
}

/* -------------------------------------------------------------------------- */
/* Password generation                                                        */
/* -------------------------------------------------------------------------- */

export function clampLength(length: number): number {
  if (!Number.isFinite(length)) return DEFAULT_GENERATOR_OPTIONS.length
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(length)))
}

/**
 * Build a password.
 *
 * When `requireEachSet` is on, every selected set contributes at least one
 * character — but only if there are enough slots. The result is shuffled so the
 * guaranteed characters are not always at the front.
 */
export function generatePassword(
  options: GeneratorOptions,
  random: RandomSource = cryptoUnit,
): string {
  const alphabet = buildAlphabet(options)
  if (alphabet === '') return ''

  const length = clampLength(options.length)
  const sets = selectedSets(options)
    .map((set) =>
      options.excludeAmbiguous
        ? set
            .split('')
            .filter((character) => !AMBIGUOUS_CHARACTERS.includes(character))
            .join('')
        : set,
    )
    .filter((set) => set.length > 0)

  const characters: string[] = []

  if (options.requireEachSet && sets.length > 0 && sets.length <= length) {
    for (const set of sets) characters.push(pickOne(set, random))
  }

  while (characters.length < length) characters.push(pickOne(alphabet, random))

  return shuffle(characters, random).join('')
}

/** Generate `count` independent passwords. */
export function generateBatch(
  count: number,
  options: GeneratorOptions,
  random: RandomSource = cryptoUnit,
): string[] {
  const safeCount = Math.min(50, Math.max(1, Math.round(count)))
  return Array.from({ length: safeCount }, () => generatePassword(options, random))
}

/* -------------------------------------------------------------------------- */
/* Passphrase generation                                                      */
/* -------------------------------------------------------------------------- */

/** A 272-word list — 8.09 bits of entropy per word. */
export const WORDLIST: readonly string[] = [
  'anchor', 'apple', 'arrow', 'autumn', 'badge', 'baker', 'bamboo', 'barrel',
  'basket', 'beacon', 'beetle', 'bishop', 'blanket', 'blossom', 'bottle', 'breeze',
  'bridge', 'bronze', 'brook', 'bucket', 'buffalo', 'butter', 'cabin', 'cactus',
  'camel', 'candle', 'canyon', 'carbon', 'carpet', 'castle', 'cellar', 'cherry',
  'circle', 'cliff', 'clover', 'coffee', 'comet', 'copper', 'coral', 'cotton',
  'cougar', 'crater', 'cricket', 'crimson', 'crystal', 'daisy', 'dawn', 'delta',
  'desert', 'diamond', 'dolphin', 'domino', 'donkey', 'dragon', 'drum', 'eagle',
  'ember', 'engine', 'falcon', 'feather', 'ferry', 'fiddle', 'forest', 'fossil',
  'fountain', 'galaxy', 'garden', 'garlic', 'gecko', 'ginger', 'glacier', 'globe',
  'granite', 'grape', 'gravel', 'guitar', 'hammer', 'harbor', 'hazel', 'heron',
  'honey', 'horizon', 'hound', 'hunter', 'igloo', 'island', 'ivory', 'jaguar',
  'jasmine', 'jelly', 'jungle', 'juniper', 'kettle', 'kingdom', 'kitten', 'ladder',
  'lagoon', 'lantern', 'laptop', 'laser', 'lattice', 'lemon', 'leopard', 'lettuce',
  'lighthouse', 'lilac', 'linen', 'lizard', 'lobster', 'lotus', 'lunar', 'magnet',
  'mango', 'maple', 'marble', 'marlin', 'meadow', 'melon', 'meteor', 'midnight',
  'mirror', 'monkey', 'monsoon', 'moss', 'mountain', 'muffin', 'mustard', 'nectar',
  'needle', 'nickel', 'nightingale', 'notebook', 'nugget', 'oasis', 'ocean', 'olive',
  'onion', 'opal', 'orbit', 'orchid', 'otter', 'oyster', 'paddle', 'palace',
  'pancake', 'panda', 'papaya', 'parrot', 'pebble', 'pelican', 'pencil', 'penguin',
  'pepper', 'petal', 'phoenix', 'piano', 'pigeon', 'pillow', 'pilot', 'pinecone',
  'pioneer', 'pixel', 'planet', 'plasma', 'plateau', 'pluto', 'pocket', 'pollen',
  'poplar', 'portal', 'potato', 'prairie', 'prism', 'pumpkin', 'puzzle', 'python',
  'quartz', 'quill', 'rabbit', 'radar', 'radish', 'rainbow', 'ranger', 'raven',
  'ribbon', 'river', 'robin', 'rocket', 'rooster', 'ruby', 'rudder', 'saffron',
  'salmon', 'sapphire', 'satellite', 'scallop', 'scarlet', 'shadow', 'shelter', 'sherbet',
  'shuttle', 'signal', 'silver', 'skipper', 'slate', 'socket', 'sparrow', 'spiral',
  'spruce', 'squash', 'squirrel', 'stable', 'starlight', 'statue', 'steam', 'stellar',
  'stencil', 'stone', 'storm', 'stratus', 'sugar', 'summit', 'sunrise', 'sunset',
  'swan', 'sweater', 'sycamore', 'syrup', 'tangerine', 'teapot', 'telescope', 'temple',
  'thunder', 'tiger', 'timber', 'tornado', 'tortoise', 'trellis', 'trumpet', 'tunnel',
  'turtle', 'umbrella', 'unicorn', 'valley', 'vanilla', 'velvet', 'vessel', 'violet',
  'violin', 'volcano', 'walnut', 'walrus', 'waterfall', 'weasel', 'whale', 'wheat',
  'whistle', 'willow', 'window', 'winter', 'wolf', 'wonder', 'wren', 'yacht',
  'yarn', 'yarrow', 'yellow', 'zebra', 'zenith', 'zephyr', 'zinnia', 'zipper',
]

/** Separators offered for passphrases. */
export const SEPARATORS = ['-', '.', '_', ' ', '+', ''] as const
export type Separator = (typeof SEPARATORS)[number]

export function clampWordCount(count: number): number {
  if (!Number.isFinite(count)) return 4
  return Math.min(MAX_WORDS, Math.max(MIN_WORDS, Math.round(count)))
}

/** Build a passphrase by choosing words independently from the word list. */
export function generatePassphrase(
  wordCount: number,
  separator: Separator = '-',
  random: RandomSource = cryptoUnit,
  capitalise = false,
): string {
  const count = clampWordCount(wordCount)
  const words: string[] = []
  for (let index = 0; index < count; index += 1) {
    const word = WORDLIST[randomInt(WORDLIST.length, random)]
    words.push(capitalise ? word.charAt(0).toUpperCase() + word.slice(1) : word)
  }
  return words.join(separator)
}

/* -------------------------------------------------------------------------- */
/* Strength                                                                   */
/* -------------------------------------------------------------------------- */

/** Entropy of a random password: length × log2(pool size). */
export function passwordEntropyBits(length: number, poolSize: number): number {
  if (length <= 0 || poolSize <= 1) return 0
  return length * Math.log2(poolSize)
}

/** Entropy of a passphrase: words × log2(word list size), plus the separators. */
export function passphraseEntropyBits(
  wordCount: number,
  listSize: number = WORDLIST.length,
  separatorChoices: number = SEPARATORS.length,
): number {
  if (wordCount <= 0 || listSize <= 1) return 0
  const separatorBits = separatorChoices > 1 ? Math.log2(separatorChoices) : 0
  return wordCount * Math.log2(listSize) + Math.max(0, wordCount - 1) * separatorBits
}

export interface StrengthVerdict {
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong'
  score: number
  tone: string
}

/** Turn an entropy figure into a label, using the same thresholds as the estimator. */
export function strengthVerdict(bits: number): StrengthVerdict {
  if (bits < 28) return { label: 'Very weak', score: 0, tone: 'text-danger' }
  if (bits < 40) return { label: 'Weak', score: 1, tone: 'text-danger' }
  if (bits < 60) return { label: 'Fair', score: 2, tone: 'text-warning' }
  if (bits < 90) return { label: 'Strong', score: 3, tone: 'text-success' }
  return { label: 'Very strong', score: 4, tone: 'text-success' }
}
