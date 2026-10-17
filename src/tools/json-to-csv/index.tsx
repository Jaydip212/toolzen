import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox, Select, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, OutputArea, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import { CSV_DELIMITERS } from '@/lib/csv'
import { jsonToCsv } from './logic'

const SAMPLE = `[
  { "name": "Ada Lovelace", "role": "Engineer", "joined": "2024-01-15" },
  { "name": "Alan Turing", "role": "Researcher", "joined": "2023-11-02", "active": true }
]`

export function JsonToCsvTool() {
  const [text, setText] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [header, setHeader] = useState(true)
  const [fileError, setFileError] = useState<string | null>(null)

  const result = useMemo(() => jsonToCsv(text, { delimiter, header }), [text, delimiter, header])

  async function loadFile(files: File[]) {
    const file = files[0]
    if (!file) return
    setFileError(null)
    try {
      setText(await file.text())
    } catch {
      setFileError('That file could not be read as text.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Load a JSON file"
        description="Read locally. Nothing is uploaded."
        actions={
          text !== '' ? (
            <Button variant="ghost" size="sm" onClick={() => setText('')}>
              <Icon name="trash" size={16} />
              Clear
            </Button>
          ) : undefined
        }
      >
        <FileDrop
          accept=".json,.txt,application/json,text/plain"
          label="Drop a .json file"
          onFiles={(files) => void loadFile(files)}
        />
      </ToolPanel>

      {fileError && <ErrorState title="Could not read that file" message={fileError} />}

      <ToolPanel title="Options">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Delimiter"
            value={delimiter}
            containerClassName="w-40"
            onChange={(event) => setDelimiter(event.target.value)}
          >
            {CSV_DELIMITERS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>
          <Checkbox
            label="Include a header row"
            hint="The keys of the first object become the column names."
            checked={header}
            onChange={(event) => setHeader(event.target.checked)}
          />
        </div>
      </ToolPanel>

      <Textarea
        label="JSON"
        rows={10}
        value={text}
        placeholder={SAMPLE}
        className="font-mono text-xs"
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
      />

      {result.error && <ErrorState title="Could not convert that JSON" message={result.error} />}

      {result.csv !== '' && !result.error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Rows" value={formatNumber(result.rows)} />
            <StatTile label="Columns" value={result.columns} />
            <StatTile label="Delimiter" value={<span className="text-base">{delimiter === '\t' ? 'Tab' : delimiter}</span>} />
            <StatTile label="Header" value={header ? 'Yes' : 'No'} />
          </div>

          <OutputArea
            label="CSV"
            value={result.csv}
            filename="data.csv"
            mimeType="text/csv"
            rows={12}
            actions={<DownloadButton filename="data.csv" text={result.csv} mimeType="text/csv" label="Download" />}
          />
        </>
      )}

      {text.trim() === '' && (
        <EmptyState
          icon="braces"
          title="No JSON yet"
          description="Paste an array of objects, an array of arrays, or a single object. Nested values are written as JSON inside the cell rather than being flattened into invented column names."
          action={
            <Button variant="secondary" onClick={() => setText(SAMPLE)}>
              Load a sample
            </Button>
          }
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        A nested object becomes a JSON string in one cell. That is deliberate: flattening would create
        column names such as <code>address.city</code> that you did not ask for, and would silently
        change shape if one record had an extra field.{' '}
        <Badge variant="outline">RFC 4180 quoting</Badge>
      </p>
    </div>
  )
}

export default JsonToCsvTool
