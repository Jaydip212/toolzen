import { describe, expect, it } from 'vitest'
import { escapeHtml, markdownToPlainText, renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, emphasis and code', () => {
    const html = renderMarkdown('# Title\n\n**bold** and `code`')
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
  })

  it('renders tables (GFM)', () => {
    const html = renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })

  it('strips script tags', () => {
    const html = renderMarkdown('hello\n\n<script>window.__pwned = true</script>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('__pwned')
  })

  it('strips inline event handlers', () => {
    const html = renderMarkdown('<img src=x onerror="window.__pwned = true">')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('__pwned')
  })

  it('strips javascript: URLs', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('strips iframes and embedded objects', () => {
    const html = renderMarkdown('<iframe src="https://example.com"></iframe><object></object>')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<object')
  })

  it('marks rendered links as safe to open', () => {
    const html = renderMarkdown('[TOOLZEN](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
    expect(html).toContain('target="_blank"')
  })
})

describe('escapeHtml', () => {
  it('escapes the five significant characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    )
  })
})

describe('markdownToPlainText', () => {
  it('removes heading markers, emphasis and link syntax', () => {
    expect(markdownToPlainText('## Title\n\n**bold** [text](https://x.com)')).toBe(
      'Title\n\nbold text',
    )
  })

  it('drops fenced code blocks', () => {
    expect(markdownToPlainText('before\n\n```js\nconst a = 1\n```\n\nafter')).toBe(
      'before\n\nafter',
    )
  })

  it('removes image syntax', () => {
    expect(markdownToPlainText('![alt](img.png) caption')).toBe('caption')
  })
})
