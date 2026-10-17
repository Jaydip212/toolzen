import { useMemo, useState } from 'react'
import { Checkbox, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { CopyButton } from '@/components/ui/CopyButton'
import { SegmentedControl, ToolPanel } from '@/tools/shared'
import { cn, formatNumber } from '@/lib/utils'
import {
  DEFAULT_DIFF_OPTIONS,
  MAX_DIFF_LINES,
  diffStats,
  diffText,
  isDiffTooLarge,
  toSideBySide,
  toUnifiedDiff,
  type DiffOptions,
  type SideBySideCell,
} from '@/lib/diff'

type ViewMode = 'side-by-side' | 'unified'

const LEFT_SAMPLE = `TOOLZEN
Every tool in one place
Free to use
Sign up required`

const RIGHT_SAMPLE = `TOOLZEN
Every tool in one place
Free to use, no account needed
Runs in your browser`

/** One cell in the side-by-side view. */
function DiffCell({ cell, side }: { cell?: SideBySideCell; side: 'left' | 'right' }) {
  if (!cell) {
    return <div className="bg-surface-2/60" aria-hidden="true" />
  }
  return (
    <div
      className={cn(
        'flex min-w-0 gap-2 px-2 py-0.5',
        cell.type === 'delete' && 'bg-danger/10',
        cell.type === 'insert' && 'bg-success/10',
      )}
    >
      <span
        className={cn(
          'w-8 shrink-0 select-none text-right tabular-nums',
          cell.type === 'delete' ? 'text-danger' : cell.type === 'insert' ? 'text-success' : 'text-muted',
        )}
      >
        {cell.number}
      </span>
      <span
        className={cn(
          'whitespace-pre-wrap break-all',
          cell.type === 'equal' && 'text-muted',
        )}
      >
        {cell.line === '' ? '\u00a0' : cell.line}
      </span>
      <span className="sr-only">
        {cell.type === 'delete' ? 'removed from' : cell.type === 'insert' ? 'added to' : 'unchanged in'}{' '}
        {side} text
      </span>
    </div>
  )
}

export function TextComparisonTool() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [options, setOptions] = useState<DiffOptions>(DEFAULT_DIFF_OPTIONS)
  const [view, setView] = useState<ViewMode>('side-by-side')

  const tooLarge = isDiffTooLarge(left, right)
  const hasBoth = left.trim().length > 0 && right.trim().length > 0

  const ops = useMemo(
    () => (tooLarge || !hasBoth ? [] : diffText(left, right, options)),
    [left, right, options, tooLarge, hasBoth],
  )
  const stats = useMemo(() => diffStats(ops), [ops])
  const rows = useMemo(() => toSideBySide(ops), [ops])
  const unified = useMemo(
    () => (ops.length === 0 ? '' : toUnifiedDiff(ops)),
    [ops],
  )

  function loadSample() {
    setLeft(LEFT_SAMPLE)
    setRight(RIGHT_SAMPLE)
  }

  function clear() {
    setLeft('')
    setRight('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          label="Original text"
          value={left}
          onChange={(event) => setLeft(event.target.value)}
          placeholder="Paste the first version here…"
          rows={9}
          spellCheck={false}
        />
        <Textarea
          label="Changed text"
          value={right}
          onChange={(event) => setRight(event.target.value)}
          placeholder="Paste the second version here…"
          rows={9}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={loadSample}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" onClick={clear} disabled={!left && !right}>
          <Icon name="trash" size={16} />
          Clear both
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOptions(DEFAULT_DIFF_OPTIONS)}
          disabled={options.ignoreCase === false && options.ignoreWhitespace === false}
        >
          <Icon name="refresh" size={16} />
          Reset options
        </Button>
      </div>

      <ToolPanel title="Comparison options">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="flex flex-col gap-3">
            <Checkbox
              label="Ignore letter case"
              hint="Treat “Hello” and “hello” as the same line."
              checked={options.ignoreCase}
              onChange={(event) => setOptions((c) => ({ ...c, ignoreCase: event.target.checked }))}
            />
            <Checkbox
              label="Ignore whitespace"
              hint="Ignore leading, trailing and repeated spaces when matching lines."
              checked={options.ignoreWhitespace}
              onChange={(event) =>
                setOptions((c) => ({ ...c, ignoreWhitespace: event.target.checked }))
              }
            />
          </div>
          <SegmentedControl
            label="View mode"
            value={view}
            onChange={setView}
            options={[
              { value: 'side-by-side', label: 'Side by side' },
              { value: 'unified', label: 'Unified' },
            ]}
          />
        </div>
      </ToolPanel>

      {tooLarge && (
        <ErrorState
          title="That is too much text to compare at once"
          message={`Each side is limited to ${formatNumber(MAX_DIFF_LINES)} lines so the comparison stays instant. Split the text into smaller parts and compare them one at a time.`}
        />
      )}

      {!tooLarge && hasBoth && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Lines added" value={formatNumber(stats.added)} />
            <StatTile label="Lines removed" value={formatNumber(stats.removed)} />
            <StatTile label="Unchanged" value={formatNumber(stats.unchanged)} />
          </div>

          {stats.changed ? (
            <ToolPanel
              title={view === 'side-by-side' ? 'Side-by-side comparison' : 'Unified diff'}
              description={
                view === 'side-by-side'
                  ? 'Lines only on the left were removed; lines only on the right were added.'
                  : 'A standard diff: “−” marks removed lines and “+” marks added lines.'
              }
              actions={view === 'unified' ? <CopyButton value={unified} label="Copy diff" /> : undefined}
            >
              {view === 'side-by-side' ? (
                <div className="tz-scroll max-h-[32rem] overflow-auto rounded-xl border border-line font-mono text-xs">
                  <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <span className="px-3 py-2">Original</span>
                    <span className="border-l border-line px-3 py-2">Changed</span>
                  </div>
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-2 border-b border-line/50 last:border-b-0"
                    >
                      <DiffCell cell={row.left} side="left" />
                      <div className="border-l border-line">
                        <DiffCell cell={row.right} side="right" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="tz-scroll max-h-[32rem] overflow-auto rounded-xl border border-line bg-surface-2/40 p-3 font-mono text-xs leading-relaxed text-fg">
                  {unified}
                </pre>
              )}
            </ToolPanel>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/8 p-4 text-sm">
              <Icon name="circle-check" size={18} className="shrink-0 text-success" />
              <p className="text-fg">
                The two texts are identical under the current comparison options.
              </p>
            </div>
          )}
        </>
      )}

      {!tooLarge && !hasBoth && (
        <EmptyState
          icon="diff"
          title="Add both versions to compare"
          description="Paste the original text on the left and the changed text on the right. Differences are highlighted as you type."
          action={
            <Button variant="secondary" onClick={loadSample}>
              Load sample
            </Button>
          }
        />
      )}
    </div>
  )
}

export default TextComparisonTool
