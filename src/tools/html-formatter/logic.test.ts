import { describe, expect, it } from 'vitest'
import { DEFAULT_HTML_OPTIONS, byteLength, formatHtml, minifyHtml, savingPercent } from './logic'

describe('formatHtml', () => {
  it('indents nested elements', () => {
    const out = formatHtml('<div><p>hi</p></div>', DEFAULT_HTML_OPTIONS)
    expect(out).toContain('<div>')
    expect(out).toContain('\n  <p>hi</p>')
  })

  it('honours the indent size', () => {
    const out = formatHtml('<div><p>hi</p></div>', { ...DEFAULT_HTML_OPTIONS, indentSize: 4 })
    expect(out).toContain('\n    <p>hi</p>')
  })

  it('can indent with tabs', () => {
    const out = formatHtml('<div><p>hi</p></div>', { ...DEFAULT_HTML_OPTIONS, useTabs: true })
    expect(out).toContain('\n\t<p>hi</p>')
  })

  it('returns an empty string for blank input', () => {
    expect(formatHtml('   ', DEFAULT_HTML_OPTIONS)).toBe('')
  })

  it('handles void elements without breaking indentation', () => {
    const out = formatHtml('<div><br><img src="a.png"></div>', DEFAULT_HTML_OPTIONS)
    expect(out).toContain('<br>')
    expect(out).toContain('<img src="a.png">')
  })

  it('keeps doctypes and comments', () => {
    const out = formatHtml('<!doctype html><!-- note --><p>x</p>', DEFAULT_HTML_OPTIONS)
    expect(out).toContain('<!doctype html>')
    expect(out).toContain('<!-- note -->')
  })

  it('does not throw on malformed markup', () => {
    expect(() => formatHtml('<div><p>unclosed', DEFAULT_HTML_OPTIONS)).not.toThrow()
  })
})

describe('minifyHtml', () => {
  it('removes comments', () => {
    expect(minifyHtml('<div><!-- hi --></div>')).toBe('<div></div>')
  })

  it('collapses whitespace between tags', () => {
    expect(minifyHtml('<div>\n  <p>a</p>\n</div>')).toBe('<div><p>a</p></div>')
  })

  it('collapses repeated spaces inside text', () => {
    expect(minifyHtml('<p>a    b</p>')).toBe('<p>a b</p>')
  })

  it('preserves <pre> content exactly', () => {
    const pre = '<pre>  a\n   b  </pre>'
    expect(minifyHtml(`<div>\n${pre}\n</div>`)).toContain(pre)
  })

  it('preserves <textarea> content exactly', () => {
    const textarea = '<textarea>  keep   this  </textarea>'
    expect(minifyHtml(`<div>${textarea}</div>`)).toContain(textarea)
  })

  it('preserves <script> content exactly', () => {
    const script = '<script>\n  const a = 1;\n</script>'
    expect(minifyHtml(`<div>${script}</div>`)).toContain(script)
  })

  it('preserves <style> content exactly', () => {
    const style = '<style>\n  a { color: red }\n</style>'
    expect(minifyHtml(`<div>${style}</div>`)).toContain(style)
  })

  it('keeps downlevel-hidden conditional comments', () => {
    expect(minifyHtml('<!--[if IE]>x<![endif]-->')).toContain('[if IE]')
  })

  it('handles multiple preserved blocks', () => {
    const out = minifyHtml('<pre>a  b</pre><div>  </div><script>  c  </script>')
    expect(out).toContain('<pre>a  b</pre>')
    expect(out).toContain('<script>  c  </script>')
  })

  it('returns an empty string for blank input', () => {
    expect(minifyHtml('   ')).toBe('')
  })

  it('never grows the input for ordinary markup', () => {
    const source = '<div>\n    <p>hello</p>\n</div>'
    expect(byteLength(minifyHtml(source))).toBeLessThanOrEqual(byteLength(source))
  })
})

describe('byteLength and savingPercent', () => {
  it('counts UTF-8 bytes rather than characters', () => {
    expect(byteLength('é')).toBe(2)
    expect(byteLength('abc')).toBe(3)
  })

  it('reports a positive saving for a smaller output', () => {
    expect(savingPercent('aaaa', 'aa')).toBe(50)
  })

  it('reports a negative value when the output grows', () => {
    expect(savingPercent('aa', 'aaaa')).toBe(-100)
  })

  it('returns zero for empty input', () => {
    expect(savingPercent('', 'anything')).toBe(0)
  })
})
