import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  CATEGORIES,
  EXTENSION_MAP,
  describeExtension,
  extensionsInCategory,
  isRiskyExtension,
  searchExtensions,
} from './logic'

export function FileExtensionCheckerTool() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  const report = useMemo(() => (input.trim() === '' ? null : describeExtension(input)), [input])
  const results = useMemo(() => searchExtensions(query), [query])

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Check a file extension"
        description="Paste a filename, a full path, or just the extension."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Filename or extension"
            value={input}
            containerClassName="min-w-64 flex-1"
            placeholder="report.pdf, /tmp/photo.png, or jpg"
            spellCheck={false}
            onChange={(event) => setInput(event.target.value)}
          />
          {input !== '' && (
            <Button variant="ghost" size="sm" onClick={() => setInput('')}>
              Clear
            </Button>
          )}
        </div>
      </ToolPanel>

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Extension"
              value={<span className="font-mono text-base">{report.extension === '' ? '—' : `.${report.extension}`}</span>}
            />
            <StatTile
              label="Category"
              value={<span className="text-base">{CATEGORIES.find((entry) => entry.id === report.category)?.label ?? 'Other'}</span>}
            />
            <StatTile
              label="MIME type"
              value={<span className="break-all font-mono text-xs">{report.mime ?? 'unknown'}</span>}
            />
            <StatTile label="In table" value={report.known ? 'Yes' : 'No'} hint={report.known ? undefined : 'no recorded type'} />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm leading-relaxed text-fg">{report.description}</p>
            {report.mime && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{report.mime}</Badge>
                {isRiskyExtension(report.extension) && (
                  <Badge variant="danger">runs code or installs software</Badge>
                )}
                <CopyButton value={report.mime} label="Copy MIME" />
              </div>
            )}
            {isRiskyExtension(report.extension) && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-danger" />
                An extension is only a label. A file can claim <code>.pdf</code> and still be
                something else, and Windows hides extensions by default — which is how
                <code> invoice.pdf.exe</code> reads as a PDF.
              </p>
            )}
          </div>
        </>
      )}

      <ToolPanel
        title="Common extensions"
        description={`${formatNumber(Object.keys(EXTENSION_MAP).length)} entries. Search by extension, description, MIME type or category.`}
        actions={
          <Input
            aria-label="Search extensions"
            value={query}
            placeholder="Search…"
            containerClassName="w-48"
            className="h-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        }
      >
        {results.length === 0 ? (
          <p className="text-sm text-muted">Nothing matches “{query}”.</p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-line bg-surface-2">
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">Ext</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">Category</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">MIME type</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted">Description</th>
                </tr>
              </thead>
              <tbody>
                {results.map((entry) => (
                  <tr
                    key={entry.extension}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface-2/40"
                    onClick={() => setInput(`.${entry.extension}`)}
                  >
                    <td className="px-3 py-1.5 font-mono text-xs text-fg">.{entry.extension}</td>
                    <td className="px-3 py-1.5 text-xs text-muted">
                      {CATEGORIES.find((category) => category.id === entry.info.category)?.label}
                    </td>
                    <td className="break-all px-3 py-1.5 font-mono text-xs text-muted">{entry.info.mime}</td>
                    <td className="px-3 py-1.5 text-xs text-muted">{entry.info.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ToolPanel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.filter((category) => category.id !== 'other').map((category) => (
          <div key={category.id} className="rounded-xl border border-line bg-surface-2/30 p-3">
            <p className="text-sm font-medium text-fg">{category.label}</p>
            <p className="mt-0.5 text-xs text-muted">{category.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {extensionsInCategory(category.id).slice(0, 12).map((extension) => (
                <button
                  key={extension}
                  type="button"
                  onClick={() => setInput(`.${extension}`)}
                  className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-muted transition-colors hover:text-fg"
                >
                  {extension}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!report && (
        <EmptyState
          icon="file"
          title="Enter a filename or extension"
          description="The tool reads the extension, looks up a best-guess MIME type and sorts it into a category. Anything not in the table is reported as unknown rather than guessed."
          action={
            <Button variant="secondary" onClick={() => setInput('report.pdf')}>
              Try report.pdf
            </Button>
          }
        />
      )}
    </div>
  )
}

export default FileExtensionCheckerTool
