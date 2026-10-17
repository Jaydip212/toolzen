import { useCallback, useState } from 'react'
import { Checkbox, Select } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import { formatJson, minifyJson, type IndentStyle } from './logic'

const SAMPLE = `{"name":"TOOLZEN","version":2,"free":true,"categories":["text","developer","pdf"],"stats":{"tools":98,"live":33},"tags":null}`

type JsonOutcome = ReturnType<typeof formatJson>

/** Turn a failed parse into an Error the shared shell can display. */
function unwrap(result: JsonOutcome): string {
  if (!result.ok && result.error) {
    const where =
      result.error.line !== null
        ? ` (line ${result.error.line}${result.error.column !== null ? `, column ${result.error.column}` : ''})`
        : ''
    throw new Error(`${result.error.message}${where}`)
  }
  return result.output
}

export function JsonFormatterTool() {
  const [indent, setIndent] = useState<IndentStyle>(2)
  const [sortKeys, setSortKeys] = useState(false)

  const format = useCallback((input: string) => unwrap(formatJson(input, { indent, sortKeys })), [indent, sortKeys])
  const minify = useCallback((input: string) => unwrap(minifyJson(input)), [])

  return (
    <CodeFormatter
      language="JSON"
      placeholder={'{\n  "hello": "world"\n}'}
      sample={SAMPLE}
      filename="formatted.json"
      mimeType="application/json"
      format={format}
      minify={minify}
      icon="braces"
      minifyNote="Minifying removes every optional space and newline. String contents are never touched, so a value containing spaces keeps them."
      optionsPanel={
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Indent"
            value={String(indent)}
            containerClassName="w-32"
            onChange={(event) => {
              const value = event.target.value
              setIndent(value === 'tab' ? 'tab' : (Number(value) as 2 | 4))
            }}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </Select>
          <Checkbox
            label="Sort keys alphabetically"
            hint="Recurses into nested objects. Array order is never changed."
            checked={sortKeys}
            onChange={(event) => setSortKeys(event.target.checked)}
          />
        </div>
      }
    />
  )
}

export default JsonFormatterTool
