import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  MARGIN_VS_MARKUP,
  bothFor,
  breakeven,
  formatMoney,
  formatPercent,
  fromMargin,
  fromMarkup,
  fromRevenueCost,
  fromUnits,
} from './logic'

type Mode = 'revenue-cost' | 'target-margin' | 'target-markup' | 'per-unit'

export function ProfitMarginCalculatorTool() {
  const [mode, setMode] = useState<Mode>('revenue-cost')
  const [revenueInput, setRevenueInput] = useState('100000')
  const [costInput, setCostInput] = useState('60000')
  const [marginInput, setMarginInput] = useState('40')
  const [markupInput, setMarkupInput] = useState('50')
  const [unitPriceInput, setUnitPriceInput] = useState('250')
  const [unitCostInput, setUnitCostInput] = useState('150')
  const [quantityInput, setQuantityInput] = useState('100')

  const [fixedInput, setFixedInput] = useState('200000')

  const revenue = Number(revenueInput)
  const cost = Number(costInput)
  const margin = Number(marginInput)
  const markup = Number(markupInput)
  const unitPrice = Number(unitPriceInput)
  const unitCost = Number(unitCostInput)
  const quantity = Number(quantityInput)
  const fixed = Number(fixedInput)

  const result = useMemo(() => {
    try {
      if (mode === 'revenue-cost') return { error: null, value: fromRevenueCost(revenue, cost), kind: mode }
      if (mode === 'target-margin') return { error: null, value: fromMargin(revenue, margin), kind: mode }
      if (mode === 'target-markup') return { error: null, value: fromMarkup(cost, markup), kind: mode }
      return { error: null, value: fromUnits(unitPrice, unitCost, quantity), kind: mode }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null, kind: mode }
    }
  }, [mode, revenue, cost, margin, markup, unitPrice, unitCost, quantity])

  const breakEven = useMemo(() => {
    try {
      return { error: null, value: breakeven(fixed, unitPrice, unitCost) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [fixed, unitPrice, unitCost])

  const sideBySide = useMemo(() => {
    if (mode === 'per-unit') {
      try {
        return { error: null, value: bothFor(unitPrice, unitCost) }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
      }
    }
    return { error: null, value: null }
  }, [mode, unitPrice, unitCost])

  const summaryText = result.value
    ? [
        `Revenue: ${formatMoney(result.value.revenue)}`,
        `Cost: ${formatMoney(result.value.cost)}`,
        `Profit: ${formatMoney(result.value.profit)}`,
        `Margin: ${formatPercent(result.value.marginPercent)}`,
        `Markup: ${formatPercent(result.value.markupPercent)}`,
      ].join('\n')
    : ''

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="What do you know?"
        description="Start from whichever pair of numbers you have. The tool works the other two out."
      >
        <SegmentedControl
          label="Mode"
          value={mode}
          onChange={setMode}
          size="sm"
          options={[
            { value: 'revenue-cost', label: 'Revenue & cost' },
            { value: 'target-margin', label: 'Target margin' },
            { value: 'target-markup', label: 'Target markup' },
            { value: 'per-unit', label: 'Per unit' },
          ]}
        />

        {mode === 'revenue-cost' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Revenue (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={revenueInput}
              containerClassName="w-44"
              onChange={(event) => setRevenueInput(event.target.value)}
            />
            <Input
              label="Cost (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={costInput}
              containerClassName="w-44"
              onChange={(event) => setCostInput(event.target.value)}
            />
          </div>
        )}

        {mode === 'target-margin' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Revenue (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={revenueInput}
              containerClassName="w-44"
              onChange={(event) => setRevenueInput(event.target.value)}
            />
            <Input
              label="Target margin (%)"
              type="number"
              inputMode="decimal"
              step="any"
              value={marginInput}
              containerClassName="w-40"
              onChange={(event) => setMarginInput(event.target.value)}
            />
          </div>
        )}

        {mode === 'target-markup' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Cost (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={costInput}
              containerClassName="w-44"
              onChange={(event) => setCostInput(event.target.value)}
            />
            <Input
              label="Target markup (%)"
              type="number"
              inputMode="decimal"
              step="any"
              value={markupInput}
              containerClassName="w-40"
              onChange={(event) => setMarkupInput(event.target.value)}
            />
          </div>
        )}

        {mode === 'per-unit' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Selling price per unit (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={unitPriceInput}
              containerClassName="w-44"
              onChange={(event) => setUnitPriceInput(event.target.value)}
            />
            <Input
              label="Cost per unit (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={unitCostInput}
              containerClassName="w-44"
              onChange={(event) => setUnitCostInput(event.target.value)}
            />
            <Input
              label="Quantity"
              type="number"
              inputMode="decimal"
              step="any"
              value={quantityInput}
              containerClassName="w-32"
              onChange={(event) => setQuantityInput(event.target.value)}
            />
          </div>
        )}
      </ToolPanel>

      {result.error && <ErrorState title="Those figures could not be used" message={result.error} />}

      {result.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Revenue"
              value={<span className="tabular-nums">{formatMoney(result.value.revenue)}</span>}
              hint={mode === 'per-unit' ? `${quantity} units` : 'the top line'}
            />
            <StatTile
              label="Cost"
              value={<span className="tabular-nums">{formatMoney(result.value.cost)}</span>}
              hint={`${result.value.costSharePercent}% of revenue`}
            />
            <StatTile
              label="Profit"
              value={<span className="tabular-nums">{formatMoney(result.value.profit)}</span>}
              hint="revenue minus cost"
            />
            <StatTile
              label="Margin"
              value={<span className="tabular-nums">{formatPercent(result.value.marginPercent)}</span>}
              hint="profit as a share of revenue"
            />
          </div>

          <ToolPanel
            title="Margin and markup, side by side"
            description={MARGIN_VS_MARKUP}
            actions={summaryText ? <CopyButton value={summaryText} label="Copy" /> : undefined}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile
                label="Markup"
                value={<span className="tabular-nums">{formatPercent(result.value.markupPercent)}</span>}
                hint="profit as a share of cost"
              />
              <StatTile
                label="Cost as a share of revenue"
                value={<span className="tabular-nums">{formatPercent(result.value.costSharePercent)}</span>}
                hint="the other side of the margin"
              />
              {sideBySide.value && (
                <StatTile
                  label="Same money, both ways"
                  value={
                    <span className="text-sm font-medium">
                      {formatPercent(sideBySide.value.marginPercent)} margin ={' '}
                      {formatPercent(sideBySide.value.markupPercent)} markup
                    </span>
                  }
                  hint="per unit"
                />
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="flex h-8 w-full">
                <div
                  className="flex items-center justify-center bg-danger/20 text-[11px] font-medium text-fg"
                  style={{ width: `${Math.min(result.value.costSharePercent, 100)}%` }}
                >
                  cost
                </div>
                <div
                  className="flex items-center justify-center bg-success/25 text-[11px] font-medium text-fg"
                  style={{ width: `${Math.max(100 - result.value.costSharePercent, 0)}%` }}
                >
                  profit
                </div>
              </div>
            </div>
          </ToolPanel>
        </>
      )}

      <ToolPanel
        title="Break-even"
        description="How many units you need to sell before the fixed costs are covered."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Fixed costs (₹)"
            type="number"
            inputMode="decimal"
            step="any"
            value={fixedInput}
            containerClassName="w-44"
            onChange={(event) => setFixedInput(event.target.value)}
          />
          <Input
            label="Selling price per unit (₹)"
            type="number"
            inputMode="decimal"
            step="any"
            value={unitPriceInput}
            containerClassName="w-44"
            onChange={(event) => setUnitPriceInput(event.target.value)}
          />
          <Input
            label="Variable cost per unit (₹)"
            type="number"
            inputMode="decimal"
            step="any"
            value={unitCostInput}
            containerClassName="w-44"
            onChange={(event) => setUnitCostInput(event.target.value)}
          />
        </div>

        {breakEven.error && <ErrorState title="Break-even cannot be worked out" message={breakEven.error} />}

        {breakEven.value && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="Break-even volume"
              value={<span className="tabular-nums">{breakEven.value.units.toLocaleString('en-US')}</span>}
              hint="whole units"
            />
            <StatTile
              label="Contribution per unit"
              value={<span className="tabular-nums">{formatMoney(breakEven.value.contribution)}</span>}
              hint="price minus variable cost"
            />
            <StatTile
              label="Revenue at break-even"
              value={<span className="tabular-nums">{formatMoney(breakEven.value.revenueAtBreakeven)}</span>}
              hint="what you need to take"
            />
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">How this was worked out.</strong> Contribution is the selling price minus
          the variable cost. Break-even is fixed costs divided by contribution, rounded up — because selling 0.4
          of a unit does not cover anything. Only contribution above break-even becomes profit.
        </p>
      </ToolPanel>
    </div>
  )
}

export default ProfitMarginCalculatorTool
