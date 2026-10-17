import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import { MODES, calculate, exampleFor } from './logic'
import type { PercentageMode } from './logic'

export function PercentageCalculatorTool() {
  const [mode, setMode] = useState<PercentageMode>('of')
  const [first, setFirst] = useState('15')
  const [second, setSecond] = useState('200')

  const labels = MODES.find((entry) => entry.value === mode) ?? MODES[0]

  const result = useMemo(() => {
    if (first.trim() === '' || second.trim() === '') return { error: null, value: null }
    try {
      return { error: null, value: calculate(mode, Number(first), Number(second)) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those numbers could not be used.', value: null }
    }
  }, [mode, first, second])

  const applyExample = (next: PercentageMode) => {
    const example = exampleFor(next)
    setFirst(String(example.a))
    setSecond(String(example.b))
  }

  const switchMode = (next: PercentageMode) => {
    setMode(next)
    applyExample(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="What are you working out?" description="Three questions, three answers. The working is shown below every result.">
        <SegmentedControl
          label="Percentage mode"
          value={mode}
          onChange={switchMode}
          options={MODES.map((entry) => ({ value: entry.value, label: entry.label }))}
        />

        <div className="flex flex-wrap items-end gap-3">
          <Input
            label={labels.first}
            type="number"
            inputMode="decimal"
            value={first}
            step="any"
            containerClassName="w-44"
            onChange={(event) => setFirst(event.target.value)}
          />
          <Input
            label={labels.second}
            type="number"
            inputMode="decimal"
            value={second}
            step="any"
            containerClassName="w-44"
            onChange={(event) => setSecond(event.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => applyExample(mode)}>
            Worked example
          </Button>
        </div>
      </ToolPanel>

      {result.error && <ErrorState title="That calculation cannot be made" message={result.error} />}

      {result.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Answer"
              value={<span className="tabular-nums">{result.value.value.toLocaleString('en-US')}%</span>}
              hint={result.value.decreased ? 'a decrease' : 'an increase'}
            />
            <StatTile label="In words" value={<span className="text-base font-medium">{result.value.sentence}</span>} />
            <StatTile
              label="Formula"
              value={<span className="font-mono text-sm">{result.value.formula}</span>}
              hint="the same working, written out"
            />
          </div>

          <ToolPanel title="How this was worked out">
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-xs leading-relaxed text-muted">
              <li>
                {mode === 'of' && 'Divide the percentage by 100, then multiply by the value.'}
                {mode === 'is-what-percent' && 'Divide the first number by the second, then multiply by 100.'}
                {mode === 'change' &&
                  'Subtract the first number from the second, divide by the size of the first number, then multiply by 100.'}
              </li>
              <li>
                {mode === 'change' &&
                  'The denominator is the magnitude of the starting value, so a change from −200 to −100 reads as a 50% increase.'}
                {mode !== 'change' && 'Negative numbers are carried through the arithmetic rather than being rejected.'}
              </li>
              <li>Results are rounded to four decimal places. No rounding happens before the division.</li>
            </ol>
          </ToolPanel>
        </>
      )}
    </div>
  )
}

export default PercentageCalculatorTool
