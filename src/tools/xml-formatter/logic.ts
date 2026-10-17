export interface XmlError {
  message: string
  line: number | null
  column: number | null
}

export interface XmlResult {
  ok: boolean
  output: string
  error: XmlError | null
}

export interface XmlStats {
  elements: number
  attributes: number
  comments: number
  maxDepth: number
  bytes: number
  lines: number
}

/** Tokenise markup into tags, text and comments without building a DOM. */
type Token =
  | { kind: 'declaration'; text: string }
  | { kind: 'comment'; text: string }
  | { kind: 'cdata'; text: string }
  | { kind: 'doctype'; text: string }
  | { kind: 'open'; text: string; name: string }
  | { kind: 'close'; text: string; name: string }
  | { kind: 'self'; text: string; name: string }
  | { kind: 'text'; text: string }

const NAME = /^<\s*\/?\s*([^\s/>]+)/

/**
 * Split markup into tokens.
 *
 * This is deliberately a lexer, not a parser: it preserves the original text
 * of every tag so formatting never rewrites attributes or entity references.
 */
export function tokenizeXml(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const next = input.indexOf('<', index)
    if (next === -1) {
      tokens.push({ kind: 'text', text: input.slice(index) })
      break
    }
    if (next > index) {
      tokens.push({ kind: 'text', text: input.slice(index, next) })
    }

    if (input.startsWith('<!--', next)) {
      const end = input.indexOf('-->', next + 4)
      const stop = end === -1 ? input.length : end + 3
      tokens.push({ kind: 'comment', text: input.slice(next, stop) })
      index = stop
      continue
    }

    if (input.startsWith('<![CDATA[', next)) {
      const end = input.indexOf(']]>', next + 9)
      const stop = end === -1 ? input.length : end + 3
      tokens.push({ kind: 'cdata', text: input.slice(next, stop) })
      index = stop
      continue
    }

    if (input.startsWith('<?', next)) {
      const end = input.indexOf('?>', next + 2)
      const stop = end === -1 ? input.length : end + 2
      tokens.push({ kind: 'declaration', text: input.slice(next, stop) })
      index = stop
      continue
    }

    if (input.startsWith('<!', next)) {
      const end = input.indexOf('>', next + 2)
      const stop = end === -1 ? input.length : end + 1
      tokens.push({ kind: 'doctype', text: input.slice(next, stop) })
      index = stop
      continue
    }

    // A normal tag: find the closing '>' while respecting quoted attributes.
    let cursor = next + 1
    let quote: string | null = null
    while (cursor < input.length) {
      const character = input[cursor]
      if (quote !== null) {
        if (character === quote) quote = null
      } else if (character === '"' || character === "'") {
        quote = character
      } else if (character === '>') {
        break
      }
      cursor += 1
    }

    const stop = Math.min(cursor + 1, input.length)
    const text = input.slice(next, stop)
    const nameMatch = NAME.exec(text)
    const name = nameMatch ? nameMatch[1] : ''

    if (text.startsWith('</')) tokens.push({ kind: 'close', text, name })
    else if (text.endsWith('/>')) tokens.push({ kind: 'self', text, name })
    else tokens.push({ kind: 'open', text, name })

    index = stop
  }

  return tokens
}

/**
 * Re-indent markup.
 *
 * An element whose entire content is text stays on one line, so
 * `<title>Hello</title>` does not become three lines. Everything else is
 * broken across lines by depth. Mixed content — text interleaved with child
 * elements, as in `<p>Hello <b>world</b></p>` — is split across lines, which
 * adds whitespace between the words. That is harmless for data XML but visible
 * in XHTML, so the tool says so rather than pretending otherwise.
 */
export function formatXml(text: string, indent: string = '  '): string {
  const tokens = tokenizeXml(text)
  const lines: string[] = []
  let depth = 0
  let index = 0

  while (index < tokens.length) {
    const token = tokens[index]

    if (token.kind === 'text') {
      const value = token.text.replace(/\s+/g, ' ').trim()
      if (value !== '') lines.push(`${indent.repeat(depth)}${value}`)
      index += 1
      continue
    }

    // open + text + matching close → keep on one line.
    if (token.kind === 'open') {
      const textToken = tokens[index + 1]
      const closeToken = tokens[index + 2]
      if (
        textToken?.kind === 'text' &&
        closeToken?.kind === 'close' &&
        closeToken.name === token.name &&
        textToken.text.trim() !== ''
      ) {
        const value = textToken.text.replace(/\s+/g, ' ').trim()
        lines.push(`${indent.repeat(depth)}${token.text}${value}${closeToken.text}`)
        index += 3
        continue
      }
      lines.push(`${indent.repeat(depth)}${token.text}`)
      depth += 1
      index += 1
      continue
    }

    if (token.kind === 'close') {
      depth = Math.max(0, depth - 1)
      lines.push(`${indent.repeat(depth)}${token.text}`)
      index += 1
      continue
    }

    lines.push(`${indent.repeat(depth)}${token.text}`)
    index += 1
  }

  return lines.join('\n')
}

/**
 * Remove whitespace between tags and collapse it inside text.
 *
 * Whitespace inside `<pre>`, `<textarea>`, `<script>` and `<style>` is left
 * exactly as it was, because there it is significant.
 */
export function minifyXml(text: string): string {
  const tokens = tokenizeXml(text)
  let result = ''
  let inPreserving = 0

  for (const token of tokens) {
    if (token.kind === 'text') {
      result += inPreserving > 0 ? token.text : token.text.replace(/\s+/g, ' ').trim()
      continue
    }
    if (token.kind === 'open' && /^(pre|textarea|script|style)$/i.test(token.name)) inPreserving += 1
    if (token.kind === 'close' && /^(pre|textarea|script|style)$/i.test(token.name)) {
      inPreserving = Math.max(0, inPreserving - 1)
    }
    result += token.text
  }

  return result.trim()
}

/**
 * Check well-formedness with the browser's XML parser.
 *
 * Returns `null` when the document parses, or an error with the parser's own
 * message. `DOMParser` reports the position in a human-readable string.
 */
export function validateXml(text: string): XmlError | null {
  if (text.trim() === '') return null
  if (typeof DOMParser === 'undefined') return null

  const document = new DOMParser().parseFromString(text, 'application/xml')
  const failure = document.querySelector('parsererror')
  if (!failure) return null

  const message = (failure.textContent ?? 'The XML is not well-formed.').trim()
  const position = /line (\d+).*?column (\d+)/i.exec(message)
  return {
    message: message.split('\n')[0],
    line: position ? Number(position[1]) : null,
    column: position ? Number(position[2]) : null,
  }
}

/** Count elements, attributes, comments and nesting depth. */
export function xmlStats(text: string): XmlStats {
  const tokens = tokenizeXml(text)
  let elements = 0
  let attributes = 0
  let comments = 0
  let depth = 0
  let maxDepth = 0

  for (const token of tokens) {
    if (token.kind === 'comment') comments += 1
    if (token.kind === 'open') {
      elements += 1
      depth += 1
      maxDepth = Math.max(maxDepth, depth)
    }
    if (token.kind === 'self') {
      elements += 1
      // A self-closing element still occupies its own nesting level.
      maxDepth = Math.max(maxDepth, depth + 1)
    }
    if (token.kind === 'close') depth = Math.max(0, depth - 1)
    if (token.kind === 'open' || token.kind === 'self') {
      attributes += (token.text.match(/\s+[A-Za-z_:][\w:.-]*\s*=/g) ?? []).length
    }
  }

  return {
    elements,
    attributes,
    comments,
    maxDepth,
    bytes: new TextEncoder().encode(text).length,
    lines: text === '' ? 0 : text.split('\n').length,
  }
}

/** True when the text looks like XML rather than HTML. */
export function looksLikeXml(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<')
}
