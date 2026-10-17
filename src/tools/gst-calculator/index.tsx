import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import { GST_RATES, addGst, describeInvoice, describeSupply, removeGst } from './logic'
import type { SupplyType } from './logic'

type Direction = 'add' | 'remove'

export function GstCalculatorTool() {
  const [amountInput, setAmountInput] = useState('10000')
  const [rate, setRate] = useState('18')
  const [direction, setDirection] = useState<Direction>('add')
  const [supply, setSupply] = useState<SupplyType>('intra')
  const [fromState, setFromState] = useState('Maharashtra')
  const [toState, setToState] = useState('Gujarat')

  const amount = Number(amountInput)
  const rateValue = Number(rate)

  const result = useMemo(() => {
    if (amountInput.trim() === '' || rate.trim() === '') return { error: null, value: null }
    try {
      const value =
        direction === 'add' ? addGst(amount, rateValue, supply) : removeGst(amount, rateValue, supply)
      return { error: null, value }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [amountInput, rate, amount, rateValue, direction, supply])

  const autoSupply: SupplyType = fromState.trim() === toState.trim() ? 'intra' : 'inter'

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="The amount"
        description={
          direction === 'add'
            ? 'A tax-exclusive amount, with GST added on top.'
            : 'A tax-inclusive amount, with GST taken back out.'
        }
      >
        <SegmentedControl
          label="Direction"
          value={direction}
          onChange={setDirection}
          size="sm"
          options={[
            { value: 'add', label: 'Add GST' },
            { value: 'remove', label: 'Remove GST' },
          ]}
        />

        <div className="flex flex-wrap items-end gap-3">
          <Input
            label={direction === 'add' ? 'Amount before GST (₹)' : 'Amount including GST (₹)'}
            type="number"
            inputMode="decimal"
            step="any"
            value={amountInput}
            containerClassName="w-52"
            onChange={(event) => setAmountInput(event.target.value)}
          />
          <label className="flex flex-col gap-1 text-xs text-muted">
            GST rate
            <select
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
            >
              {GST_RATES.map((option) => (
                <option key={option} value={option}>
                  {option}%
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <SegmentedControl
            label="Supply type"
            value={supply}
            onChange={setSupply}
            size="sm"
            options={[
              { value: 'intra', label: 'Same state — CGST + SGST' },
              { value: 'inter', label: 'Different states — IGST' },
            ]}
          />
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="From state"
              value={fromState}
              containerClassName="w-40"
              onChange={(event) => setFromState(event.target.value)}
            />
            <Input
              label="To state"
              value={toState}
              containerClassName="w-40"
              onChange={(event) => setToState(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setSupply(autoSupply)}
              className="h-9 rounded-xl px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              Match the states
            </button>
          </div>
          <p className="text-xs text-muted">{describeSupply(supply)}</p>
        </div>
      </ToolPanel>

      {result.error && <ErrorState title="Those figures could not be used" message={result.error} />}

      {result.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Taxable value"
              value={<span className="tabular-nums">{result.value.net.toLocaleString('en-IN')}</span>}
              hint="before GST"
            />
            <StatTile
              label="GST"
              value={<span className="tabular-nums">{result.value.tax.toLocaleString('en-IN')}</span>}
              hint={`at ${result.value.rate}%`}
            />
            <StatTile
              label="Invoice total"
              value={<span className="tabular-nums">{result.value.gross.toLocaleString('en-IN')}</span>}
              hint="including GST"
            />
            <StatTile
              label="Split"
              value={
                <span className="text-sm font-medium tabular-nums">
                  {result.value.supply === 'intra'
                    ? `${result.value.cgst.toLocaleString('en-IN')} + ${result.value.sgst.toLocaleString('en-IN')}`
                    : result.value.igst.toLocaleString('en-IN')}
                </span>
              }
              hint={result.value.supply === 'intra' ? 'CGST + SGST' : 'IGST'}
            />
          </div>

          <ToolPanel
            title="Invoice line"
            description="Paste this straight into a quotation or bill."
            actions={<CopyButton value={describeInvoice(result.value)} label="Copy" />}
          >
            <p className="rounded-xl border border-line bg-surface-2/30 px-3 py-2 font-mono text-xs leading-relaxed text-fg">
              {describeInvoice(result.value)}
            </p>
          </ToolPanel>

          <ToolPanel title="Both directions">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2 pr-3 font-medium">Rate</th>
                    <th className="py-2 pr-3 font-medium">Add GST to {result.value.net.toLocaleString('en-IN')}</th>
                    <th className="py-2 pr-3 font-medium">Net inside {result.value.gross.toLocaleString('en-IN')}</th>
                    <th className="py-2 font-medium">Tax inside {result.value.gross.toLocaleString('en-IN')}</th>
                  </tr>
                </thead>
                <tbody>
                  {GST_RATES.map((option) => {
                    const added = addGst(result.value.net, option, supply)
                    const removed = removeGst(result.value.gross, option, supply)
                    return (
                      <tr
                        key={option}
                        className={`border-b border-line/60 ${option === result.value.rate ? 'bg-brand-soft/40' : ''}`}
                      >
                        <td className="py-1.5 pr-3 font-medium">{option}%</td>
                        <td className="py-1.5 pr-3">{added.gross.toLocaleString('en-IN')}</td>
                        <td className="py-1.5 pr-3">{removed.net.toLocaleString('en-IN')}</td>
                        <td className="py-1.5">{removed.tax.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ToolPanel>
        </>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">Removing GST.</strong> The net is{' '}
          <code className="font-mono">gross × 100 ÷ (100 + rate)</code>, not{' '}
          <code className="font-mono">gross × rate ÷ 100</code>. Taking 18% of a tax-inclusive ₹11,800 gives
          ₹2,124, which overstates the tax — the real figure is ₹1,800.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">The rate is yours to choose.</strong> This tool applies the slab you pick. It
          does not look up the rate for a particular good or service, because that depends on the HSN or SAC code
          and on notifications that change. Check the rate against the item before filing.
        </p>
      </div>
    </div>
  )
}

export default GstCalculatorTool
