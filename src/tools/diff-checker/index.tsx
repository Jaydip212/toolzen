import { useMemo, useState } from 'react'
import { Checkbox, Input, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, OutputArea, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  DEFAULT_DIFF_OPTIONS,
  MAX_DIFF_LINES,
  diffStats,
  diffText,
  isDiffTooLarge,
  toUnifiedDiff,
  type DiffOptions,
} from '@/lib/diff'

const ORIGINAL_SAMPLE = `version: 2
toolzen:
  name: TOOLZEN
  tagline: Every Tool. One Place.
  tools: 3
  categories: 12
  free: true`

const CHANGED_SAMPLE = `version: 3
toolzen:
  name: TOOLZEN
  tagline: Every Tool. One Place.
  tools: 98
  categories: 12
  free: true
  requiresAccount: false`

export function DiffCheckerTool() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [leftName, setLeftName] = useState('original.txt')
  const [rightName, setRightName] = useState('changed.txt')
  const [options, setOptions] = useState<DiffOptions>(DEFAULT_DIFF_OPTIONS)

  const tooLarge = isDiffTooLarge(left, right)
  const hasBoth = left !== '' || right !== ''

  const ops = useMemo(
    () => (tooLarge ? [] : diffText(left, right, options)),
    [left, right, options, tooLarge],
  )
  const stats = useMemo(() => diffStats(ops), [ops])
  const unified = useMemo(
    () => (ops.length === 0 ? '' : toUnifiedDiff(ops, leftName, rightName)),
    [ops, leftName, rightName],
  )

  async function loadFile(side: 'left' | 'right', file: File) {
    const text = await file.text()
    if (side === 'left') {
      setLeft(text)
      setLeftName(file.name)
    } else {
      setRight(text)
      setRightName(file.name)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {(['left', 'right'] as const).map((side) => {
          const value = side === 'left' ? left : right
          const setValue = side === 'left' ? setLeft : setRight
          const name = side === 'left' ? leftName : rightName
          const setName = side === 'left' ? setLeftName : setRightName
          return (
            <div key={side} className="flex flex-col gap-3">
              <Input
                label={side === 'left' ? 'Original — label' : 'Changed — label'}
                value={name}
                hint="Used in the diff header."
                onChange={(event) => setName(event.target.value)}
              />
              <Textarea
                label={side === 'left' ? 'Original text' : 'Changed text'}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Paste the text, or drop a file below…"
                rows={9}
                spellCheck={false}
                className="font-mono text-xs"
              />
              <FileDrop
                label={`Drop the ${side === 'left' ? 'original' : 'changed'} file`}
                hint="Any text file. It is read locally."
                onFiles={(files) => {
                  const file = files[0]
                  if (file) void loadFile(side, file)
                }}
                className="py-6"
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setLeft(ORIGINAL_SAMPLE)
            setRight(CHANGED_SAMPLE)
            setLeftName('original.yaml')
            setRightName('changed.yaml')
          }}
        >
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setLeft('')
            setRight('')
          }}
          disabled={!left && !right}
        >
          <Icon name="trash" size={16} />
          Clear both
        </Button>
      </div>

      <ToolPanel title="Comparison options">
        <div className="grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2">
          <Checkbox
            label="Ignore letter case"
            hint="Treat “Hello” and “hello” as the same line."
            checked={options.ignoreCase}
            onChange={(event) => setOptions((c) => ({ ...c, ignoreCase: event.target.checked }))}
          />
          <Checkbox
            label="Ignore whitespace"
            hint="Ignore leading, trailing and repeated spaces when matching."
            checked={options.ignoreWhitespace}
            onChange={(event) =>
              setOptions((c) => ({ ...c, ignoreWhitespace: event.target.checked }))
            }
          />
        </div>
      </ToolPanel>

      {tooLarge && (
        <ErrorState
          title="That is too much text to compare"
          message={`Each side is limited to ${formatNumber(MAX_DIFF_LINES)} lines so the comparison stays instant. Compare the files in smaller parts.`}
        />
      )}

      {!tooLarge && hasBoth && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Added" value={formatNumber(stats.added)} />
            <StatTile label="Removed" value={formatNumber(stats.removed)} />
            <StatTile label="Unchanged" value={formatNumber(stats.unchanged)} />
          </div>

          {stats.changed ? (
            <ToolPanel
              title="Unified diff"
              description="A standard diff. “−” marks removed lines, “+” marks added lines."
            >
              <OutputArea
                label="Diff"
                value={unified}
                rows={16}
                filename="changes.diff"
                mimeType="text/x-diff;charset=utf-8"
                actions={
                  <DownloadButton
                    filename="changes.diff"
                    text={unified}
                    mimeType="text/x-diff;charset=utf-8"
                    label="Download .diff"
                    variant="secondary"
                  />
                }
              />
            </ToolPanel>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/8 p-4 text-sm">
              <Icon name="circle-check" size={18} className="shrink-0 text-success" />
              <p className="text-fg">
                The two files are identical under the current comparison options.
              </p>
            </div>
          )}
        </>
      )}

      {!tooLarge && !hasBoth && (
        <EmptyState
          icon="diff"
          title="Add two versions to compare"
          description="Paste the text on each side, or drop a file onto either panel. You get a standard unified diff you can download."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLeft(ORIGINAL_SAMPLE)
                setRight(CHANGED_SAMPLE)
              }}
            >
              Load sample
            </Button>
          }
        />
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        The comparison is exact — it computes the longest common subsequence of the two files, so
        the diff is the smallest set of changes rather than an approximation. Everything happens in
        your browser; neither file is uploaded.
      </p>
    </div>
  )
}

export default DiffCheckerTool
