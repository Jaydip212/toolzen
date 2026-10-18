import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Icon } from '@/components/ui/Icon'
import { ToolPanel } from '@/tools/shared'
import { CLASS_LABELS, searchStatusCodes, type StatusClass } from './logic'

const CLASS_ORDER: StatusClass[] = ['informational', 'success', 'redirection', 'client-error', 'server-error']

const CLASS_ACCENTS: Record<StatusClass, string> = {
  informational: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  redirection: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'client-error': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'server-error': 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function HttpStatusReferenceTool() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchStatusCodes(query), [query])

  const grouped = CLASS_ORDER.map((statusClass) => ({
    statusClass,
    entries: results.filter((entry) => entry.statusClass === statusClass),
  })).filter((group) => group.entries.length > 0)

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel
        title="Find a status code"
        description="Search by number, name or what it means — try “redirect” or “429”."
      >
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search status codes…"
          aria-label="Search status codes"
          leading={<Icon name="search" size={16} />}
        />
        {query.trim() !== '' && (
          <p className="text-xs text-muted" aria-live="polite">
            {results.length} of {results.length === 1 ? 'match' : 'matches'}
          </p>
        )}
      </ToolPanel>

      {results.length === 0 && (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          Nothing matches “{query.trim()}”. Try a number like 503, or a word like “timeout”.
        </p>
      )}

      {grouped.map((group) => (
        <ToolPanel key={group.statusClass} title={CLASS_LABELS[group.statusClass]}>
          <div className="flex flex-col divide-y divide-line">
            {group.entries.map((entry) => (
              <div key={entry.code} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                <span
                  className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-semibold ${CLASS_ACCENTS[entry.statusClass]}`}
                >
                  {entry.code}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{entry.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{entry.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </ToolPanel>
      ))}
    </div>
  )
}

export default HttpStatusReferenceTool
