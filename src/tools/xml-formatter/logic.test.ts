import { describe, expect, it } from 'vitest'

import {
  formatXml,
  looksLikeXml,
  minifyXml,
  tokenizeXml,
  validateXml,
  xmlStats,
} from './logic'

describe('tokenizeXml', () => {
  it('splits tags and text', () => {
    const tokens = tokenizeXml('<a>hi</a>')
    expect(tokens.map((token) => token.kind)).toEqual(['open', 'text', 'close'])
  })

  it('recognises a self-closing tag', () => {
    expect(tokenizeXml('<br/>')[0].kind).toBe('self')
  })

  it('recognises a declaration', () => {
    expect(tokenizeXml('<?xml version="1.0"?>')[0].kind).toBe('declaration')
  })

  it('recognises a comment', () => {
    expect(tokenizeXml('<!-- note -->')[0].kind).toBe('comment')
  })

  it('recognises CDATA', () => {
    expect(tokenizeXml('<![CDATA[a < b]]>')[0].kind).toBe('cdata')
  })

  it('does not split on a > inside an attribute value', () => {
    const tokens = tokenizeXml('<a title="1 > 0">x</a>')
    expect(tokens[0].kind).toBe('open')
    expect(tokens[0].text).toBe('<a title="1 > 0">')
  })

  it('does not split on a > inside single quotes', () => {
    expect(tokenizeXml("<a title='1 > 0'/>")[0].text).toBe("<a title='1 > 0'/>")
  })

  it('extracts the element name', () => {
    const token = tokenizeXml('<ns:item id="1"/>')[0]
    expect(token.kind === 'self' && token.name).toBe('ns:item')
  })

  it('returns an empty list for empty input', () => {
    expect(tokenizeXml('')).toEqual([])
  })

  it('handles an unclosed comment gracefully', () => {
    const tokens = tokenizeXml('<!-- open')
    expect(tokens).toHaveLength(1)
  })
})

describe('formatXml', () => {
  it('indents nested elements', () => {
    expect(formatXml('<a><b>1</b></a>')).toBe('<a>\n  <b>1</b>\n</a>')
  })

  it('keeps a text-only element on one line', () => {
    expect(formatXml('<a><b>hello</b></a>')).toBe('<a>\n  <b>hello</b>\n</a>')
  })

  it('uses the requested indent', () => {
    expect(formatXml('<a><b/></a>', '\t')).toBe('<a>\n\t<b/>\n</a>')
  })

  it('places the declaration at the top with no indent', () => {
    expect(formatXml('<?xml version="1.0"?><a/>')).toBe('<?xml version="1.0"?>\n<a/>')
  })

  it('indents comments', () => {
    expect(formatXml('<a><!-- x --><b/></a>')).toBe('<a>\n  <!-- x -->\n  <b/>\n</a>')
  })

  it('collapses whitespace inside text', () => {
    expect(formatXml('<a>hello     world</a>')).toBe('<a>hello world</a>')
  })

  it('does not change attribute text', () => {
    const output = formatXml('<a href="x?a=1&amp;b=2"/>')
    expect(output).toContain('href="x?a=1&amp;b=2"')
  })

  it('handles an empty string', () => {
    expect(formatXml('')).toBe('')
  })

  it('is idempotent on its own output', () => {
    const once = formatXml('<a><b><c>1</c></b></a>')
    expect(formatXml(once)).toBe(once)
  })
})

describe('minifyXml', () => {
  it('removes whitespace between tags', () => {
    expect(minifyXml('<a>\n  <b>1</b>\n</a>')).toBe('<a><b>1</b></a>')
  })

  it('preserves text content', () => {
    expect(minifyXml('<a>hello</a>')).toBe('<a>hello</a>')
  })

  it('preserves whitespace inside pre', () => {
    const minified = minifyXml('<pre>  keep   this  </pre>')
    expect(minified).toBe('<pre>  keep   this  </pre>')
  })

  it('preserves whitespace inside script', () => {
    const minified = minifyXml('<script>  var a = 1;  </script>')
    expect(minified).toContain('  var a = 1;  ')
  })

  it('handles an empty string', () => {
    expect(minifyXml('')).toBe('')
  })

  it('keeps attributes intact', () => {
    expect(minifyXml('<a  id="x" >t</a>')).toContain('id="x"')
  })
})

describe('validateXml', () => {
  it('accepts a well-formed document', () => {
    expect(validateXml('<a><b/></a>')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(validateXml('   ')).toBeNull()
  })

  it('reports a mismatched tag', () => {
    const error = validateXml('<a><b></a></b>')
    expect(error).not.toBeNull()
  })

  it('reports an unclosed element', () => {
    expect(validateXml('<a><b>')).not.toBeNull()
  })

  it('accepts a declaration plus a root', () => {
    expect(validateXml('<?xml version="1.0"?><root/>')).toBeNull()
  })

  it('extracts a line number when the parser reports one', () => {
    const error = validateXml('<a>\n<b>\n</a>')
    if (error && error.line !== null) expect(error.line).toBeGreaterThan(0)
  })
})

describe('xmlStats', () => {
  it('counts elements', () => {
    expect(xmlStats('<a><b/><c/></a>').elements).toBe(3)
  })

  it('counts attributes', () => {
    expect(xmlStats('<a x="1" y="2"/>').attributes).toBe(2)
  })

  it('counts comments', () => {
    expect(xmlStats('<!-- a --><!-- b --><x/>').comments).toBe(2)
  })

  it('reports max depth', () => {
    expect(xmlStats('<a><b><c/></b></a>').maxDepth).toBe(3)
  })

  it('counts bytes as UTF-8', () => {
    expect(xmlStats('<é/>').bytes).toBe(5)
  })

  it('handles empty input', () => {
    expect(xmlStats('')).toEqual({ elements: 0, attributes: 0, comments: 0, maxDepth: 0, bytes: 0, lines: 0 })
  })
})

describe('looksLikeXml', () => {
  it('accepts a declaration', () => {
    expect(looksLikeXml('<?xml version="1.0"?><a/>')).toBe(true)
  })

  it('accepts a bare root element', () => {
    expect(looksLikeXml('<a/>')).toBe(true)
  })

  it('accepts a doctype', () => {
    expect(looksLikeXml('<!DOCTYPE html><html></html>')).toBe(true)
  })

  it('rejects plain text', () => {
    expect(looksLikeXml('hello')).toBe(false)
  })
})
