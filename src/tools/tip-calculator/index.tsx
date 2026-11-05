import { useState } from 'react'
import { Input } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel } from '@/tools/shared'
import { calculateTip, formatCents } from '@/lib/phase7/money'

export function TipCalculator() {
  const [bill, setBill] = useState('100')
  const [tipPercent, setTipPercent] = useState('15')
  const [people, setPeople] = useState('2')

  const result = calculateTip({
    bill: Number(bill.trim()),
    tipPercent: Number(tipPercent.trim()),
    people: Number(people.trim()),
  })

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The bill" description="All arithmetic uses integer cents, so the split always adds up exactly.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input value={bill} onChange={(event) => setBill(event.target.value)} inputMode="decimal" label="Bill amount" aria-label="Bill amount" />
          <Input value={tipPercent} onChange={(event) => setTipPercent(event.target.value)} inputMode="decimal" label="Tip %" aria-label="Tip percentage" />
          <Input value={people} onChange={(event) => setPeople(event.target.value)} inputMode="numeric" label="People" aria-label="Number of people" />
        </div>
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot calculate that" message={result.error} />
      ) : (
        <ToolPanel title="Result">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tip" value={formatCents(result.result.tipCents)} />
            <StatTile label="Total" value={formatCents(result.result.totalCents)} />
            <StatTile label="Each person" value={formatCents(result.result.perPersonCents[0]!)} />
          </div>
          {result.result.perPersonCents.length > 1 && (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Shares: {result.result.perPersonCents.map((share) => formatCents(share)).join(' · ')} —
              any leftover pennies go to the first shares, so the total is exact.
            </p>
          )}
        </ToolPanel>
      )}
    </div>
  )
}

export default TipCalculator
