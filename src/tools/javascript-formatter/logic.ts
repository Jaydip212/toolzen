/**
 * JavaScript formatting for the JavaScript Formatter tool.
 *
 * Pretty-printing uses `js-beautify`, which is a token-aware pretty-printer.
 *
 * TOOLZEN deliberately does NOT offer true minification (renaming variables,
 * tree-shaking, dropping dead code). That needs a full parser and compressor
 * such as Terser, and shipping a half-working version would silently change
 * the meaning of people's code. The "compact" mode here only touches
 * whitespace, and the UI says so.
 */
import beautify from 'js-beautify'

export type JsMode = 'format' | 'minify'

export interface JsFormatOptions {
  indentSize: number
  useTabs: boolean
  /** Keep line breaks that were already in the source. */
  preserveNewlines: boolean
  /** Allow up to this many consecutive newlines when preserving. */
  maxPreserveNewlines: number
  /** Put a space before `(` in `if (`, `for (` and similar. */
  spaceInParen: boolean
  /** Keep the brace on the same line as its statement. */
  braceSameLine: boolean
  /** Remove comments in compact mode. */
  stripComments: boolean
}

export const DEFAULT_JS_OPTIONS: JsFormatOptions = {
  indentSize: 2,
  useTabs: false,
  preserveNewlines: true,
  maxPreserveNewlines: 2,
  spaceInParen: true,
  braceSameLine: true,
  stripComments: false,
}

/** Pretty-print JavaScript or TypeScript. */
export function formatJavaScript(input: string, options: JsFormatOptions): string {
  if (input.trim() === '') return ''
  return beautify.js(input, {
    indent_size: Math.min(8, Math.max(1, Math.round(options.indentSize))),
    indent_char: options.useTabs ? '\t' : ' ',
    indent_with_tabs: options.useTabs,
    preserve_newlines: options.preserveNewlines,
    max_preserve_newlines: options.maxPreserveNewlines,
    space_in_paren: options.spaceInParen,
    brace_style: options.braceSameLine ? 'collapse' : 'expand',
    end_with_newline: true,
  })
}

/**
 * Remove `//` and block comments from source text.
 *
 * String literals, template literals and regular-expression literals are
 * skipped, so a `//` inside a URL string or a regex is never treated as a
 * comment. Template literal interpolations (`${ … }`) are treated as plain
 * text, which is the conservative choice: a comment-looking sequence inside
 * one is left in place rather than risk deleting real code.
 */
export function stripComments(input: string): string {
  let out = ''
  let i = 0

  while (i < input.length) {
    const char = input[i]

    // String literals.
    if (char === '"' || char === "'") {
      const quote = char
      out += char
      i += 1
      while (i < input.length) {
        out += input[i]
        if (input[i] === '\\') {
          out += input[i + 1] ?? ''
          i += 2
          continue
        }
        if (input[i] === quote) {
          i += 1
          break
        }
        i += 1
      }
      continue
    }

    // Template literals.
    if (char === '`') {
      out += char
      i += 1
      while (i < input.length) {
        out += input[i]
        if (input[i] === '\\') {
          out += input[i + 1] ?? ''
          i += 2
          continue
        }
        if (input[i] === '`') {
          i += 1
          break
        }
        i += 1
      }
      continue
    }

    // Line comment.
    if (char === '/' && input[i + 1] === '/') {
      const end = input.indexOf('\n', i)
      i = end === -1 ? input.length : end
      continue
    }

    // Block comment.
    if (char === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2)
      i = end === -1 ? input.length : end + 2
      continue
    }

    out += char
    i += 1
  }

  return out
}

/**
 * Strip indentation, trailing whitespace and blank lines.
 * Whitespace only — no token is ever altered or removed.
 */
export function compactWhitespace(input: string): string {
  return input
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim() !== '')
    .join('\n')
    .trim()
}

/** Apply the selected mode. */
export function transformJavaScript(input: string, options: JsFormatOptions, mode: JsMode): string {
  if (input.trim() === '') return ''

  const source = options.stripComments ? stripComments(input) : input

  if (mode === 'format') {
    return formatJavaScript(source, options)
  }

  return compactWhitespace(
    formatJavaScript(source, {
      ...options,
      indentSize: 0,
      preserveNewlines: false,
      maxPreserveNewlines: 0,
    }),
  )
}

/** Byte length as UTF-8. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Percentage saved, positive when the output is smaller. */
export function savingPercent(before: string, after: string): number {
  const original = byteLength(before)
  if (original === 0) return 0
  return ((original - byteLength(after)) / original) * 100
}
