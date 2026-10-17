import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import { applyPercent, applyStacked, compareUnits, originalPrice, savedPercent, withTax } from './logic'
import type { Offer } from './logic'

interface UnitRow {
  id: number
  label: string
  price: string
  size: string
  unit: string
}

export function DiscountCalculatorTool() {
  const [priceInput, setPriceInput] = useState('1000')
  const [percentInput, setPercentInput] = useState('20')
  const [extraInput, setExtraInput] = useState('10')
  const [taxInput, setTaxInput] = useState('18')

  const [rows, setRows] = useState<UnitRow[]>([
    { id: 1, label: '500 g pack', price: '120', size: '500', unit: 'g' },
    { id: 2, label: '750 g pack', price: '165', size: '750', unit: 'g' },
  ])

  const price = Number(priceInput)
  const percent = Number(percentInput)
  const extra = Number(extraInput)
  const tax = Number(taxInput)

  const single = useMemo(() => {
    try {
      return { error: null, value: applyPercent(price, percent) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [price, percent])

  const stacked = useMemo(() => {
    try {
      return { error: null, value: applyStacked(price, [percent, extra]) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [price, percent, extra])

  const reverse = useMemo(() => {
    if (single.value?.final === 0) return { error: null, value: null }
    try {
      return { error: null, value: originalPrice(single.value?.final ?? 0, percent) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'That cannot be reversed.', value: null }
    }
  }, [single.value, percent])

  const taxed = useMemo(() => {
    try {
      return { error: null, value: withTax(price, tax) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [price, tax])

  const offers: Offer[] = rows.map((row) => ({
    label: row.label || 'Unnamed',
    price: Number(row.price),
    size: Number(row.size),
    unit: row.unit || 'unit',
  }))
  const comparison = useMemo(() => compareUnits(offers), [JSON.stringify(rows)])

  const updateRow = (id: number, patch: Partial<UnitRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: Math.max(0, ...current.map((row) => row.id)) + 1, label: '', price: '', size: '', unit: 'g' },
    ])
  }

  const removeRow = (id: number) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current))
  }

  const singleError = single.error ?? stacked.error

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="The price and the discount"
        description="One discount, or two applied one after the other — which is not the same as adding them."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Price (₹)"
            type="number"
            inputMode="decimal"
            step="any"
            value={priceInput}
            containerClassName="w-40"
            onChange={(event) => setPriceInput(event.target.value)}
          />
          <Input
            label="First discount (%)"
            type="number"
            inputMode="decimal"
            step="any"
            value={percentInput}
            containerClassName="w-40"
            onChange={(event) => setPercentInput(event.target.value)}
          />
          <Input
            label="Then (%)"
            type="number"
            inputMode="decimal"
            step="any"
            value={extraInput}
            containerClassName="w-32"
            onChange={(event) => setExtraInput(event.target.value)}
          />
        </div>
      </ToolPanel>

      {singleError && <ErrorState title="Those figures could not be used" message={singleError} />}

      {single.value && stacked.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label={`After ${percent}% off`}
              value={<span className="tabular-nums">{single.value.final.toLocaleString('en-IN')}</span>}
              hint={`you save ${single.value.saved.toLocaleString('en-IN')}`}
            />
            <StatTile
              label={`After ${percent}% then ${extra}%`}
              value={<span className="tabular-nums">{stacked.value.final.toLocaleString('en-IN')}</span>}
              hint={`${stacked.value.effectivePercent}% off in total`}
            />
            <StatTile
              label="If they simply added up"
              value={<span className="tabular-nums">{stacked.value.naiveFinal.toLocaleString('en-IN')}</span>}
              hint={`${percent + extra}% flat — this is what it is not`}
            />
            <StatTile
              label="Difference"
              value={<span className="tabular-nums">{(stacked.value.naiveFinal - stacked.value.final).toLocaleString('en-IN')}</span>}
              hint="the second discount is smaller"
            />
          </div>

          <ToolPanel
            title="How the stacked discounts apply"
            description="Each discount comes off the price that is left, not off the original."
          >
            <ol className="flex flex-col gap-2">
              {stacked.value.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2/30 px-3 py-2 text-xs"
                >
                  <span className="text-muted">
                    Step {index + 1} — {step.percent}% off
                  </span>
                  <span className="tabular-nums text-fg">
                    −{step.saved.toLocaleString('en-IN')} → {step.price.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-xs leading-relaxed text-muted">
              {percent}% then {extra}% is {stacked.value.effectivePercent}% off, not {percent + extra}% — the
              second discount is calculated on the already-reduced price. The retailer is not hiding anything;
              the arithmetic is just not additive.
            </p>
          </ToolPanel>

          <ToolPanel title="Other things worth knowing">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile
                label="Saving as a share"
                value={<span className="tabular-nums">{savedPercent(price, single.value.final)}%</span>}
                hint="of the original price"
              />
              {reverse.value && (
                <StatTile
                  label="Original price behind the discount"
                  value={<span className="tabular-nums">{reverse.value.original.toLocaleString('en-IN')}</span>}
                  hint={`if ${percent}% had been taken off`}
                />
              )}
              {taxed.value && (
                <StatTile
                  label={`With ${tax}% tax`}
                  value={<span className="tabular-nums">{taxed.value.total.toLocaleString('en-IN')}</span>}
                  hint={`tax of ${taxed.value.tax.toLocaleString('en-IN')} on top`}
                />
              )}
            </div>
            <Input
              label="Tax rate (%)"
              type="number"
              inputMode="decimal"
              step="any"
              value={taxInput}
              containerClassName="w-40"
              onChange={(event) => setTaxInput(event.target.value)}
            />
          </ToolPanel>
        </>
      )}

      <ToolPanel
        title="Which pack is cheaper"
        description="Price divided by pack size. A bigger box is not automatically better value."
        actions={
          <Button variant="ghost" size="sm" onClick={addRow}>
            Add a pack
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-end gap-2">
              <Input
                label="Pack"
                value={row.label}
                containerClassName="w-40"
                onChange={(event) => updateRow(row.id, { label: event.target.value })}
              />
              <Input
                label="Price (₹)"
                type="number"
                inputMode="decimal"
                step="any"
                value={row.price}
                containerClassName="w-28"
                onChange={(event) => updateRow(row.id, { price: event.target.value })}
              />
              <Input
                label="Size"
                type="number"
                inputMode="decimal"
                step="any"
                value={row.size}
                containerClassName="w-24"
                onChange={(event) => updateRow(row.id, { size: event.target.value })}
              />
              <Input
                label="Unit"
                value={row.unit}
                containerClassName="w-20"
                onChange={(event) => updateRow(row.id, { unit: event.target.value })}
              />
              {rows.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeRow(row.id)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {comparison.best ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Cheapest: {comparison.best.offer.label}</Badge>
              <span className="text-xs text-muted">
                at {comparison.best.pricePerUnit} per {comparison.best.offer.unit}
              </span>
              {comparison.tied && <Badge variant="outline">Some packs cost exactly the same</Badge>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2 pr-3 font-medium">Pack</th>
                    <th className="py-2 pr-3 font-medium">Price</th>
                    <th className="py-2 pr-3 font-medium">Size</th>
                    <th className="py-2 pr-3 font-medium">Per unit</th>
                    <th className="py-2 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr
                      key={row.offer.label + row.offer.size}
                      className={`border-b border-line/60 ${row.premiumPercent === 0 ? 'bg-success/10' : ''}`}
                    >
                      <td className="py-1.5 pr-3 text-fg">{row.offer.label}</td>
                      <td className="py-1.5 pr-3">{row.offer.price}</td>
                      <td className="py-1.5 pr-3">
                        {row.offer.size} {row.offer.unit}
                      </td>
                      <td className="py-1.5 pr-3 font-medium">{row.pricePerUnit}</td>
                      <td className="py-1.5">{row.premiumPercent === 0 ? '—' : `+${row.premiumPercent}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted">
            Enter a price and a size above zero for at least one pack to compare them.
          </p>
        )}
      </ToolPanel>

      {single.value && stacked.value && (
        <ToolPanel
          title="Copy the figures"
          actions={
            <CopyButton
              value={buildSummary(single.value.final, single.value.saved, price, percent, extra, stacked.value)}
              label="Copy"
            />
          }
        >
          <p className="text-xs text-muted">A short summary of the working, ready to paste into a note.</p>
        </ToolPanel>
      )}
    </div>
  )
}

function buildSummary(
  final: number,
  saved: number,
  price: number,
  percent: number,
  extra: number,
  stacked: { final: number; effectivePercent: number },
): string {
  return [
    `Price: ${price}`,
    `${percent}% off: ${final} (saves ${saved})`,
    `${percent}% then ${extra}%: ${stacked.final} (${stacked.effectivePercent}% off in total)`,
  ].join('\n')
}

export default DiscountCalculatorTool
