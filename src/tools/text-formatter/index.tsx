import { useMemo, useState } from 'react'
import { Checkbox, Input, Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { OutputArea, ToolPanel } from '@/tools/shared'
import { formatNumber } from '@/lib/utils'
import {
  DEFAULT_FORMAT_OPTIONS,
  formatText,
  sizeReduction,
  textStats,
  type TextFormatOptions,
} from './logic'

const SAMPLE = `   TOOLZEN   text formatter


	Cleans up messy text:  stray spaces, blank lines and tabs.

   Everything runs in your browser.   Nothing is uploaded.
`

/** Options rendered as checkboxes, in display order. */
const TOGGLES: { key: keyof TextFormatOptions; label: string; hint: string }[] = [
  {
    key: 'trimLines',
    label: 'Trim each line',
    hint: 'Remove leading and trailing spaces from every line.',
  },
  {
    key: 'collapseSpaces',
    label: 'Collapse repeated spaces',
    hint: 'Turn runs of two or more spaces into a single space.',
  },
  {
    key: 'removeBlankLines',
    label: 'Remove blank lines',
    hint: 'Delete every empty line. Overrides the option below.',
  },
  {
    key: 'collapseBlankLines',
    label: 'Collapse blank lines',
    hint: 'Reduce two or more consecutive blank lines to one.',
  },
  {
    key: 'tabsToSpaces',
    label: 'Convert tabs to spaces',
    hint: 'Replace each tab character with the width set below.',
  },
  {
    key: 'trimDocument',
    label: 'Trim the whole document',
    hint: 'Remove whitespace at the very start and very end.',
  },
]

export function TextFormatterTool() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<TextFormatOptions>(DEFAULT_FORMAT_OPTIONS)

  const output = useMemo(() => formatText(input, options), [input, options])
  const stats = useMemo(() => textStats(output), [output])
  const saved = useMemo(() => sizeReduction(input, output), [input, output])
  const hasInput = input.trim().length > 0
  const changed = hasInput && output !== input

  function setOption<K extends keyof TextFormatOptions>(key: K, value: TextFormatOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <Textarea
        label="Your text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste the text you want to clean up…"
        rows={10}
        spellCheck={false}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setInput(SAMPLE)}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button
          variant="ghost"
          onClick={() => setInput('')}
          disabled={!input}
        >
          <Icon name="trash" size={16} />
          Clear
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOptions(DEFAULT_FORMAT_OPTIONS)}
          disabled={JSON.stringify(options) === JSON.stringify(DEFAULT_FORMAT_OPTIONS)}
        >
          <Icon name="refresh" size={16} />
          Reset options
        </Button>
      </div>

      <ToolPanel title="Cleanup rules" description="Changes apply instantly — there is no submit button.">
        <div className="grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2">
          {TOGGLES.map((toggle) => (
            <Checkbox
              key={toggle.key}
              label={toggle.label}
              hint={toggle.hint}
              checked={options[toggle.key] as boolean}
              onChange={(event) => setOption(toggle.key, event.target.checked as never)}
            />
          ))}
          <Input
            label="Tab width"
            type="number"
            min={1}
            max={16}
            value={options.tabSize}
            disabled={!options.tabsToSpaces}
            hint="Spaces per tab (1–16)."
            onChange={(event) => setOption('tabSize', Number(event.target.value))}
          />
        </div>
      </ToolPanel>

      {hasInput ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Lines" value={formatNumber(stats.lines)} />
            <StatTile label="Non-blank" value={formatNumber(stats.nonBlankLines)} />
            <StatTile label="Blank" value={formatNumber(stats.blankLines)} />
            <StatTile label="Words" value={formatNumber(stats.words)} />
            <StatTile
              label="Size change"
              value={saved === 0 ? '—' : `${saved > 0 ? '−' : '+'}${Math.abs(saved).toFixed(1)}%`}
              hint={saved > 0 ? 'smaller than the input' : 'larger than the input'}
            />
          </div>

          <OutputArea
            label="Formatted text"
            value={output}
            filename="formatted-text.txt"
            rows={12}
            actions={
              changed ? (
                <Button variant="secondary" size="sm" onClick={() => setInput(output)}>
                  <Icon name="check" size={16} />
                  Replace input with result
                </Button>
              ) : undefined
            }
          />
        </>
      ) : (
        <EmptyState
          icon="align-left"
          title="Nothing to format yet"
          description="Paste some text above, or load the sample to see the cleanup rules in action."
          action={
            <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
              Load sample
            </Button>
          }
        />
      )}

      {changed && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Icon name="info" size={14} className="mt-0.5 shrink-0" />
          The formatted text is ready to copy or download. Your original input is untouched until
          you choose to replace it.
        </p>
      )}

      <span className="sr-only" aria-live="polite">
        {hasInput ? `Formatted ${stats.lines} lines, ${stats.words} words.` : ''}
      </span>
    </div>
  )
}

export default TextFormatterTool
