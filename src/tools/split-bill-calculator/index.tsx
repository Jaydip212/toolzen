import { useState } from 'react'
import { Input } from '@/components/ui/Form'
import { StatTile } from '@/components/tools/StatTile'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel } from '@/tools/shared'
import { calculateSplitBill, formatCents } from '@/lib/phase7/money'

export function SplitBillCalculator() {
  const [total, setTotal] = useState('90')
  const [people, setPeople] = useState('3')
  const [tipPercent, setTipPercent] = useState('0')

  const result = calculateSplitBill({
    total: Number(total.trim()),
    people: Number(people.trim()),
    tipPercent: Number(tipPercent.trim()),
  })

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The bill" description="Optional tip is added first; the total is then divided exactly, to the penny.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input value={total} onChange={(event) => setTotal(event.target.value)} inputMode="decimal" label="Bill total" aria-label="Bill total" />
          <Input value={people} onChange={(event) => setPeople(event.target.value)} inputMode="numeric" label="People" aria-label="Number of people" />
          <Input value={tipPercent} onChange={(event) => setTipPercent(event.target.value)} inputMode="decimal" label="Tip % (optional)" aria-label="Tip percentage" />
        </div>
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot split that bill" message={result.error} />
      ) : (
        <ToolPanel title="Result">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tip" value={formatCents(result.result.tipCents)} />
            <StatTile label="Total with tip" value={formatCents(result.result.totalCents)} />
            <StatTile label="Each person" value={formatCents(result.result.perPersonCents[0]!)} />
          </div>
          <ul className="mt-4 flex flex-col gap-1 text-sm text-fg">
            {result.result.perPersonCents.map((share, index) => (
              <li key={index} className="flex justify-between border-b border-line py-1.5 last:border-0">
                <span className="text-muted">Person {index + 1}</span>
                <span className="font-medium">{formatCents(share)}</span>
              </li>
            ))}
          </ul>
        </ToolPanel>
      )}
    </div>
  )
}

export default SplitBillCalculator
