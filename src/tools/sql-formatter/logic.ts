/**
 * SQL formatting for the SQL Formatter tool.
 *
 * Formatting uses `sql-formatter`, which understands dialects and quotes.
 * Minifying is a whitespace collapse that skips string literals, quoted
 * identifiers and comments so no statement is corrupted.
 */
import { format as formatSqlSource } from 'sql-formatter'

/** Dialects exposed in the UI. */
export const SQL_DIALECTS = [
  { id: 'sql', label: 'Standard SQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'transactsql', label: 'SQL Server (T-SQL)' },
  { id: 'plsql', label: 'Oracle (PL/SQL)' },
  { id: 'bigquery', label: 'BigQuery' },
  { id: 'snowflake', label: 'Snowflake' },
  { id: 'redshift', label: 'Redshift' },
  { id: 'spark', label: 'Spark SQL' },
] as const

export type SqlDialect = (typeof SQL_DIALECTS)[number]['id']

export type KeywordCase = 'upper' | 'lower' | 'preserve'

export interface SqlFormatOptions {
  dialect: SqlDialect
  indentSize: number
  useTabs: boolean
  keywordCase: KeywordCase
  /** Blank lines between separate statements. */
  linesBetweenQueries: number
}

export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = {
  dialect: 'sql',
  indentSize: 2,
  useTabs: false,
  keywordCase: 'upper',
  linesBetweenQueries: 1,
}

export class SqlFormatError extends Error {}

/** Pretty-print a SQL statement. Throws `SqlFormatError` on invalid input. */
export function formatSql(input: string, options: SqlFormatOptions): string {
  if (input.trim() === '') return ''
  try {
    return formatSqlSource(input, {
      language: options.dialect,
      tabWidth: Math.min(8, Math.max(1, Math.round(options.indentSize))),
      useTabs: options.useTabs,
      keywordCase: options.keywordCase,
      linesBetweenQueries: Math.max(0, Math.round(options.linesBetweenQueries)),
    })
  } catch (error) {
    throw new SqlFormatError(
      error instanceof Error ? error.message : 'The SQL could not be parsed.',
    )
  }
}

/** Collapse whitespace in a stretch of SQL that contains no quoted text. */
function collapseSqlWhitespace(text: string): string {
  return (
    text
      .replace(/\s+/g, ' ')
      // Tighten parentheses, commas, semicolons and qualified names.
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s+,/g, ',')
      .replace(/,\s+/g, ',')
      .replace(/\s+;/g, ';')
      .replace(/;\s+/g, ';')
      .replace(/\s+\./g, '.')
      .replace(/\.\s+/g, '.')
  )
}

/**
 * Collapse whitespace in SQL.
 *
 * String literals ('…'), quoted identifiers ("…" and `…`) are lifted out first
 * and copied through byte-for-byte, because collapsing whitespace inside them
 * would change the data or the identifier. Comments are removed. Only the
 * remaining code is whitespace-collapsed.
 */
export function minifySql(input: string): string {
  if (input.trim() === '') return ''

  const segments: { text: string; verbatim: boolean }[] = []
  let code = ''

  const flushCode = () => {
    if (code !== '') {
      segments.push({ text: code, verbatim: false })
      code = ''
    }
  }

  let i = 0
  while (i < input.length) {
    const char = input[i]
    const next = input[i + 1]

    // Single-quoted string literal, where '' is an escaped quote.
    if (char === "'") {
      let literal = char
      i += 1
      while (i < input.length) {
        literal += input[i]
        if (input[i] === "'") {
          if (input[i + 1] === "'") {
            literal += input[i + 1]
            i += 2
            continue
          }
          i += 1
          break
        }
        i += 1
      }
      flushCode()
      segments.push({ text: literal, verbatim: true })
      continue
    }

    // Double-quoted identifier.
    if (char === '"') {
      let quoted = char
      i += 1
      while (i < input.length) {
        quoted += input[i]
        if (input[i] === '"') {
          i += 1
          break
        }
        i += 1
      }
      flushCode()
      segments.push({ text: quoted, verbatim: true })
      continue
    }

    // Backtick identifier (MySQL).
    if (char === '`') {
      let quoted = char
      i += 1
      while (i < input.length) {
        quoted += input[i]
        if (input[i] === '`') {
          i += 1
          break
        }
        i += 1
      }
      flushCode()
      segments.push({ text: quoted, verbatim: true })
      continue
    }

    // Line comment — dropped, leaving a single space in its place.
    if (char === '-' && next === '-') {
      const end = input.indexOf('\n', i)
      i = end === -1 ? input.length : end
      code += ' '
      continue
    }

    // Block comment — dropped.
    if (char === '/' && next === '*') {
      const end = input.indexOf('*/', i + 2)
      i = end === -1 ? input.length : end + 2
      code += ' '
      continue
    }

    code += char
    i += 1
  }

  flushCode()

  return segments
    .map((segment) => (segment.verbatim ? segment.text : collapseSqlWhitespace(segment.text)))
    .join('')
    .replace(/;\s*$/, ';')
    .trim()
}

/** Byte length as UTF-8. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Percentage saved, positive when the output is smaller. */
export function savingPercent(before: string, after: string): number {
  const original = byteLength(before)
  if (original === 0) return 0
  return ((original - byteLength(after)) / original) * 100
}
