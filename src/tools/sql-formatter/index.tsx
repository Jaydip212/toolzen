import { useCallback, useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import {
  DEFAULT_SQL_OPTIONS,
  SQL_DIALECTS,
  formatSql,
  minifySql,
  type KeywordCase,
  type SqlDialect,
  type SqlFormatOptions,
} from './logic'

const SAMPLE = `-- TOOLZEN example
select t.id, t.name, count(o.id) as order_count, sum(o.total) as revenue
from tools t left join orders o on o.tool_id = t.id
where t.status = 'live' and t.added_at >= '2026-01-01'
group by t.id, t.name having count(o.id) > 0
order by revenue desc limit 25;`

export function SqlFormatterTool() {
  const [options, setOptions] = useState<SqlFormatOptions>(DEFAULT_SQL_OPTIONS)

  const format = useCallback((text: string) => formatSql(text, options), [options])
  const minify = useCallback((text: string) => minifySql(text), [])

  function update<K extends keyof SqlFormatOptions>(key: K, value: SqlFormatOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <CodeFormatter
      language="SQL"
      icon="database"
      placeholder="Paste your SQL here…"
      sample={SAMPLE}
      filename="formatted.sql"
      mimeType="application/sql;charset=utf-8"
      format={format}
      minify={minify}
      minifyNote="Minify removes comments and collapses whitespace. Text inside string literals and quoted identifiers is preserved exactly, so no value or column name is altered."
      optionsPanel={
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <Select
            label="Dialect"
            value={options.dialect}
            hint="Affects quoting and keyword parsing."
            onChange={(event) => update('dialect', event.target.value as SqlDialect)}
          >
            {SQL_DIALECTS.map((dialect) => (
              <option key={dialect.id} value={dialect.id}>
                {dialect.label}
              </option>
            ))}
          </Select>
          <Select
            label="Keyword case"
            value={options.keywordCase}
            onChange={(event) => update('keywordCase', event.target.value as KeywordCase)}
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Leave as typed</option>
          </Select>
          <Input
            label="Indent size"
            type="number"
            min={1}
            max={8}
            value={options.indentSize}
            disabled={options.useTabs}
            hint="Spaces per indent level (1–8)."
            onChange={(event) => update('indentSize', Number(event.target.value))}
          />
        </div>
      }
    />
  )
}

export default SqlFormatterTool
