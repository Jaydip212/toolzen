import { useMemo, useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { Icon } from '@/components/ui/Icon'
import { ToolPanel } from '@/tools/shared'
import { CATEGORIES, convert, formatValue, isTemperatureCategory, temperatureWarning } from './logic'

export function UnitConverterTool() {
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]!.id)
  const [value, setValue] = useState('1')

  const isTemperature = isTemperatureCategory(categoryId)
  const units = isTemperature
    ? [
        { id: 'c', label: 'Celsius' },
        { id: 'f', label: 'Fahrenheit' },
        { id: 'k', label: 'Kelvin' },
      ]
    : CATEGORIES.find((c) => c.id === categoryId)!.units

  const [from, setFrom] = useState(units[0]!.id)
  const [to, setTo] = useState(units[1]!.id)

  function changeCategory(next: string) {
    setCategoryId(next)
    const nextUnits = isTemperatureCategory(next)
      ? [
          { id: 'c', label: 'Celsius' },
          { id: 'f', label: 'Fahrenheit' },
          { id: 'k', label: 'Kelvin' },
        ]
      : CATEGORIES.find((c) => c.id === next)!.units
    setFrom(nextUnits[0]!.id)
    setTo(nextUnits[1]!.id)
  }

  const parsed = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(parsed)

  const targets = useMemo(() => {
    if (!valid) return []
    return units
      .filter((unit) => unit.id !== from)
      .map((unit) => {
        const result = convert(categoryId, parsed, from, unit.id)
        return { ...unit, result }
      })
  }, [categoryId, from, parsed, units, valid])

  const fromLabel = units.find((unit) => unit.id === from)?.label ?? ''
  const warning = valid && isTemperature ? temperatureWarning(parsed, from) : null

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="What to convert">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={categoryId} onChange={(event) => changeCategory(event.target.value)} aria-label="Unit category">
            {[...CATEGORIES.map((c) => ({ id: c.id, label: c.label })), { id: 'temperature', label: 'Temperature' }].map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </Select>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="decimal"
            placeholder="Value…"
            aria-label="Value to convert"
            leading={<Icon name="ruler" size={16} />}
          />
          <Select value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From unit">
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </Select>
        </div>
        {value.trim() !== '' && !valid && (
          <p className="text-sm text-danger">Enter a number — decimals and negatives are fine.</p>
        )}
        {warning && <p className="text-sm text-warning">{warning}</p>}
      </ToolPanel>

      {valid && (
        <ToolPanel
          title="Converted values"
          description={`Everything else in ${CATEGORIES.find((c) => c.id === categoryId)?.label ?? 'Temperature'}, from one ${fromLabel.toLowerCase()} input.`}
        >
          <div className="flex flex-col divide-y divide-line">
            {targets.map((target) => (
              <div key={target.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{target.label}</p>
                  <p className="mt-0.5 break-all font-mono text-sm text-fg">
                    {target.result === null ? '—' : formatValue(target.result)}
                  </p>
                </div>
                {target.result !== null && (
                  <CopyButton value={String(target.result)} label={`Copy ${target.label.toLowerCase()}`} size="sm" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            {to !== from && (() => {
              const direct = convert(categoryId, parsed, from, to)
              return direct !== null
                ? `${formatValue(parsed)} ${fromLabel.toLowerCase()} = ${formatValue(direct)} ${units.find((u) => u.id === to)?.label.toLowerCase()}`
                : null
            })()}
          </p>
        </ToolPanel>
      )}
    </div>
  )
}

export default UnitConverterTool
