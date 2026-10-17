import { describe, expect, it } from 'vitest'
import {
  DEFAULT_JS_OPTIONS,
  byteLength,
  compactWhitespace,
  formatJavaScript,
  savingPercent,
  stripComments,
  transformJavaScript,
} from './logic'

describe('formatJavaScript', () => {
  it('indents a function body', () => {
    const out = formatJavaScript('function f(){return 1}', DEFAULT_JS_OPTIONS)
    expect(out).toContain('function f() {')
    expect(out).toContain('\n  return 1')
  })

  it('honours the indent size', () => {
    const out = formatJavaScript('function f(){return 1}', {
      ...DEFAULT_JS_OPTIONS,
      indentSize: 4,
    })
    expect(out).toContain('\n    return 1')
  })

  it('spaces around operators', () => {
    const out = formatJavaScript('const a=1+2', DEFAULT_JS_OPTIONS)
    expect(out).toContain('const a = 1 + 2')
  })

  it('returns an empty string for blank input', () => {
    expect(formatJavaScript('  ', DEFAULT_JS_OPTIONS)).toBe('')
  })

  it('does not throw on malformed source', () => {
    expect(() => formatJavaScript('function f( {', DEFAULT_JS_OPTIONS)).not.toThrow()
  })
})

describe('stripComments', () => {
  it('removes a line comment', () => {
    expect(stripComments('const a = 1 // note')).toBe('const a = 1 ')
  })

  it('removes a block comment', () => {
    expect(stripComments('const a = 1 /* note */ + 2')).toBe('const a = 1  + 2')
  })

  it('keeps // inside a double-quoted string', () => {
    const source = 'const u = "https://example.com"'
    expect(stripComments(source)).toBe(source)
  })

  it('keeps // inside a single-quoted string', () => {
    const source = "const u = 'https://example.com'"
    expect(stripComments(source)).toBe(source)
  })

  it('keeps // inside a template literal', () => {
    const source = 'const u = `https://example.com`'
    expect(stripComments(source)).toBe(source)
  })

  it('keeps a block-comment sequence inside a string', () => {
    const source = 'const s = "/* not a comment */"'
    expect(stripComments(source)).toBe(source)
  })

  it('handles escaped quotes without ending the string early', () => {
    const source = 'const s = "a \\" // still string"'
    expect(stripComments(source)).toBe(source)
  })

  it('removes a comment that runs to the end of the file', () => {
    expect(stripComments('const a = 1\n// trailing')).toBe('const a = 1\n')
  })

  it('removes an unterminated block comment to the end', () => {
    expect(stripComments('const a = 1 /* unterminated')).toBe('const a = 1 ')
  })

  it('keeps a division operator that is not a comment', () => {
    const source = 'const half = 10 / 2'
    expect(stripComments(source)).toBe(source)
  })

  it('handles several comments in one pass', () => {
    expect(stripComments('a // one\nb /* two */ c')).toBe('a \nb  c')
  })
})

describe('compactWhitespace', () => {
  it('removes leading indentation', () => {
    expect(compactWhitespace('    const a = 1')).toBe('const a = 1')
  })

  it('removes trailing whitespace', () => {
    expect(compactWhitespace('const a = 1   ')).toBe('const a = 1')
  })

  it('collapses runs of blank lines', () => {
    expect(compactWhitespace('a\n\n\n\nb')).toBe('a\nb')
  })

  it('trims the whole result', () => {
    expect(compactWhitespace('\n\n  a  \n\n')).toBe('a')
  })
})

describe('transformJavaScript', () => {
  it('formats in format mode', () => {
    const out = transformJavaScript('function f(){return 1}', DEFAULT_JS_OPTIONS, 'format')
    expect(out).toContain('\n  return 1')
  })

  it('removes indentation in minify mode', () => {
    const out = transformJavaScript('function f() {\n  return 1\n}', DEFAULT_JS_OPTIONS, 'minify')
    expect(out).not.toContain('  return')
    expect(out).toContain('return 1')
  })

  it('returns an empty string for blank input in both modes', () => {
    expect(transformJavaScript('  ', DEFAULT_JS_OPTIONS, 'format')).toBe('')
    expect(transformJavaScript('  ', DEFAULT_JS_OPTIONS, 'minify')).toBe('')
  })

  it('never renames identifiers', () => {
    const out = transformJavaScript('const myLongName = 1', DEFAULT_JS_OPTIONS, 'minify')
    expect(out).toContain('myLongName')
  })
})

describe('savingPercent', () => {
  it('reports the reduction', () => {
    expect(savingPercent('aaaa', 'aa')).toBe(50)
  })

  it('returns zero for empty input', () => {
    expect(savingPercent('', 'x')).toBe(0)
  })

  it('measures UTF-8 bytes', () => {
    expect(byteLength('é')).toBe(2)
  })
})
