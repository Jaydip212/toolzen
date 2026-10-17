import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  FREQUENCIES,
  doublingYears,
  formatMoney,
  grow,
  lumpSum,
  realValue,
} from './logic'

export function CompoundInterestCalculatorTool() {
  const [principalInput, setPrincipalInput] = useState('100000')
  const [rateInput, setRateInput] = useState('10')
  const [yearsInput, setYearsInput] = useState('10')
  const [frequency, setFrequency] = useState('1')
  const [depositInput, setDepositInput] = useState('0')
  const [inflationInput, setInflationInput] = useState('6')

  const principal = Number(principalInput)
  const rate = Number(rateInput)
  const years = Number(yearsInput)
  const compoundsPerYear = Number(frequency)
  const deposit = Number(depositInput)
  const inflation = Number(inflationInput)

  const result = useMemo(() => {
    try {
      return { error: null, value: grow(principal, rate, years, compoundsPerYear, deposit) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those figures could not be used.', value: null }
    }
  }, [principal, rate, years, compoundsPerYear, deposit])

  const check = useMemo(() => {
    try {
      return { error: null, value: lumpSum(principal, rate, years, compoundsPerYear) }
    } catch {
      return { error: null, value: null }
    }
  }, [principal, rate, years, compoundsPerYear])

  const purchasing = useMemo(() => {
    if (!result.value) return null
    try {
      return realValue(result.value.total, inflation, years)
    } catch {
      return null
    }
  }, [result.value, inflation, years])

  const doubling = useMemo(() => {
    if (rate <= 0) return null
    return doublingYears(rate, compoundsPerYear)
  }, [rate, compoundsPerYear])

  const csv = useMemo(() => {
    if (!result.value) return ''
    const header = 'Year,Balance,Interest this year,Contributed'
    const body = result.value.rows.map((row) => `${row.year},${row.balance},${row.interest},${row.contributed}`)
    return [header, ...body].join('\n')
  }, [result.value])

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="The investment"
        description="Interest is added to the balance, and the next period's interest is charged on the new total."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Starting amount (₹)"
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
            label="Years"
            type="number"
            inputMode="numeric"
            step="1"
            value={yearsInput}
            containerClassName="w-28"
            onChange={(event) => setYearsInput(event.target.value)}
          />
        </div>

        <SegmentedControl
          label="Compounding"
          value={frequency}
          onChange={setFrequency}
          size="sm"
          options={FREQUENCIES.map((entry) => ({ value: String(entry.value), label: entry.label }))}
        />

        <Input
          label="Added every month (₹)"
          type="number"
          inputMode="decimal"
          step="any"
          value={depositInput}
          containerClassName="w-48"
          hint="Deposits are applied at the end of each month."
          onChange={(event) => setDepositInput(event.target.value)}
        />

        <div className="flex flex-wrap gap-1.5">
          {[5, 10, 15, 20, 25, 30].map((option) => (
            <Button
              key={option}
              variant={years === option ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setYearsInput(String(option))}
            >
              {option} years
            </Button>
          ))}
        </div>
      </ToolPanel>

      {result.error && <ErrorState title="Those figures could not be used" message={result.error} />}

      {result.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Final amount"
              value={<span className="tabular-nums">{formatMoney(result.value.total)}</span>}
              hint={`after ${years} years`}
            />
            <StatTile
              label="Interest earned"
              value={<span className="tabular-nums">{formatMoney(result.value.interest)}</span>}
              hint="on top of everything paid in"
            />
            <StatTile
              label="Money paid in"
              value={<span className="tabular-nums">{formatMoney(result.value.principal + deposit * 12 * Math.max(years, 0))}</span>}
              hint="starting amount plus deposits"
            />
            <StatTile
              label="Effective annual rate"
              value={<span className="tabular-nums">{result.value.effectiveAnnualRate}%</span>}
              hint={
                compoundsPerYear === 1
                  ? 'same as quoted'
                  : 'what annual compounding would need to match'
              }
            />
          </div>

          {deposit > 0 && (
            <p className="text-xs text-muted">
              Interest is {(result.value.interest / Math.max(result.value.total, 1) * 100).toFixed(1)}% of the
              final amount — the rest is your own money going back to you.
            </p>
          )}

          {result.value.rows.length > 0 && (
            <ToolPanel
              title="Year by year"
              description="Balance at the end of each year, with the interest earned that year."
              actions={<CopyButton value={csv} label="Copy as CSV" />}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="py-2 pr-3 font-medium">Year</th>
                      <th className="py-2 pr-3 font-medium">Balance</th>
                      <th className="py-2 pr-3 font-medium">Interest that year</th>
                      <th className="py-2 pr-3 font-medium">Paid in so far</th>
                      <th className="py-2 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.rows.map((row, index) => {
                      const previous = index === 0 ? result.value.principal : result.value.rows[index - 1].balance
                      const growth = previous === 0 ? 0 : ((row.balance - previous) / previous) * 100
                      return (
                        <tr key={row.year} className="border-b border-line/60">
                          <td className="py-1.5 pr-3 text-muted">{row.year}</td>
                          <td className="py-1.5 pr-3 font-medium">{formatMoney(row.balance)}</td>
                          <td className="py-1.5 pr-3 text-success">{formatMoney(row.interest)}</td>
                          <td className="py-1.5 pr-3">{formatMoney(row.contributed)}</td>
                          <td className="py-1.5">{growth.toFixed(2)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </ToolPanel>
          )}

          <ToolPanel
            title="Doubling time and purchasing power"
            description="Two ways of looking at the same number."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {doubling && (
                <>
                  <StatTile
                    label="Doubles in"
                    value={<span className="tabular-nums">{doubling.exact ?? '—'} years</span>}
                    hint="at the quoted compounding"
                  />
                  <StatTile
                    label="Rule of 72 says"
                    value={<span className="tabular-nums">{doubling.estimate} years</span>}
                    hint="72 ÷ the rate — a quick check"
                  />
                </>
              )}
              {purchasing !== null && (
                <StatTile
                  label={`Worth in today's money`}
                  value={<span className="tabular-nums">{formatMoney(purchasing)}</span>}
                  hint={`if prices rise ${inflation}% a year`}
                />
              )}
              {check.value !== null && deposit === 0 && (
                <StatTile
                  label="Closed-form check"
                  value={<span className="tabular-nums">{formatMoney(check.value)}</span>}
                  hint="P × (1 + r/n)^(n·t) — matches the table"
                />
              )}
            </div>
            <Input
              label="Inflation rate (% per year)"
              type="number"
              inputMode="decimal"
              step="any"
              value={inflationInput}
              containerClassName="w-48"
              onChange={(event) => setInflationInput(event.target.value)}
            />
          </ToolPanel>
        </>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">What this assumes.</strong> The rate never changes, deposits are made at the
          end of every month, and no tax is deducted. Monthly deposits at the start of the month would earn a
          little more, and this tool does not claim otherwise.
        </p>
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-fg">Why the effective rate is higher.</strong> ₹1,00,000 at 12% compounded
          monthly grows by 12.68% in a year, not 12% — each month's interest starts earning its own interest.
        </p>
      </div>
    </div>
  )
}

export default CompoundInterestCalculatorTool
