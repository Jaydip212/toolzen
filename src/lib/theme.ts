export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'toolzen-theme'

/** Read the persisted theme preference, if any. */
export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Resolve the operating-system colour-scheme preference. */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * The theme to use on first render: an explicit user choice wins, otherwise the
 * system preference is used.
 */
export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

/** Apply a theme to the document root. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Apply and persist a theme choice. */
export function setTheme(theme: Theme): void {
  applyTheme(theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* Storage may be unavailable (private mode); the class is still applied. */
  }
}
