/**
 * HTML formatting for the HTML Formatter tool.
 *
 * Beautifying is delegated to `js-beautify`, which is a mature, widely used
 * HTML pretty-printer. Minifying is a conservative whitespace collapse written
 * here — see `minifyHtml` for exactly what it does and does not remove.
 */
import beautify from 'js-beautify'

export interface HtmlFormatOptions {
  indentSize: number
  useTabs: boolean
  /** Wrap long lines at this column. 0 disables wrapping. */
  wrapLineLength: number
  /** Keep line breaks that were already in the source. */
  preserveNewlines: boolean
  /** Allow up to this many consecutive newlines when preserving. */
  maxPreserveNewlines: number
}

export const DEFAULT_HTML_OPTIONS: HtmlFormatOptions = {
  indentSize: 2,
  useTabs: false,
  wrapLineLength: 0,
  preserveNewlines: false,
  maxPreserveNewlines: 2,
}

/** Pretty-print HTML with consistent indentation. */
export function formatHtml(input: string, options: HtmlFormatOptions): string {
  if (input.trim() === '') return ''
  return beautify.html(input, {
    indent_size: Math.min(8, Math.max(1, Math.round(options.indentSize))),
    indent_char: options.useTabs ? '\t' : ' ',
    indent_with_tabs: options.useTabs,
    wrap_line_length: options.wrapLineLength,
    preserve_newlines: options.preserveNewlines,
    max_preserve_newlines: options.maxPreserveNewlines,
    end_with_newline: true,
  })
}

/** Elements whose inner text must never have its whitespace altered. */
const RAW_TEXT_ELEMENTS = /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi

/**
 * Reduce whitespace in HTML.
 *
 * This is deliberately conservative: it removes HTML comments (except
 * downlevel-hidden conditional comments), collapses whitespace that sits
 * between tags, and squeezes runs of spaces. It does NOT remove optional
 * quotes, rewrite boolean attributes, shorten colours or rename ids — those
 * need a real minifier, and pretending otherwise would risk breaking pages.
 *
 * `<pre>`, `<textarea>`, `<script>` and `<style>` contents are preserved
 * byte-for-byte.
 */
export function minifyHtml(input: string): string {
  if (input.trim() === '') return ''

  // Lift raw-text elements out so their whitespace survives untouched.
  const preserved: string[] = []
  const guarded = input.replace(RAW_TEXT_ELEMENTS, (match) => {
    preserved.push(match)
    return `\u0000${preserved.length - 1}\u0000`
  })

  const collapsed = guarded
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return collapsed.replace(/\u0000(\d+)\u0000/g, (_, index: string) => preserved[Number(index)])
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
