import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, setTheme, type Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface ThemeToggleProps {
  className?: string
}

/** Switches between light and dark mode and remembers the choice. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme())

  // Keep the document class in sync with React state.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Follow the OS preference while the user has not made an explicit choice.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null
      try {
        stored = localStorage.getItem('toolzen-theme')
      } catch {
        /* ignore */
      }
      if (!stored) setThemeState(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  function toggle() {
    const next: Theme = isDark ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  )
}

export default ThemeToggle
