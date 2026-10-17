import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SQL_OPTIONS,
  SqlFormatError,
  byteLength,
  formatSql,
  minifySql,
  savingPercent,
} from './logic'

describe('formatSql', () => {
  it('puts major keywords on their own lines', () => {
    const out = formatSql('select a from t where x = 1', DEFAULT_SQL_OPTIONS)
    expect(out).toMatch(/SELECT/i)
    expect(out.split('\n').length).toBeGreaterThan(2)
  })

  it('uppercases keywords by default', () => {
    const out = formatSql('select a from t', DEFAULT_SQL_OPTIONS)
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM')
  })

  it('can lowercase keywords', () => {
    const out = formatSql('SELECT a FROM t', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'lower' })
    expect(out).toContain('select')
    expect(out).not.toContain('SELECT')
  })

  it('can preserve keyword case', () => {
    const out = formatSql('SeLeCt a FROM t', { ...DEFAULT_SQL_OPTIONS, keywordCase: 'preserve' })
    expect(out).toContain('SeLeCt')
  })

  it('accepts a dialect', () => {
    const out = formatSql('select `a` from `t`', { ...DEFAULT_SQL_OPTIONS, dialect: 'mysql' })
    expect(out).toContain('`a`')
  })

  it('returns an empty string for blank input', () => {
    expect(formatSql('   ', DEFAULT_SQL_OPTIONS)).toBe('')
  })

  it('throws SqlFormatError on unparseable input', () => {
    expect(() => formatSql('select from where )))', DEFAULT_SQL_OPTIONS)).toThrow(SqlFormatError)
  })

  it('keeps string literals intact', () => {
    const out = formatSql("select * from t where s = 'a  b'", DEFAULT_SQL_OPTIONS)
    expect(out).toContain("'a  b'")
  })
})

describe('minifySql', () => {
  it('collapses whitespace', () => {
    expect(minifySql('select  a\n  from   t')).toBe('select a from t')
  })

  it('removes line comments', () => {
    expect(minifySql('select a -- note\nfrom t')).toBe('select a from t')
  })

  it('removes block comments', () => {
    expect(minifySql('select a /* note */ from t')).toBe('select a from t')
  })

  it('preserves whitespace inside string literals', () => {
    expect(minifySql("select 'a   b' from t")).toContain("'a   b'")
  })

  it('preserves doubled quotes as an escaped quote', () => {
    expect(minifySql("select 'it''s' from t")).toContain("'it''s'")
  })

  it('preserves double-quoted identifiers', () => {
    expect(minifySql('select "my  col" from t')).toContain('"my  col"')
  })

  it('preserves backtick identifiers', () => {
    expect(minifySql('select `my  col` from t')).toContain('`my  col`')
  })

  it('does not treat a minus inside a literal as a comment', () => {
    expect(minifySql("select '--x' from t")).toContain("'--x'")
  })

  it('keeps parentheses tight', () => {
    expect(minifySql('select count( id ) from t')).toContain('count(id)')
  })

  it('returns an empty string for blank input', () => {
    expect(minifySql('   ')).toBe('')
  })

  it('reduces the byte size of a formatted query', () => {
    const formatted = 'SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1'
    expect(byteLength(minifySql(formatted))).toBeLessThan(byteLength(formatted))
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
