import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  TERM_PRESETS,
  formatMoney,
  interestShare,
  schedule,
  summarise,
  withExtraPayment,
} from './logic'

export function EmiCalculatorTool() {
  const [principalInput, setPrincipalInput] = useState('1000000')
  const [rateInput, setRateInput] = useState('8.5')
  const [monthsInput, setMonthsInput] = useState('240')
  const [extraInput, setExtraInput] = useState('0')

  const principal = Number(principalInput)
  const rate = Number(rateInput)
  const months = Number(monthsInput)
  const extra = Number(extraInput)

  const summary = useMemo(() => {
    try {
      return { error: null, value: summarise(principal, rate, months) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those loan terms could not be used.', value: null }
    }
  }, [principal, rate, months])

  const rows = useMemo(() => {
    if (!summary.value) return []
    try {
      return schedule(principal, rate, months)
    } catch {
      return []
    }
  }, [principal, rate, months, summary.value])

  const prepayment = useMemo(() => {
    if (!summary.value) return null
    try {
      return withExtraPayment(principal, rate, months, extra)
    } catch {
      return null
    }
  }, [principal, rate, months, extra, summary.value])

  const scheduleText = rows
    .map(
      (row) =>
        `${row.number},${row.payment.toFixed(2)},${row.interest.toFixed(2)},${row.principal.toFixed(2)},${row.balance.toFixed(2)}`,
    )
    .join('\n')

  const firstRows = rows.slice(0, 12)
  const showExtra = extra > 0 && prepayment !== null

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="The loan"
        description="A fixed instalment every month, with interest charged on the balance that is still outstanding."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Loan amount (₹)"
            type="number"
            inputMode="decimal"
            step="any"
            value={principalInput}
            containerClassName="w-44"
            onChange={(event) => setPrincipalInput(event.target.value)}
          />
          <Input
            label="Interest rate (% per year)"
            type="number"
            inputMode="decimal"
            step="any"
            value={rateInput}
            containerClassName="w-44"
            onChange={(event) => setRateInput(event.target.value)}
          />
          <Input
            label="Term (months)"
            type="number"
            inputMode="numeric"
            step="1"
            value={monthsInput}
            containerClassName="w-36"
            onChange={(event) => setMonthsInput(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TERM_PRESETS.map((preset) => (
            <Button
              key={preset.months}
              variant={months === preset.months ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMonthsInput(String(preset.months))}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </ToolPanel>

      {summary.error && <ErrorState title="Those loan terms could not be used" message={summary.error} />}

      {summary.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Monthly instalment"
              value={<span className="tabular-nums">{formatMoney(summary.value.payment)}</span>}
              hint={summary.value.interestFree ? 'no interest charged' : 'principal plus interest'}
            />
            <StatTile
              label="Total interest"
              value={<span className="tabular-nums">{formatMoney(summary.value.totalInterest)}</span>}
              hint={`${interestShare(summary.value)}% of everything you pay`}
            />
            <StatTile
              label="Total payable"
              value={<span className="tabular-nums">{formatMoney(summary.value.totalPaid)}</span>}
              hint={`over ${summary.value.months} months`}
            />
            <StatTile
              label="Amount borrowed"
              value={<span className="tabular-nums">{formatMoney(summary.value.principal)}</span>}
              hint="the principal"
            />
          </div>

          <ToolPanel
            title="Paying extra each month"
            description="The schedule is re-run with the higher payment, so the saving reflects the order interest is charged in."
          >
            <Input
              label="Extra paid every month (₹)"
              type="number"
              inputMode="decimal"
              step="any"
              value={extraInput}
              containerClassName="w-48"
              onChange={(event) => setExtraInput(event.target.value)}
            />
            {showExtra && prepayment ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Loan clears in"
                  value={<span className="tabular-nums">{prepayment.months}</span>}
                  hint={`${prepayment.monthsSaved} months sooner`}
                />
                <StatTile
                  label="Interest with the extra"
                  value={<span className="tabular-nums">{formatMoney(prepayment.totalInterest)}</span>}
                  hint="total over the shorter term"
                />
                <StatTile
                  label="Interest saved"
                  value={<span className="tabular-nums">{formatMoney(prepayment.interestSaved)}</span>}
                  hint="against the original schedule"
                />
                <StatTile
                  label="Extra paid in total"
                  value={<span className="tabular-nums">{formatMoney(extra * prepayment.months)}</span>}
                  hint={`${formatMoney(extra)} a month`}
                />
              </div>
            ) : (
              <p className="text-xs text-muted">
                Enter an amount above zero to see how much sooner the loan clears and how much interest it saves.
              </p>
            )}
          </ToolPanel>

          <ToolPanel
            title="Amortisation"
            description="The first twelve months. Every row adds up to the instalment."
            actions={
              <CopyButton
                value={`Month,Payment,Interest,Principal,Balance\n${scheduleText}`}
                label="Copy all as CSV"
              />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2 pr-3 font-medium">Month</th>
                    <th className="py-2 pr-3 font-medium">Instalment</th>
                    <th className="py-2 pr-3 font-medium">Interest</th>
                    <th className="py-2 pr-3 font-medium">Principal</th>
                    <th className="py-2 font-medium">Balance left</th>
                  </tr>
                </thead>
                <tbody>
                  {firstRows.map((row) => (
                    <tr key={row.number} className="border-b border-line/60">
                      <td className="py-1.5 pr-3 text-muted">{row.number}</td>
                      <td className="py-1.5 pr-3">{formatMoney(row.payment)}</td>
                      <td className="py-1.5 pr-3 text-danger">{formatMoney(row.interest)}</td>
                      <td className="py-1.5 pr-3 text-success">{formatMoney(row.principal)}</td>
                      <td className="py-1.5">{formatMoney(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > firstRows.length && (
              <p className="text-xs text-muted">
                Showing the first 12 of {rows.length} payments. Copy the CSV for the full schedule.
              </p>
            )}
          </ToolPanel>
        </>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">What this does not include.</strong> Processing fees, insurance, prepayment
          charges, GST and any rate change over the term are all outside this calculation. Your lender's APR — the
          figure that includes fees — will be higher than the interest rate entered here, and the real instalment
          will be higher too.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          The formula is{' '}
          <code className="font-mono">
            EMI = P × r × (1 + r)
            <sup>n</sup> ÷ ((1 + r)
            <sup>n</sup> − 1)
          </code>
          , where r is the annual rate divided by 12 and n is the number of months. The final instalment is
          corrected for rounding so the balance lands on exactly zero.
        </p>
      </div>

      {summary.value && <Badge variant="outline">Rounded to the nearest rupee</Badge>}
    </div>
  )
}

export default EmiCalculatorTool
