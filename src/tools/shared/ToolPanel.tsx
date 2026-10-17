import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ToolPanelProps {
  title?: string
  /** Short explanatory line under the title. */
  description?: string
  /** Rendered on the right of the title row, e.g. a reset button. */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled section inside a tool workspace. */
export function ToolPanel({ title, description, actions, children, className }: ToolPanelProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export default ToolPanel
