import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { liveTools, searchTools } from '@/data/registry'
import { categoryName } from '@/data/categories'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'

export interface ToolSearchProps {
  open: boolean
  onClose: () => void
}

/** Command-palette style tool search. Fully keyboard operable. */
export function ToolSearch({ open, onClose }: ToolSearchProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const trimmed = query.trim()

  const results = useMemo(() => {
    if (!trimmed) return liveTools().slice(0, 8)
    return searchTools({ query: trimmed }).slice(0, 8)
  }, [trimmed])

  // Reset the highlighted row whenever the result set changes.
  useEffect(() => {
    setActive(0)
  }, [trimmed])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  if (!open) return null

  function go(route: string) {
    navigate(route)
    onClose()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((prev) => (results.length === 0 ? 0 : (prev - 1 + results.length) % results.length))
      return
    }
    if (event.key === 'Enter') {
      const selected = results[active]
      if (selected) {
        event.preventDefault()
        go(selected.route)
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="relative z-10 w-full max-w-xl animate-fade-up overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            type="search"
            placeholder="Search tools…"
            aria-label="Search tools"
            aria-controls="tool-search-results"
            autoComplete="off"
            className="h-14 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div id="tool-search-results" className="tz-scroll max-h-[60vh] overflow-y-auto p-2" role="listbox">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
            {trimmed ? `Results for “${trimmed}”` : 'Available now'}
          </p>

          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No tools match “{trimmed}”.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((tool, index) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(tool.route)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      index === active ? 'bg-surface-2' : 'hover:bg-surface-2/70',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icon name={tool.icon} size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-fg">{tool.name}</span>
                        {tool.status === 'planned' && <Badge variant="outline">Coming soon</Badge>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {categoryName(tool.categories[0])} · {tool.description}
                      </span>
                    </span>
                    <Icon name="arrow-right" size={16} className="shrink-0 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-muted">
          <span>↑↓ to navigate · Enter to open</span>
          <button
            type="button"
            onClick={() => go(trimmed ? `/tools?q=${encodeURIComponent(trimmed)}` : '/tools')}
            className="font-medium text-brand hover:underline"
          >
            Browse all tools
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ToolSearch
