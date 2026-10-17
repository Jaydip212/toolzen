/**
 * Pure text-cleanup helpers for the Text Formatter tool.
 * Kept free of React so every rule can be unit tested directly.
 */

export interface TextFormatOptions {
  /** Trim leading and trailing whitespace from each line. */
  trimLines: boolean
  /** Replace runs of two or more spaces with a single space. */
  collapseSpaces: boolean
  /** Delete every blank line. Takes precedence over `collapseBlankLines`. */
  removeBlankLines: boolean
  /** Reduce runs of blank lines to a single blank line. */
  collapseBlankLines: boolean
  /** Convert tab characters to spaces. */
  tabsToSpaces: boolean
  /** Number of spaces each tab becomes. */
  tabSize: number
  /** Trim leading and trailing whitespace from the whole document. */
  trimDocument: boolean
}

export const DEFAULT_FORMAT_OPTIONS: TextFormatOptions = {
  trimLines: true,
  collapseSpaces: false,
  removeBlankLines: false,
  collapseBlankLines: true,
  tabsToSpaces: false,
  tabSize: 4,
  trimDocument: true,
}

/** Normalise CRLF and lone CR to LF so every rule can assume `\n`. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n')
}

/** Clamp the tab size into a sane range. */
function clampTabSize(size: number): number {
  if (!Number.isFinite(size)) return 4
  return Math.min(16, Math.max(1, Math.round(size)))
}

/**
 * Apply the selected cleanup rules in a fixed order:
 * newlines → tabs → per-line trim → collapse spaces → blank lines → document trim.
 */
export function formatText(input: string, options: TextFormatOptions): string {
  let text = normalizeNewlines(input)

  if (options.tabsToSpaces) {
    text = text.replace(/\t/g, ' '.repeat(clampTabSize(options.tabSize)))
  }

  let lines = text.split('\n')
  if (options.trimLines) lines = lines.map((line) => line.trim())
  if (options.collapseSpaces) lines = lines.map((line) => line.replace(/[ ]{2,}/g, ' '))
  text = lines.join('\n')

  if (options.removeBlankLines) {
    text = text
      .split('\n')
      .filter((line) => line.trim() !== '')
      .join('\n')
  } else if (options.collapseBlankLines) {
    text = text.replace(/\n{3,}/g, '\n\n')
  }

  if (options.trimDocument) text = text.trim()

  return text
}

export interface TextStats {
  lines: number
  nonBlankLines: number
  blankLines: number
  words: number
  characters: number
  bytes: number
}

/** Summary statistics shown alongside the formatted output. */
export function textStats(text: string): TextStats {
  const lines = text === '' ? [] : text.split('\n')
  const nonBlank = lines.filter((line) => line.trim() !== '')
  return {
    lines: lines.length,
    nonBlankLines: nonBlank.length,
    blankLines: lines.length - nonBlank.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    characters: [...text].length,
    bytes: new TextEncoder().encode(text).length,
  }
}

/** How much smaller the output is than the input, as a percentage. */
export function sizeReduction(input: string, output: string): number {
  const before = new TextEncoder().encode(input).length
  if (before === 0) return 0
  const after = new TextEncoder().encode(output).length
  return ((before - after) / before) * 100
}
