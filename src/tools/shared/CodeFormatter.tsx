import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { formatNumber } from '@/lib/utils'
import { OutputArea } from './OutputArea'
import { SegmentedControl } from './SegmentedControl'
import { ToolPanel } from './ToolPanel'

export type CodeMode = 'format' | 'minify'

export interface CodeFormatterProps {
  /** Language name used in labels and messages, e.g. "HTML". */
  language: string
  placeholder: string
  /** Sample source loaded by the "Load sample" button. */
  sample: string
  /** Download filename for the result. */
  filename: string
  mimeType: string
  /** Produce pretty-printed output. May throw — the error is shown inline. */
  format: (input: string) => string
  /** Produce compact output. May throw — the error is shown inline. */
  minify: (input: string) => string
  /** Options panel rendered above the editor. */
  optionsPanel?: ReactNode
  /** One-line honesty note shown under the mode switch. */
  minifyNote?: string
  icon?: IconName
  /** Number of editor rows. */
  rows?: number
}

/** Byte length as UTF-8, used for the size tiles. */
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/**
 * Shared shell for the code formatters (HTML, CSS, JavaScript, SQL).
 *
 * Owns the input, the mode switch, error handling and the result panel, so each
 * formatter only has to supply its transform functions and its options UI.
 */
export function CodeFormatter({
  language,
  placeholder,
  sample,
  filename,
  mimeType,
  format,
  minify,
  optionsPanel,
  minifyNote,
  icon = 'code',
  rows = 14,
}: CodeFormatterProps) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<CodeMode>('format')

  const hasInput = input.trim().length > 0

  const { output, error } = useMemo(() => {
    if (!hasInput) return { output: '', error: null as string | null }
    try {
      const result = mode === 'format' ? format(input) : minify(input)
      return { output: result, error: null as string | null }
    } catch (thrown) {
      return {
        output: '',
        error: thrown instanceof Error ? thrown.message : `${language} could not be processed.`,
      }
    }
  }, [input, mode, format, minify, hasInput, language])

  const inputBytes = useMemo(() => byteLength(input), [input])
  const outputBytes = useMemo(() => byteLength(output), [output])
  const saving = inputBytes === 0 ? 0 : ((inputBytes - outputBytes) / inputBytes) * 100

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="Options">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <SegmentedControl
              label={`${language} output mode`}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'format', label: 'Format', title: `Pretty-print the ${language}.` },
                { value: 'minify', label: 'Minify', title: 'Collapse whitespace.' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setInput(sample)}>
                <Icon name="pilcrow" size={16} />
                Load sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
                <Icon name="trash" size={16} />
                Clear
              </Button>
            </div>
          </div>
          {mode === 'minify' && minifyNote && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              {minifyNote}
            </p>
          )}
          {optionsPanel}
        </div>
      </ToolPanel>

      <Textarea
        label={`Your ${language}`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="font-mono text-xs"
      />

      {error && <ErrorState title={`That ${language} could not be processed`} message={error} />}

      {hasInput && !error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Input" value={`${formatNumber(inputBytes)} B`} />
            <StatTile label="Output" value={`${formatNumber(outputBytes)} B`} />
            <StatTile
              label="Size change"
              value={saving === 0 ? '—' : `${saving > 0 ? '−' : '+'}${Math.abs(saving).toFixed(1)}%`}
              hint={saving > 0 ? 'smaller than the input' : 'larger than the input'}
            />
            <StatTile label="Lines out" value={formatNumber(output === '' ? 0 : output.split('\n').length)} />
          </div>

          <OutputArea
            label={`${mode === 'format' ? 'Formatted' : 'Minified'} ${language}`}
            value={output}
            filename={filename}
            mimeType={mimeType}
            rows={rows}
          />
        </>
      )}

      {!hasInput && (
        <EmptyState
          icon={icon}
          title={`Nothing to ${mode} yet`}
          description={`Paste your ${language} above, or load the sample to see the result immediately.`}
          action={
            <Button variant="secondary" onClick={() => setInput(sample)}>
              Load sample
            </Button>
          }
        />
      )}
    </div>
  )
}

export default CodeFormatter
