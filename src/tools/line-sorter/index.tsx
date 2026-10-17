import { useMemo, useState } from 'react'
import { Checkbox, Select, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, SegmentedControl, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import { DEFAULT_SORT_OPTIONS, sortLines, type SortMode, type SortOptions } from './logic'

const SAMPLE = `banana
Apple
cherry
apple
item10
item2
item1
42
7
100`

const MODES: { value: SortMode; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical (A → Z)' },
  { value: 'natural', label: 'Natural (item2 before item10)' },
  { value: 'numeric', label: 'Numeric (by value)' },
  { value: 'length', label: 'Line length (shortest first)' },
]

export function LineSorterTool() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<SortOptions>(DEFAULT_SORT_OPTIONS)

  const result = useMemo(() => sortLines(input, options), [input, options])
  const hasInput = input.trim().length > 0

  function update<K extends keyof SortOptions>(key: K, value: SortOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

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
          <Icon name="sort" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOptions(DEFAULT_SORT_OPTIONS)}
          disabled={JSON.stringify(options) === JSON.stringify(DEFAULT_SORT_OPTIONS)}
        >
          <Icon name="refresh" size={16} />
          Reset options
        </Button>
      </div>

      <ToolPanel title="Sort settings">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Order by"
              value={options.mode}
              containerClassName="min-w-56 flex-1"
              onChange={(event) => update('mode', event.target.value as SortMode)}
            >
              {MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </Select>
            <SegmentedControl
              label="Direction"
              value={options.direction}
              onChange={(direction) => update('direction', direction)}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
            />
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Checkbox
              label="Case sensitive"
              hint="When off, sorting ignores letter case."
              checked={options.caseSensitive}
              onChange={(event) => update('caseSensitive', event.target.checked)}
            />
            <Checkbox
              label="Trim each line first"
              hint="Remove leading and trailing spaces before sorting."
              checked={options.trimLines}
              onChange={(event) => update('trimLines', event.target.checked)}
            />
            <Checkbox
              label="Remove duplicates"
              hint="Keep only one copy of each line."
              checked={options.removeDuplicates}
              onChange={(event) => update('removeDuplicates', event.target.checked)}
            />
            <Checkbox
              label="Remove empty lines"
              hint="Drop blank lines before sorting."
              checked={options.removeEmptyLines}
              onChange={(event) => update('removeEmptyLines', event.target.checked)}
            />
          </div>
          {options.mode === 'numeric' && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              In numeric mode, lines that are not numbers always stay at the bottom, whichever
              direction you choose.
            </p>
          )}
        </div>
      </ToolPanel>

      {hasInput ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Lines in" value={formatNumber(result.totalLines)} />
            <StatTile label="Lines out" value={formatNumber(result.outputLines)} />
            <StatTile label="Empty removed" value={formatNumber(result.removedEmpty)} />
            <StatTile label="Duplicates removed" value={formatNumber(result.removedDuplicates)} />
          </div>

          <OutputArea label="Sorted list" value={result.text} filename="sorted-lines.txt" rows={10} />
        </>
      ) : (
        <EmptyState
          icon="sort"
          title="Nothing to sort yet"
          description="Paste a list above — one item per line — and it is sorted as you type."
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

export default LineSorterTool
