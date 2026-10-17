import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SIZE_UNITS, convertSize, explainGap, formatSizeValue, summarise } from './logic'

export function FileSizeConverterTool() {
  const [raw, setRaw] = useState('1')
  const [unit, setUnit] = useState('GB')

  const parsed = raw.trim() === '' ? Number.NaN : Number(raw)

  const { rows, error } = useMemo(() => {
    if (raw.trim() === '') return { rows: [], error: null as string | null }
    if (Number.isNaN(parsed)) return { rows: [], error: 'Enter a number.' }
    try {
      return { rows: convertSize(parsed, unit), error: null as string | null }
    } catch (thrown) {
      return { rows: [], error: thrown instanceof Error ? thrown.message : String(thrown) }
    }
  }, [parsed, unit, raw])

  const decimal = rows.filter((row) => row.unit.family === 'decimal')
  const binary = rows.filter((row) => row.unit.family === 'binary')

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Convert a file size"
        description="Decimal units use powers of 1000; binary units use powers of 1024."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Value"
            value={raw}
            type="number"
            min={0}
            step="any"
            containerClassName="w-40"
            inputMode="decimal"
            onChange={(event) => setRaw(event.target.value)}
          />
          <Select
            label="Unit"
            value={unit}
            containerClassName="w-48"
            onChange={(event) => setUnit(event.target.value)}
          >
            <optgroup label="Decimal (1000)">
              {SIZE_UNITS.filter((entry) => entry.family === 'decimal').map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id} — {entry.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Binary (1024)">
              {SIZE_UNITS.filter((entry) => entry.family === 'binary').map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id} — {entry.label}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>
      </ToolPanel>

      {error && <ErrorState title="That value cannot be converted" message={error} />}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="You entered" value={summarise(parsed, unit)} />
            <StatTile label="In bytes" value={formatSizeValue(parsed * (SIZE_UNITS.find((entry) => entry.id === unit)?.bytes ?? 1))} />
            <StatTile label="Decimal" value={<span className="text-base">{decimal.length} units</span>} />
            <StatTile label="Binary" value={<span className="text-base">{binary.length} units</span>} />
          </div>

          <ToolPanel title="Decimal (SI)" description="1 KB = 1,000 bytes. What drive manufacturers print on the box.">
            <ul className="grid gap-2 sm:grid-cols-2">
              {decimal.map((row) => (
                <li
                  key={row.unit.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-fg">
                      {row.unit.id}
                      <span className="ml-2 text-xs font-normal text-muted">{row.unit.label}</span>
                    </p>
                    <p className="text-xs text-muted">{row.unit.bytes.toLocaleString('en-US')} bytes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm tabular-nums text-fg">{row.display}</span>
                    <CopyButton value={row.display} label="" />
                  </div>
                </li>
              ))}
            </ul>
          </ToolPanel>

          <ToolPanel title="Binary (IEC)" description="1 KiB = 1,024 bytes. What most operating systems show.">
            <ul className="grid gap-2 sm:grid-cols-2">
              {binary.map((row) => (
                <li
                  key={row.unit.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-fg">
                      {row.unit.id}
                      <span className="ml-2 text-xs font-normal text-muted">{row.unit.label}</span>
                    </p>
                    <p className="text-xs text-muted">{row.unit.bytes.toLocaleString('en-US')} bytes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm tabular-nums text-fg">{row.display}</span>
                    <CopyButton value={row.display} label="" />
                  </div>
                </li>
              ))}
            </ul>
          </ToolPanel>

          <div className="flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-4 text-sm">
            <Icon name="info" size={18} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <p className="font-medium text-fg">Why the same file has two sizes</p>
              <p className="mt-1 leading-relaxed text-muted">{explainGap()}</p>
            </div>
          </div>
        </>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        A <Badge variant="outline">KB</Badge> is 1,000 bytes and a{' '}
        <Badge variant="outline">KiB</Badge> is 1,024 — they are different units, not two spellings of
        the same one. This tool never silently swaps them.
      </p>
    </div>
  )
}

export default FileSizeConverterTool
