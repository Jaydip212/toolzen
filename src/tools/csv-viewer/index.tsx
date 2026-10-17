import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox, Select, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import { CSV_DELIMITERS, MAX_DISPLAY_ROWS, cellType, delimiterName, describeTable, normalisedCsv, viewCsv } from './logic'

const SAMPLE = 'name,role,joined,active\nAda Lovelace,Engineer,2024-01-15,true\nAlan Turing,Researcher,2023-11-02,true\nGrace Hopper,"Rear Admiral, USN",2022-06-30,false'

export function CsvViewerTool() {
  const [text, setText] = useState('')
  const [delimiter, setDelimiter] = useState('auto')
  const [hasHeader, setHasHeader] = useState(true)
  const [fileError, setFileError] = useState<string | null>(null)

  const table = useMemo(
    () => viewCsv(text, { delimiter, hasHeader, maxRows: MAX_DISPLAY_ROWS }),
    [text, delimiter, hasHeader],
  )

  async function loadFile(files: File[]) {
    const file = files[0]
    if (!file) return
    setFileError(null)
    try {
      setText(await file.text())
    } catch {
      setFileError('That file could not be read as text. It may not be a CSV file.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Load a CSV file"
        description="Read locally with the File API. Nothing is uploaded."
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
          hint="Or click to browse. You can also paste directly below."
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
            <option value="auto">Detect automatically</option>
            {CSV_DELIMITERS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Select>
          <Checkbox
            label="First row is a header"
            hint="Turn this off to see every row as data, with generated column names."
            checked={hasHeader}
            onChange={(event) => setHasHeader(event.target.checked)}
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

      {table.totalRows > 0 || table.headers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Rows" value={formatNumber(table.totalRows)} />
            <StatTile label="Columns" value={table.columns} />
            <StatTile label="Delimiter" value={<span className="text-base">{delimiterName(table.delimiter)}</span>} />
            <StatTile
              label="Showing"
              value={formatNumber(table.rows.length)}
              hint={table.truncated ? `first ${MAX_DISPLAY_ROWS} of ${table.totalRows}` : 'all rows'}
            />
          </div>

          <ToolPanel
            title="Table"
            description={describeTable(table)}
            actions={
              <DownloadButton
                filename="normalised.csv"
                text={normalisedCsv(table)}
                mimeType="text/csv"
                label="Download CSV"
              />
            }
          >
            {table.truncated && (
              <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3 text-xs leading-relaxed text-muted">
                <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
                Showing the first {MAX_DISPLAY_ROWS} rows to keep the page responsive. The download
                contains every row that was parsed.
              </p>
            )}

            <div className="max-h-[32rem] overflow-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-line bg-surface-2">
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">
                      #
                    </th>
                    {table.headers.map((header, index) => (
                      <th
                        key={`${header}:${index}`}
                        scope="col"
                        className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-fg"
                      >
                        {header === '' ? <span className="italic text-muted">(empty)</span> : header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-line last:border-b-0 hover:bg-surface-2/40">
                      <td className="px-3 py-1.5 text-xs tabular-nums text-muted">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => {
                        const kind = cellType(cell)
                        return (
                          <td
                            key={cellIndex}
                            className={`whitespace-nowrap px-3 py-1.5 text-xs ${
                              kind === 'number' ? 'text-right tabular-nums' : ''
                            } ${kind === 'empty' ? 'text-muted' : 'text-fg'}`}
                          >
                            {kind === 'empty' ? '—' : cell}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolPanel>
        </>
      ) : (
        <EmptyState
          icon="table"
          title="No CSV loaded"
          description="Drop a file or paste some rows. Quoted fields, embedded newlines and CRLF line endings are all handled correctly."
          action={
            <Button variant="secondary" onClick={() => setText(SAMPLE)}>
              Load a sample
            </Button>
          }
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        The download writes RFC 4180 CSV with CRLF line endings, which is what Excel expects. Fields
        containing the delimiter, a quote or a newline are quoted.{' '}
        <Badge variant="outline">no upload</Badge>
      </p>
    </div>
  )
}

export default CsvViewerTool
