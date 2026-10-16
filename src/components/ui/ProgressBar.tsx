import { clamp, cn } from '@/lib/utils'

export interface ProgressBarProps {
  /** Progress from 0 to 100. Omit for an indeterminate bar. */
  value?: number
  className?: string
  label?: string
  /** Colour of the filled portion. */
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}

const toneClasses: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function ProgressBar({ value, className, label, tone = 'brand' }: ProgressBarProps) {
  const indeterminate = value === undefined
  const pct = indeterminate ? 0 : clamp(value, 0, 100)

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          toneClasses[tone],
          indeterminate && 'w-1/3 animate-pulse',
        )}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  )
}

export default ProgressBar
