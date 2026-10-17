/**
 * CSS formatting for the CSS Formatter tool.
 * Beautifying uses `js-beautify`; minifying is a conservative whitespace
 * collapse that never touches string literals.
 */
import beautify from 'js-beautify'

export interface CssFormatOptions {
  indentSize: number
  useTabs: boolean
  /** Put each selector on its own line when it has several. */
  selectorSeparatorNewline: boolean
  /** Add a newline between rules. */
  newlineBetweenRules: boolean
}

export const DEFAULT_CSS_OPTIONS: CssFormatOptions = {
  indentSize: 2,
  useTabs: false,
  selectorSeparatorNewline: true,
  newlineBetweenRules: true,
}

/** Pretty-print CSS with consistent indentation. */
export function formatCss(input: string, options: CssFormatOptions): string {
  if (input.trim() === '') return ''
  return beautify.css(input, {
    indent_size: Math.min(8, Math.max(1, Math.round(options.indentSize))),
    indent_char: options.useTabs ? '\t' : ' ',
    indent_with_tabs: options.useTabs,
    selector_separator_newline: options.selectorSeparatorNewline,
    newline_between_rules: options.newlineBetweenRules,
    end_with_newline: true,
  })
}

/** Split a stylesheet into string literals and everything else. */
function mapOutsideStrings(input: string, transform: (chunk: string) => string): string {
  const parts: string[] = []
  let buffer = ''
  let quote: string | null = null

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (quote) {
      buffer += char
      if (char === '\\') {
        // Keep the escaped character verbatim.
        buffer += input[i + 1] ?? ''
        i += 1
      } else if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      buffer += char
      continue
    }
    parts.push(buffer)
    buffer = ''
    // Collect the run of non-string characters up to the next quote.
    let j = i
    while (j < input.length && input[j] !== '"' && input[j] !== "'") j += 1
    parts.push(transform(input.slice(i, j)))
    i = j - 1
  }
  parts.push(buffer)
  return parts.join('')
}

/**
 * Reduce whitespace in CSS.
 *
 * Comments are removed and whitespace around structural punctuation is
 * collapsed. String literals (for example `content: "a  b"`) are left
 * completely alone, so no declaration is corrupted.
 */
export function minifyCss(input: string): string {
  if (input.trim() === '') return ''

  // Remove comments first, but not inside strings.
  const withoutComments = mapOutsideStrings(input, (chunk) =>
    chunk.replace(/\/\*[\s\S]*?\*\//g, ''),
  )

  return mapOutsideStrings(withoutComments, (chunk) =>
    chunk
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};:,>~+])\s*/g, '$1')
      .replace(/;}/g, '}'),
  ).trim()
}

/** Byte length as UTF-8. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Percentage saved by minifying, positive when the output is smaller. */
export function savingPercent(before: string, after: string): number {
  const original = byteLength(before)
  if (original === 0) return 0
  return ((original - byteLength(after)) / original) * 100
}
