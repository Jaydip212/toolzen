import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox, Select, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, OutputArea, SegmentedControl, ToolPanel } from '@/tools/shared'
import { formatBytes, formatNumber } from '@/lib/utils'
import { CSV_DELIMITERS } from '@/lib/csv'
import { csvToJson, jsonSize, renamedHeaders, type CsvJsonMode } from './logic'

const SAMPLE = 'name,role,joined\nAda Lovelace,Engineer,2024-01-15\nAlan Turing,Researcher,2023-11-02'

export function CsvToJsonTool() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<CsvJsonMode>('objects')
  const [delimiter, setDelimiter] = useState('auto')
  const [pretty, setPretty] = useState(true)
  const [fileError, setFileError] = useState<string | null>(null)

  const result = useMemo(
    () => csvToJson(text, { mode, delimiter, pretty }),
    [text, mode, delimiter, pretty],
  )

  const renamed = useMemo(() => {
    if (mode !== 'objects' || text.trim() === '') return []
    const firstLine = text.split(/\r?\n/)[0]
    return renamedHeaders(firstLine.split(delimiter === 'auto' ? ',' : delimiter))
  }, [text, mode, delimiter])

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
        title="Load a CSV file"
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
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          label="Drop a CSV or TSV file"
          onFiles={(files) => void loadFile(files)}
        />
      </ToolPanel>

      {fileError && <ErrorState title="Could not read that file" message={fileError} />}

      <ToolPanel title="Options">
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl
            label="Output shape"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'objects', label: 'Objects', title: 'First row supplies the keys' },
              { value: 'arrays', label: 'Arrays', title: 'Every row becomes an array' },
            ]}
          />
          <Select
            label="Delimiter"
            value={delimiter}
            containerClassName="w-40"
            onChange={(event) => setDelimiter(event.target.value)}
          >
            <option value="auto">Detect automatically</option>
            {CSV_DELIMITERS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>
          <Checkbox
            label="Pretty-print"
            hint="Indented JSON is easier to read; compact JSON is smaller."
            checked={pretty}
            onChange={(event) => setPretty(event.target.checked)}
          />
        </div>
      </ToolPanel>

      <Textarea
        label="CSV"
        rows={8}
        value={text}
        placeholder={SAMPLE}
        className="font-mono text-xs"
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
      />

      {result.error && <ErrorState title="Could not convert that CSV" message={result.error} />}

      {renamed.length > 0 && !result.error && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3 text-xs leading-relaxed text-muted">
          <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>
            Duplicate or empty headers were renamed so no column is lost:{' '}
            {renamed.map((change) => (
              <code key={change.to} className="mr-1 rounded bg-surface px-1 py-0.5 font-mono text-fg">
                {change.from === '' ? '(empty)' : change.from} → {change.to}
              </code>
            ))}
          </span>
        </p>
      )}

      {result.json !== '' && !result.error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Rows" value={formatNumber(result.rows)} />
            <StatTile label="Columns" value={result.columns} />
            <StatTile label="JSON size" value={formatBytes(jsonSize(result.json))} />
            <StatTile label="Shape" value={<span className="text-base">{mode === 'objects' ? 'objects' : 'arrays'}</span>} />
          </div>

          <OutputArea
            label="JSON"
            value={result.json}
            filename="data.json"
            mimeType="application/json"
            rows={14}
            actions={
              <DownloadButton filename="data.json" text={result.json} mimeType="application/json" label="Download" />
            }
          />
        </>
      )}

      {text.trim() === '' && (
        <EmptyState
          icon="table"
          title="No CSV yet"
          description="Drop a file or paste rows. In object mode the first row becomes the keys; in array mode every row is kept as-is."
          action={
            <Button variant="secondary" onClick={() => setText(SAMPLE)}>
              Load a sample
            </Button>
          }
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Every value stays a string, because CSV has no types. A column of numbers becomes a column of
        strings — convert them after parsing if you need real numbers.{' '}
        <Badge variant="outline">no type guessing</Badge>
      </p>
    </div>
  )
}

export default CsvToJsonTool
