import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Textarea } from '@/components/ui/Form'
import { cn } from '@/lib/utils'
import { caseStyles, convertCase, type CaseStyle } from './logic'

export function CaseConverterTool() {
  const [text, setText] = useState('')
  const [style, setStyle] = useState<CaseStyle>('upper')

  const output = useMemo(() => convertCase(text, style), [text, style])
  const hasText = text.trim().length > 0

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        label="Your text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type or paste the text you want to convert…"
        rows={8}
        spellCheck={false}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-fg">Convert to</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {caseStyles.map((option) => {
            const selected = option.id === style
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setStyle(option.id)}
                aria-pressed={selected}
                title={option.description}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-colors',
                  selected
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface hover:border-brand/40 hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    selected ? 'text-brand' : 'text-fg',
                  )}
                >
                  {option.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">{option.description}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {hasText ? (
        <>
          <Textarea
            label="Converted text"
            value={output}
            readOnly
            rows={8}
            spellCheck={false}
            className="bg-surface-2/50"
          />

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={output} label="Copy result" />
            <Button variant="outline" onClick={() => setText(output)}>
              <Icon name="refresh" size={16} />
              Use result as input
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText('')
              }}
            >
              <Icon name="trash" size={16} />
              Clear
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          icon="align-left"
          title="Nothing to convert yet"
          description="Enter some text above, then pick a case style. The converted result appears here instantly."
        />
      )}
    </div>
  )
}

export default CaseConverterTool
