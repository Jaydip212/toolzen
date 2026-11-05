import { useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { convertCssUnit, CSS_UNITS, toPixels, type CssUnit } from '@/lib/phase7/codecs'

export function CssUnitConverter() {
  const [value, setValue] = useState('16')
  const [from, setFrom] = useState<CssUnit>('px')
  const [to, setTo] = useState<CssUnit>('rem')
  const [base, setBase] = useState('16')

  const parsed = Number(value.trim())
  const root = Number(base.trim())
  const result = value.trim() === '' ? null : convertCssUnit(parsed, from, to, root)
  const error =
    result === null && value.trim() !== ''
      ? 'Enter a finite number and a root font size greater than zero.'
      : null

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The length">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" aria-label="Length value" label="Value" />
          <Select value={from} onChange={(event) => setFrom(event.target.value as CssUnit)} aria-label="From unit" label="From">
            {CSS_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </Select>
          <Select value={to} onChange={(event) => setTo(event.target.value as CssUnit)} aria-label="To unit" label="To">
            {CSS_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </Select>
        </div>
        <Input
          value={base}
          onChange={(event) => setBase(event.target.value)}
          inputMode="decimal"
          label="Root font size (px)"
          hint="Used for rem and em. Browsers default to 16px."
          className="mt-3"
        />
      </ToolPanel>

      {error ? (
        <ErrorState title="Cannot convert that" message={error} />
      ) : (
        <ToolPanel title="Result">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label={`In ${to}`} value={result === null ? '—' : Number(result.toPrecision(8)).toString()} />
            <StatTile label="In pixels" value={value.trim() === '' ? '—' : String(Number((toPixels(parsed, from, root) ?? 0).toPrecision(8)))} />
          </div>
          <div className="mt-4">
            <OutputArea value={result === null ? '' : `${Number(result.toPrecision(8))}${to}`} label="CSS value" rows={2} filename="css-unit.txt" />
          </div>
        </ToolPanel>
      )}
    </div>
  )
}

export default CssUnitConverter
