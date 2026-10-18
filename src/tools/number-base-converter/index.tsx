import { useMemo, useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { ToolPanel } from '@/tools/shared'
import { bitFactsFor, conversionsFor, isValidInBase } from './logic'

const BASE_CHOICES = [
  { value: '2', label: 'Binary (base 2)' },
  { value: '8', label: 'Octal (base 8)' },
  { value: '10', label: 'Decimal (base 10)' },
  { value: '16', label: 'Hexadecimal (base 16)' },
  { value: '36', label: 'Base 36' },
]

export function NumberBaseConverterTool() {
  const [value, setValue] = useState('255')
  const [base, setBase] = useState('10')

  const baseNumber = Number(base)
  const rows = useMemo(() => conversionsFor(value, baseNumber), [value, baseNumber])
  const facts = useMemo(() => bitFactsFor(value, baseNumber), [value, baseNumber])
  const invalid = value.trim() !== '' && !isValidInBase(value, baseNumber)

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The number" description="Whole numbers only, in any base from 2 to 36.">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Enter a number, e.g. 255 or ff…"
            aria-label="Number to convert"
            leading={<Icon name="hash" size={16} />}
          />
          <Select value={base} onChange={(event) => setBase(event.target.value)} aria-label="Input base">
            {BASE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </Select>
        </div>
        {invalid && (
          <ErrorState
            title={`That is not a valid number in base ${baseNumber}`}
            message={`Use only these digits: ${'0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, baseNumber)}.`}
          />
        )}
      </ToolPanel>

      {rows && (
        <ToolPanel title="All bases" description="Every value is exact — conversion uses arbitrary-precision integers, not floats.">
          <div className="flex flex-col divide-y divide-line">
            {rows.map((row) => (
              <div key={row.base} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {row.label} <span className="normal-case">(base {row.base})</span>
                  </p>
                  <p className="mt-0.5 break-all font-mono text-sm text-fg">{row.output}</p>
                </div>
                <CopyButton value={row.output} label={`Copy ${row.label.toLowerCase()}`} size="sm" />
              </div>
            ))}
          </div>
        </ToolPanel>
      )}

      {facts && (
        <ToolPanel title="Bit facts">
          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{fact.label}</p>
                <p className="mt-1 text-base font-semibold text-fg">{fact.value}</p>
              </div>
            ))}
          </div>
        </ToolPanel>
      )}
    </div>
  )
}

export default NumberBaseConverterTool
