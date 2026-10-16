import { useId } from 'react'
import { cn } from '@/lib/utils'

interface LogoMarkProps {
  size?: number
  className?: string
}

/** The TOOLZEN glyph: a geometric "Z" inside a gradient rounded square. */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const gradientId = useId()
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${gradientId})`} />
      <path
        d="M18 20 H42 L22 44 H46"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  size?: number
  className?: string
  /** Hide the "TOOLZEN" wordmark and render the glyph only. */
  markOnly?: boolean
}

/** Full lockup: glyph plus wordmark. */
export function Logo({ size = 32, className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {!markOnly && (
        <span className="text-[1.0625rem] font-semibold leading-none tracking-tight">
          <span className="text-fg">TOOL</span>
          <span className="text-brand">ZEN</span>
        </span>
      )}
    </span>
  )
}

export default Logo
