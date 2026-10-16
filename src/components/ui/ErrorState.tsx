import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface ErrorStateProps {
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

/** Inline error panel used by tool pages when processing fails. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/8 p-4 text-sm',
        className,
      )}
    >
      <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-danger" />
      <div className="flex-1">
        <p className="font-medium text-fg">{title}</p>
        <p className="mt-1 leading-relaxed text-muted">{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

export default ErrorState
