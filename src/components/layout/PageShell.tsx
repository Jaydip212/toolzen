import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageShellProps {
  children: ReactNode
  className?: string
}

/** Standard page padding and max width used by every route. */
export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn('tz-container py-10 sm:py-12', className)}>{children}</div>
}

export default PageShell
