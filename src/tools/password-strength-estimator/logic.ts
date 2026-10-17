/**
 * Password strength estimation.
 *
 * The model is deliberately simple and explainable rather than a black box:
 *
 *   entropy ≈ length × log2(size of the character pool)
 *
 * and then a set of pattern checks (repeats, sequences, keyboard walks, common
 * words, known-breached passwords) subtract from that estimate. The result is
 * converted into a "time to crack" figure for a few realistic attack speeds.
 *
 * It is an estimate, not a guarantee. A password this tool calls strong can
 * still be weak if it is reused or if it appears in a breach list we do not
 * know about — the UI says exactly that.
 */

/* -------------------------------------------------------------------------- */
/* Character sets                                                             */
/* -------------------------------------------------------------------------- */

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
/** The printable ASCII symbols, matching what most password rules accept. */
const SYMBOLS = '!@#$%^&*()-_=+[]{};:\'",.<>/?\\|`~'

/**
 * How many characters each set contributes to the pool. Exported so the UI and
 * the tests can quote the same numbers instead of hard-coding them.
 */
export const CHARSET_SIZES = {
  lower: LOWER.length,
  upper: UPPER.length,
  digits: DIGITS.length,
  symbols: SYMBOLS.length,
  spaces: 1,
  unicode: 100,
} as const

export interface CharsetInfo {
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
  spaces: boolean
  /** Non-ASCII characters, which broaden the pool but are not always accepted. */
  unicode: boolean
  /** Total number of distinct characters the password could have drawn from. */
  poolSize: number
  /** Human-readable names of the sets that are present. */
  labels: string[]
}

/** Work out which character sets a password uses and how large its pool is. */
export function analyzeCharset(password: string): CharsetInfo {
  const lower = /[a-z]/.test(password)
  const upper = /[A-Z]/.test(password)
  const digits = /[0-9]/.test(password)
  const symbols = /[!-/:-@[-`{-~]/.test(password)
  const spaces = /\s/.test(password)
  // Any character above U+007F counts as "other".
  const unicode = /[^\x00-\x7F]/.test(password)

  let poolSize = 0
  if (lower) poolSize += CHARSET_SIZES.lower
  if (upper) poolSize += CHARSET_SIZES.upper
  if (digits) poolSize += CHARSET_SIZES.digits
  if (symbols) poolSize += CHARSET_SIZES.symbols
  if (spaces) poolSize += CHARSET_SIZES.spaces
  if (unicode) poolSize += CHARSET_SIZES.unicode

  const labels: string[] = []
  if (lower) labels.push('lowercase letters')
  if (upper) labels.push('uppercase letters')
  if (digits) labels.push('digits')
  if (symbols) labels.push('symbols')
  if (spaces) labels.push('spaces')
  if (unicode) labels.push('non-English characters')

  return { lower, upper, digits, symbols, spaces, unicode, poolSize, labels }
}

/* -------------------------------------------------------------------------- */
/* Pattern detection                                                          */
/* -------------------------------------------------------------------------- */

export interface PatternFinding {
  id: string
  /** Short title for the finding. */
  label: string
  /** One sentence explaining what was found. */
  detail: string
  /** How many bits to subtract from the naive estimate. */
  bitsPenalty: number
  severity: 'high' | 'medium' | 'low'
}

/** A short list of the passwords that appear at the top of every breach dump. */
export const COMMON_PASSWORDS: readonly string[] = [
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'passwd',
  '123456', '12345678', '123456789', '1234567890', '12345', '1234', '111111',
  '000000', 'qwerty', 'qwerty123', 'qwertyuiop', 'azerty', 'abc123', 'abcd1234',
  'letmein', 'welcome', 'welcome1', 'monkey', 'dragon', 'sunshine', 'princess',
  'football', 'baseball', 'iloveyou', 'admin', 'administrator', 'root', 'toor',
  'login', 'master', 'shadow', 'superman', 'batman', 'trustno1', 'starwars',
  'whatever', 'hello', 'hello123', 'freedom', 'secret', 'changeme', 'default',
  'guest', 'test', 'test123', 'temp', 'temp123', 'asdfgh', 'zxcvbn', 'zaq12wsx',
  '1q2w3e4r', '1qaz2wsx', 'qazwsx', '654321', '987654321', 'abcdef', 'aaaaaaaa',
  'michael', 'jennifer', 'jordan', 'hunter', 'ranger', 'buster', 'soccer',
]

/** Common English words that show up in dictionary attacks. */
const COMMON_WORDS: readonly string[] = [
  'password', 'welcome', 'admin', 'user', 'guest', 'login', 'secret', 'master',
  'summer', 'winter', 'spring', 'autumn', 'january', 'february', 'march',
  'april', 'june', 'july', 'august', 'september', 'october', 'november',
  'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
  'saturday', 'sunday', 'football', 'baseball', 'cricket', 'soccer', 'hockey',
  'london', 'paris', 'berlin', 'delhi', 'mumbai', 'india', 'china', 'america',
  'dragon', 'monkey', 'princess', 'sunshine', 'flower', 'cookie', 'banana',
  'computer', 'internet', 'network', 'server', 'database', 'system',
]

/** Keyboard rows used to spot walks such as "qwerty" or "asdfgh". */
const KEYBOARD_ROWS: readonly string[] = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', 'qazwsxedc', '!@#$%^&*()',
]

function hasRepeatRun(password: string, minimum: number): boolean {
  let run = 1
  for (let index = 1; index < password.length; index += 1) {
    if (password[index] === password[index - 1]) {
      run += 1
      if (run >= minimum) return true
    } else {
      run = 1
    }
  }
  return false
}

function hasAscendingRun(password: string, minimum: number): boolean {
  const lower = password.toLowerCase()
  let run = 1
  for (let index = 1; index < lower.length; index += 1) {
    if (lower.charCodeAt(index) === lower.charCodeAt(index - 1) + 1) {
      run += 1
      if (run >= minimum) return true
    } else {
      run = 1
    }
  }
  return false
}

function hasDescendingRun(password: string, minimum: number): boolean {
  const lower = password.toLowerCase()
  let run = 1
  for (let index = 1; index < lower.length; index += 1) {
    if (lower.charCodeAt(index) === lower.charCodeAt(index - 1) - 1) {
      run += 1
      if (run >= minimum) return true
    } else {
      run = 1
    }
  }
  return false
}

function hasKeyboardWalk(password: string, minimum: number): boolean {
  const lower = password.toLowerCase()
  for (const row of KEYBOARD_ROWS) {
    for (let start = 0; start + minimum <= row.length; start += 1) {
      const fragment = row.slice(start, start + minimum)
      if (lower.includes(fragment)) return true
      const reversed = fragment.split('').reverse().join('')
      if (lower.includes(reversed)) return true
    }
  }
  return false
}

function containsCommonWord(password: string): string | null {
  const lower = password.toLowerCase()
  for (const word of COMMON_WORDS) {
    if (word.length >= 4 && lower.includes(word)) return word
  }
  return null
}

/** Whether the password, ignoring case and trailing digits/symbols, is a known one. */
export function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase()
  if (COMMON_PASSWORDS.includes(lower)) return true
  // "password1234567890" and friends: strip every trailing digit and symbol,
  // then retry. Padding a breached password with digits does not save it.
  const stripped = lower.replace(/[0-9!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]{0,}$/, '')
  return stripped.length >= 4 && COMMON_PASSWORDS.includes(stripped)
}

/** Everything the pattern checks found, worst first. */
export function detectPatterns(password: string): PatternFinding[] {
  const findings: PatternFinding[] = []
  if (password === '') return findings

  if (isCommonPassword(password)) {
    findings.push({
      id: 'common',
      label: 'This is a well-known password',
      detail:
        'It appears in public breach lists, so an attacker would try it in the first few attempts.',
      bitsPenalty: 60,
      severity: 'high',
    })
  }

  if (/^\d+$/.test(password)) {
    findings.push({
      id: 'digits-only',
      label: 'Digits only',
      detail: 'A numeric-only password has a tiny character pool and is cracked almost instantly.',
      bitsPenalty: 20,
      severity: 'high',
    })
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    findings.push({
      id: 'letters-only',
      label: 'Letters only',
      detail: 'Adding digits and symbols multiplies the number of guesses an attacker must make.',
      bitsPenalty: 10,
      severity: 'medium',
    })
  }

  if (hasRepeatRun(password, 3)) {
    findings.push({
      id: 'repeat',
      label: 'Repeated characters',
      detail: 'Runs such as "aaa" or "111" add length but almost no unpredictability.',
      bitsPenalty: 10,
      severity: 'medium',
    })
  }

  if (hasAscendingRun(password, 4) || hasDescendingRun(password, 4)) {
    findings.push({
      id: 'sequence',
      label: 'Sequential characters',
      detail: 'Sequences such as "abcd", "1234" or "9876" are among the first things tried.',
      bitsPenalty: 12,
      severity: 'medium',
    })
  }

  if (hasKeyboardWalk(password, 5)) {
    findings.push({
      id: 'keyboard',
      label: 'Keyboard pattern',
      detail: 'Walks such as "qwerty" or "asdfgh" follow the keyboard layout and are easy to guess.',
      bitsPenalty: 12,
      severity: 'medium',
    })
  }

  const word = containsCommonWord(password)
  if (word) {
    findings.push({
      id: 'dictionary',
      label: 'Contains a common word',
      detail: `The word "${word}" is in every dictionary attack word list.`,
      bitsPenalty: 8,
      severity: 'low',
    })
  }

  if (/\d{4}$/.test(password)) {
    findings.push({
      id: 'trailing-year',
      label: 'Ends with four digits',
      detail:
        'A trailing year or date is a very common pattern and is tried automatically before random guessing.',
      bitsPenalty: 6,
      severity: 'low',
    })
  }

  return findings
}

/* -------------------------------------------------------------------------- */
/* Entropy and crack time                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Estimated entropy in bits.
 *
 * Starts from `length × log2(poolSize)` and subtracts the pattern penalties.
 * A known-breached password is capped at 8 bits regardless of length.
 */
export function estimateEntropyBits(password: string): number {
  if (password === '') return 0
  const charset = analyzeCharset(password)
  if (charset.poolSize === 0) return 0

  let bits = password.length * Math.log2(charset.poolSize)

  for (const finding of detectPatterns(password)) {
    bits -= finding.bitsPenalty
  }

  if (isCommonPassword(password)) bits = Math.min(bits, 8)

  return Math.max(0, Math.round(bits * 10) / 10)
}

/** Number of guesses an attacker would need on average (half the search space). */
export function estimateGuesses(password: string): number {
  const bits = estimateEntropyBits(password)
  if (bits <= 0) return 1
  // 2^bits is the full space; half of it is the average number of guesses.
  return Math.pow(2, bits - 1)
}

/** Seconds to exhaust the search space at a given guess rate. */
export function crackTimeSeconds(guesses: number, guessesPerSecond: number): number {
  if (guessesPerSecond <= 0) return Number.POSITIVE_INFINITY
  return guesses / guessesPerSecond
}

/** Each entry is the length of ONE of that unit, in seconds. */
const UNITS: ReadonlyArray<{ seconds: number; singular: string; plural: string }> = [
  { seconds: 1, singular: 'second', plural: 'seconds' },
  { seconds: 60, singular: 'minute', plural: 'minutes' },
  { seconds: 60 * 60, singular: 'hour', plural: 'hours' },
  { seconds: 60 * 60 * 24, singular: 'day', plural: 'days' },
  { seconds: 60 * 60 * 24 * 30, singular: 'month', plural: 'months' },
  { seconds: 60 * 60 * 24 * 365, singular: 'year', plural: 'years' },
]

/**
 * Turn a number of seconds into a readable duration.
 *
 * The largest unit that fits is used, so 90 seconds becomes "1.5 minutes"
 * rather than "90 seconds". Above a thousand years the answer is rounded to
 * something a person can picture ("about 12 thousand years", "about 5 billion
 * years") and beyond the age of the universe it says so.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'essentially forever'
  if (seconds < 1) return 'instantly'

  // Largest unit whose size is <= the duration.
  let chosen = UNITS[0]
  for (const unit of UNITS) {
    if (seconds >= unit.seconds) chosen = unit
  }

  const value = seconds / chosen.seconds

  if (value < 10) {
    const rounded = Math.round(value * 10) / 10
    return `${rounded} ${rounded === 1 ? chosen.singular : chosen.plural}`
  }

  if (value < 1000) {
    const rounded = Math.round(value)
    return `${rounded} ${rounded === 1 ? chosen.singular : chosen.plural}`
  }

  if (chosen.singular === 'year') {
    if (value >= 1e9) {
      const billions = Math.round(value / 1e9)
      if (billions >= 14) return 'longer than the universe has existed'
      return `about ${billions} billion years`
    }
    const thousands = Math.round(value / 1000)
    return `about ${thousands} thousand years`
  }

  const thousands = Math.round(value / 1000)
  return `about ${thousands} thousand ${chosen.plural}`
}

/* -------------------------------------------------------------------------- */
/* Attack scenarios                                                           */
/* -------------------------------------------------------------------------- */

export interface AttackScenario {
  id: string
  label: string
  /** Guesses per second this scenario assumes. */
  guessesPerSecond: number
  detail: string
}

/**
 * Realistic guess rates. These are order-of-magnitude figures for the *offline*
 * case where an attacker has stolen a hash; the online rate is the one that
 * matters when a service rate-limits login attempts.
 */
export const ATTACK_SCENARIOS: readonly AttackScenario[] = [
  {
    id: 'online',
    label: 'Online, rate-limited',
    guessesPerSecond: 10,
    detail: 'An attacker trying to log in over the internet, throttled to about 10 guesses a second.',
  },
  {
    id: 'online-fast',
    label: 'Online, unthrottled',
    guessesPerSecond: 1_000,
    detail: 'A service with no rate limiting, so guesses can be sent as fast as the network allows.',
  },
  {
    id: 'offline-slow',
    label: 'Offline, slow hash',
    guessesPerSecond: 10_000,
    detail: 'A stolen password file using a deliberately slow hash such as bcrypt or Argon2.',
  },
  {
    id: 'offline-fast',
    label: 'Offline, fast hash',
    guessesPerSecond: 10_000_000_000,
    detail: 'A stolen password file using MD5, SHA-1 or SHA-256 — billions of guesses a second on one GPU.',
  },
]

/* -------------------------------------------------------------------------- */
/* Overall analysis                                                           */
/* -------------------------------------------------------------------------- */

export type StrengthLevel = 'empty' | 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'

export interface StrengthBand {
  level: StrengthLevel
  label: string
  /** 0–4, used for the meter width. */
  score: number
  /** Tailwind classes for the meter fill and the label. */
  tone: string
}

export interface CrackEstimate {
  scenario: AttackScenario
  seconds: number
  human: string
}

export interface PasswordAnalysis {
  password: string
  charset: CharsetInfo
  patterns: PatternFinding[]
  entropyBits: number
  guesses: number
  band: StrengthBand
  estimates: CrackEstimate[]
  advice: string[]
}

function bandFor(bits: number, password: string): StrengthBand {
  if (password === '') {
    return { level: 'empty', label: 'Nothing entered', score: 0, tone: 'text-muted' }
  }
  if (bits < 28) {
    return { level: 'very-weak', label: 'Very weak', score: 0, tone: 'text-danger' }
  }
  if (bits < 40) {
    return { level: 'weak', label: 'Weak', score: 1, tone: 'text-danger' }
  }
  if (bits < 60) {
    return { level: 'fair', label: 'Fair', score: 2, tone: 'text-warning' }
  }
  if (bits < 90) {
    return { level: 'strong', label: 'Strong', score: 3, tone: 'text-success' }
  }
  return { level: 'very-strong', label: 'Very strong', score: 4, tone: 'text-success' }
}

/** Concrete, ordered suggestions for making this particular password better. */
export function strengthAdvice(password: string, analysis: {
  charset: CharsetInfo
  patterns: PatternFinding[]
}): string[] {
  if (password === '') return []

  const advice: string[] = []
  const { charset, patterns } = analysis
  const ids = new Set(patterns.map((pattern) => pattern.id))

  if (ids.has('common')) {
    advice.push(
      'Stop using this password anywhere. It is in public breach lists, so changing a character or two is not enough.',
    )
  }
  if (password.length < 12) {
    advice.push(
      `Make it longer — it is ${password.length} character${password.length === 1 ? '' : 's'}. Length matters more than complexity; aim for 16 or more.`,
    )
  }
  if (!charset.upper) advice.push('Add uppercase letters.')
  if (!charset.digits) advice.push('Add digits.')
  if (!charset.symbols) advice.push('Add symbols such as ! ? # or -.')
  if (ids.has('repeat')) advice.push('Break up the repeated characters — they add length but not strength.')
  if (ids.has('sequence')) advice.push('Avoid sequences such as "abcd", "1234" or "9876".')
  if (ids.has('keyboard')) advice.push('Avoid keyboard walks such as "qwerty" or "asdfgh".')
  if (ids.has('dictionary')) advice.push('Avoid whole dictionary words, even with letters swapped for symbols.')
  if (ids.has('trailing-year')) advice.push('Avoid ending with a year or date.')

  if (advice.length === 0) {
    advice.push(
      'This looks strong. The real risks now are reusing it on another site, or a breach at the site that stores it — use a password manager and unique passwords everywhere.',
    )
  }

  return advice
}

/** Run every check and return the full picture. */
export function analyzePassword(password: string): PasswordAnalysis {
  const charset = analyzeCharset(password)
  const patterns = detectPatterns(password)
  const entropyBits = estimateEntropyBits(password)
  const guesses = estimateGuesses(password)

  const estimates: CrackEstimate[] = ATTACK_SCENARIOS.map((scenario) => {
    const seconds = crackTimeSeconds(guesses, scenario.guessesPerSecond)
    return { scenario, seconds, human: formatDuration(seconds) }
  })

  return {
    password,
    charset,
    patterns,
    entropyBits,
    guesses,
    band: bandFor(entropyBits, password),
    estimates,
    advice: strengthAdvice(password, { charset, patterns }),
  }
}
