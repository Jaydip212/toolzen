/**
 * Pure helpers for the Markdown Previewer.
 *
 * Headings and links are counted outside fenced code blocks, so a code sample
 * containing `#` or `[text](url)` does not distort the statistics.
 */

export interface MarkdownHeading {
  /** 1 for `#`, 2 for `##`, and so on. */
  level: number
  text: string
  /** GitHub-style anchor id derived from the heading text. */
  slug: string
}

export interface MarkdownStats {
  words: number
  characters: number
  lines: number
  headings: number
  links: number
  images: number
  codeBlocks: number
}

/** Remove fenced code blocks (``` or ~~~) from the source. */
export function stripFencedCode(source: string): string {
  const kept: string[] = []
  let fenceChar: string | null = null

  for (const line of source.split('\n')) {
    const match = line.match(/^\s*(`{3,}|~{3,})/)
    if (match) {
      const char = match[1][0]
      if (fenceChar === null) {
        fenceChar = char
        continue
      }
      if (char === fenceChar) {
        fenceChar = null
        continue
      }
    }
    if (fenceChar === null) kept.push(line)
  }

  return kept.join('\n')
}

/** Turn heading text into a URL-safe anchor. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Extract ATX headings (`# Heading`) outside code blocks. */
export function extractHeadings(source: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  for (const line of stripFencedCode(source).split('\n')) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (!match) continue
    const text = match[2].trim()
    if (text === '') continue
    headings.push({ level: match[1].length, text, slug: slugify(text) })
  }
  return headings
}

/** Count opening fences, which equals the number of code blocks. */
export function countCodeBlocks(source: string): number {
  let blocks = 0
  let fenceChar: string | null = null
  for (const line of source.split('\n')) {
    const match = line.match(/^\s*(`{3,}|~{3,})/)
    if (!match) continue
    const char = match[1][0]
    if (fenceChar === null) {
      fenceChar = char
      blocks += 1
    } else if (char === fenceChar) {
      fenceChar = null
    }
  }
  return blocks
}

/** Summary statistics for the previewer sidebar. */
export function markdownStats(source: string): MarkdownStats {
  const body = stripFencedCode(source)
  const trimmed = body.trim()

  const allLinkSyntax = body.match(/\[[^\]]*\]\([^)]*\)/g) ?? []
  const imageSyntax = body.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []

  return {
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    characters: [...source].length,
    lines: source === '' ? 0 : source.split('\n').length,
    headings: extractHeadings(source).length,
    // Image syntax also matches the link pattern, so subtract it.
    links: allLinkSyntax.length - imageSyntax.length,
    images: imageSyntax.length,
    codeBlocks: countCodeBlocks(source),
  }
}
