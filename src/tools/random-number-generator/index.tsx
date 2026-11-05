import { useState } from 'react'
import { Checkbox, Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { randomNumbers } from '@/lib/phase7/generators'

export function RandomNumberGenerator() {
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('10')
  const [unique, setUnique] = useState(true)
  const [result, setResult] = useState<{ ok: true; values: number[] } | { ok: false; error: string } | null>(null)

  function run() {
    setResult(randomNumbers({
      min: Number(min.trim()),
      max: Number(max.trim()),
      count: Number(count.trim()),
      unique,
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The range">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input value={min} onChange={(event) => setMin(event.target.value)} inputMode="numeric" label="Minimum" aria-label="Minimum value" />
          <Input value={max} onChange={(event) => setMax(event.target.value)} inputMode="numeric" label="Maximum" aria-label="Maximum value" />
          <Input value={count} onChange={(event) => setCount(event.target.value)} inputMode="numeric" label="How many" aria-label="How many numbers" />
        </div>
        <div className="mt-3">
          <Checkbox checked={unique} onChange={(event) => setUnique(event.target.checked)} label="No repeats" />
        </div>
        <button
          type="button"
          onClick={run}
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Generate
        </button>
      </ToolPanel>

      {result && !result.ok ? (
        <ErrorState title="Cannot generate those numbers" message={result.error} />
      ) : result && result.ok ? (
        <ToolPanel title="Result" description="Drawn with crypto.getRandomValues, rejection-sampled so every value is equally likely.">
          <OutputArea
            value={result.values.join('\n')}
            label="Random numbers"
            rows={8}
            filename="random-numbers.txt"
          />
        </ToolPanel>
      ) : null}
    </div>
  )
}

export default RandomNumberGenerator
