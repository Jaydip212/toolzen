import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}

/** A single result metric displayed on a tool page. */
export function StatTile({ label, value, hint, className }: StatTileProps) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface-2/50 p-3.5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default StatTile
