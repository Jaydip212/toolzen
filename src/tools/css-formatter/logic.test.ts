import { describe, expect, it } from 'vitest'
import { DEFAULT_CSS_OPTIONS, byteLength, formatCss, minifyCss, savingPercent } from './logic'

describe('formatCss', () => {
  it('indents declarations', () => {
    const out = formatCss('a{color:red}', DEFAULT_CSS_OPTIONS)
    expect(out).toContain('a {')
    expect(out).toContain('\n  color: red')
  })

  it('honours the indent size', () => {
    const out = formatCss('a{color:red}', { ...DEFAULT_CSS_OPTIONS, indentSize: 4 })
    expect(out).toContain('\n    color: red')
  })

  it('can indent with tabs', () => {
    const out = formatCss('a{color:red}', { ...DEFAULT_CSS_OPTIONS, useTabs: true })
    expect(out).toContain('\n\tcolor: red')
  })

  it('returns an empty string for blank input', () => {
    expect(formatCss('  ', DEFAULT_CSS_OPTIONS)).toBe('')
  })

  it('handles at-rules and nested blocks', () => {
    const out = formatCss('@media (max-width:640px){.a{padding:1rem}}', DEFAULT_CSS_OPTIONS)
    expect(out).toContain('@media')
    expect(out).toContain('padding: 1rem')
  })

  it('does not throw on malformed CSS', () => {
    expect(() => formatCss('a{color:', DEFAULT_CSS_OPTIONS)).not.toThrow()
  })
})

describe('minifyCss', () => {
  it('removes comments', () => {
    expect(minifyCss('/* note */a{color:red}')).toBe('a{color:red}')
  })

  it('removes whitespace around structural punctuation', () => {
    expect(minifyCss('a {\n  color: red;\n}')).toBe('a{color:red}')
  })

  it('drops the final semicolon in a block', () => {
    expect(minifyCss('a{color:red;}')).toBe('a{color:red}')
  })

  it('collapses combinators', () => {
    expect(minifyCss('a > b + c ~ d { color: red }')).toBe('a>b+c~d{color:red}')
  })

  it('never alters whitespace inside string literals', () => {
    const out = minifyCss('.a{content:"a  b   c"}')
    expect(out).toContain('"a  b   c"')
  })

  it('never alters whitespace inside single-quoted strings', () => {
    const out = minifyCss(".a{content:'x  y'}")
    expect(out).toContain("'x  y'")
  })

  it('keeps comments that appear inside strings', () => {
    const out = minifyCss('.a{content:"/* not a comment */"}')
    expect(out).toContain('"/* not a comment */"')
  })

  it('handles escaped quotes inside strings', () => {
    const out = minifyCss('.a{content:"say \\"hi\\"  there"}')
    expect(out).toContain('say \\"hi\\"  there')
  })

  it('preserves media queries', () => {
    const out = minifyCss('@media (max-width: 640px) { .a { padding: 1rem } }')
    expect(out).toContain('@media (max-width:640px)')
  })

  it('returns an empty string for blank input', () => {
    expect(minifyCss('   ')).toBe('')
  })

  it('reduces the byte size of ordinary stylesheets', () => {
    const source = '/* c */\na {\n  color: red;\n  padding: 1rem;\n}\n'
    expect(byteLength(minifyCss(source))).toBeLessThan(byteLength(source))
  })
})

describe('savingPercent', () => {
  it('reports the reduction', () => {
    expect(savingPercent('aaaa', 'aa')).toBe(50)
  })

  it('returns zero for empty input', () => {
    expect(savingPercent('', 'x')).toBe(0)
  })
})
