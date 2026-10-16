import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

/** A shimmering placeholder used while content loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-lg bg-surface-2', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

export default Skeleton
