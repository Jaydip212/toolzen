import { describe, expect, it } from 'vitest'
import {
  countCodeBlocks,
  extractHeadings,
  markdownStats,
  slugify,
  stripFencedCode,
} from './markdown-parse'

describe('stripFencedCode', () => {
  it('removes backtick fenced blocks, including their fence lines', () => {
    expect(stripFencedCode('a\n```\ncode\n```\nb')).toBe('a\nb')
  })

  it('removes tilde fenced blocks', () => {
    expect(stripFencedCode('a\n~~~\ncode\n~~~\nb')).toBe('a\nb')
  })

  it('keeps text after the closing fence', () => {
    expect(stripFencedCode('```\nx\n```\n# Heading')).toBe('# Heading')
  })

  it('keeps content when a fence is never closed', () => {
    expect(stripFencedCode('```\nunclosed')).toBe('')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('drops punctuation', () => {
    expect(slugify('What is TOOLZEN?')).toBe('what-is-toolzen')
  })

  it('collapses repeated separators', () => {
    expect(slugify('a  -  b')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Hello--  ')).toBe('hello')
  })
})

describe('extractHeadings', () => {
  it('extracts ATX headings with their levels', () => {
    const headings = extractHeadings('# One\n\n## Two\n\n### Three')
    expect(headings).toEqual([
      { level: 1, text: 'One', slug: 'one' },
      { level: 2, text: 'Two', slug: 'two' },
      { level: 3, text: 'Three', slug: 'three' },
    ])
  })

  it('ignores hashes inside code blocks', () => {
    const headings = extractHeadings('# Real\n\n```\n# Not a heading\n```')
    expect(headings).toHaveLength(1)
    expect(headings[0].text).toBe('Real')
  })

  it('strips trailing closing hashes', () => {
    expect(extractHeadings('## Title ##')[0].text).toBe('Title')
  })

  it('ignores hashes without a space', () => {
    expect(extractHeadings('#NotAHeading')).toEqual([])
  })

  it('ignores seven-hash lines', () => {
    expect(extractHeadings('####### Too deep')).toEqual([])
  })

  it('returns an empty array for empty input', () => {
    expect(extractHeadings('')).toEqual([])
  })
})

describe('countCodeBlocks', () => {
  it('counts a single block', () => {
    expect(countCodeBlocks('```\nx\n```')).toBe(1)
  })

  it('counts multiple blocks', () => {
    expect(countCodeBlocks('```\na\n```\n\ntext\n\n```\nb\n```')).toBe(2)
  })

  it('returns zero when there are no fences', () => {
    expect(countCodeBlocks('just text')).toBe(0)
  })

  it('does not count a fence inside a fence', () => {
    expect(countCodeBlocks('~~~\n```\n~~~')).toBe(1)
  })
})

describe('markdownStats', () => {
  it('counts words, characters and lines', () => {
    const stats = markdownStats('one two\nthree')
    expect(stats.words).toBe(3)
    expect(stats.characters).toBe(13)
    expect(stats.lines).toBe(2)
  })

  it('counts headings', () => {
    expect(markdownStats('# a\n\n## b').headings).toBe(2)
  })

  it('counts links and images separately', () => {
    const stats = markdownStats('[a](https://x.com) ![b](i.png)')
    expect(stats.links).toBe(1)
    expect(stats.images).toBe(1)
  })

  it('ignores links and headings inside code blocks', () => {
    const stats = markdownStats('```\n# not a heading\n[x](y)\n```')
    expect(stats.headings).toBe(0)
    expect(stats.links).toBe(0)
    expect(stats.codeBlocks).toBe(1)
  })

  it('reports zero words for empty input', () => {
    expect(markdownStats('').words).toBe(0)
  })

  it('reports zero lines for empty input', () => {
    expect(markdownStats('').lines).toBe(0)
  })
})
