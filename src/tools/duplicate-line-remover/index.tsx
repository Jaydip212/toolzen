import { useMemo, useState } from 'react'
import { Checkbox, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, SegmentedControl, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import { DEFAULT_DEDUPE_OPTIONS, removeDuplicateLines, type DedupeOptions } from './logic'

const SAMPLE = `apple
banana
apple
Cherry
banana
date
apple
Date`

export function DuplicateLineRemoverTool() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<DedupeOptions>(DEFAULT_DEDUPE_OPTIONS)

  const result = useMemo(() => removeDuplicateLines(input, options), [input, options])
  const hasInput = input.trim().length > 0

  return (
    <div className="flex flex-col gap-6">
      <Textarea
        label="Your list"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste one item per line…"
        rows={10}
        spellCheck={false}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setInput(SAMPLE)}>
          <Icon name="list" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOptions(DEFAULT_DEDUPE_OPTIONS)}
          disabled={JSON.stringify(options) === JSON.stringify(DEFAULT_DEDUPE_OPTIONS)}
        >
          <Icon name="refresh" size={16} />
          Reset options
        </Button>
      </div>

      <ToolPanel title="Matching rules">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <SegmentedControl
            label="Which copy to keep"
            value={options.keep}
            onChange={(keep) => setOptions((current) => ({ ...current, keep }))}
            options={[
              { value: 'first', label: 'Keep first', title: 'Keep the earliest occurrence of each line.' },
              { value: 'last', label: 'Keep last', title: 'Keep the latest occurrence of each line.' },
            ]}
          />
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Checkbox
              label="Case sensitive"
              hint="When off, “Apple” and “apple” count as duplicates."
              checked={options.caseSensitive}
              onChange={(event) =>
                setOptions((c) => ({ ...c, caseSensitive: event.target.checked }))
              }
            />
            <Checkbox
              label="Ignore surrounding spaces"
              hint="Compare lines after trimming, so “ apple” matches “apple”."
              checked={options.trimLines}
              onChange={(event) => setOptions((c) => ({ ...c, trimLines: event.target.checked }))}
            />
            <Checkbox
              label="Keep blank lines"
              hint="Never remove or count empty lines as duplicates."
              checked={options.ignoreBlankLines}
              onChange={(event) =>
                setOptions((c) => ({ ...c, ignoreBlankLines: event.target.checked }))
              }
            />
          </div>
        </div>
      </ToolPanel>

      {hasInput ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Lines in" value={formatNumber(result.totalLines)} />
            <StatTile label="Lines out" value={formatNumber(result.outputLines)} />
            <StatTile label="Removed" value={formatNumber(result.removedCount)} />
            <StatTile
              label="Duplicate groups"
              hint="distinct values seen more than once"
              value={formatNumber(result.duplicateGroups)}
            />
          </div>

          <OutputArea
            label="De-duplicated list"
            value={result.text}
            filename="unique-lines.txt"
            rows={10}
          />
        </>
      ) : (
        <EmptyState
          icon="list"
          title="No lines to check yet"
          description="Paste a list above — one item per line — and duplicates are removed instantly."
          action={
            <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
              Load sample
            </Button>
          }
        />
      )}
    </div>
  )
}

export default DuplicateLineRemoverTool
