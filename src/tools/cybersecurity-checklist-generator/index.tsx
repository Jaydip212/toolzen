import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { cn } from '@/lib/utils'
import {
  CONTEXTS,
  buildChecklist,
  checklistStats,
  formatEstimate,
  groupChecklist,
  toCsv,
  toMarkdown,
  type ContextId,
  type Priority,
} from './logic'

const PRIORITIES: Array<{ id: Priority; label: string; hint: string }> = [
  { id: 'essential', label: 'Essential', hint: 'Do these first — the highest-value, lowest-effort basics.' },
  { id: 'recommended', label: 'Recommended', hint: 'Clear improvements once the essentials are in place.' },
  { id: 'advanced', label: 'Advanced', hint: 'Worth doing, but they need more time or a specific setup.' },
]

const PRIORITY_BADGE: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  essential: 'danger',
  recommended: 'warning',
  advanced: 'neutral',
}

export function CybersecurityChecklistGeneratorTool() {
  const [context, setContext] = useState<ContextId>('personal')
  const [priorities, setPriorities] = useState<Priority[]>(['essential', 'recommended', 'advanced'])
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const items = useMemo(() => buildChecklist({ context, priorities }), [context, priorities])
  const groups = useMemo(() => groupChecklist(items), [items])
  const stats = useMemo(() => checklistStats(items), [items])
  const done = items.filter((item) => checked.has(item.id)).length
  const progress = items.length === 0 ? 0 : Math.round((done / items.length) * 100)

  function toggle(id: string) {
    setChecked((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePriority(priority: Priority) {
    setPriorities((previous) =>
      previous.includes(priority)
        ? previous.filter((entry) => entry !== priority)
        : [...previous, priority],
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="What are you protecting?"
        description="The checklist is filtered to the context you choose — a personal setup should not be told to write a breach-notification policy."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {CONTEXTS.map((entry) => {
            const active = entry.id === context
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setContext(entry.id)
                  setChecked(new Set())
                }}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface-2/40 hover:border-brand/50',
                )}
              >
                <span className={cn('text-sm font-medium', active ? 'text-brand' : 'text-fg')}>
                  {entry.label}
                </span>
                <span className="text-xs leading-relaxed text-muted">{entry.description}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {PRIORITIES.map((entry) => (
            <Checkbox
              key={entry.id}
              label={entry.label}
              hint={entry.hint}
              checked={priorities.includes(entry.id)}
              onChange={() => togglePriority(entry.id)}
            />
          ))}
        </div>
      </ToolPanel>

      {items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Items" value={stats.total} hint={`${stats.essential} essential`} />
            <StatTile label="Quick wins" value={stats.quick} hint="under 5 minutes each" />
            <StatTile label="Estimated effort" value={formatEstimate(stats.estimatedMinutes)} />
            <StatTile label="Done" value={`${done}/${stats.total}`} hint={`${progress}% complete`} />
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Checklist progress"
            />
          </div>

          <ToolPanel
            title="Your checklist"
            description="Ticking a box is local to this page — nothing is saved or sent anywhere."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={toMarkdown(items, context)} label="Copy Markdown" />
                <CopyButton value={toCsv(items)} label="Copy CSV" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChecked(new Set())}
                  disabled={done === 0}
                >
                  Reset ticks
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.category.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-fg">{group.category.label}</h3>
                    <span className="text-xs text-muted">{group.category.description}</span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => {
                      const isChecked = checked.has(item.id)
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            'rounded-xl border p-3 transition-colors',
                            isChecked
                              ? 'border-success/40 bg-success/8'
                              : 'border-line bg-surface-2/30',
                          )}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(item.id)}
                              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-brand"
                            />
                            <span className="flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'text-sm font-medium',
                                    isChecked ? 'text-muted line-through' : 'text-fg',
                                  )}
                                >
                                  {item.title}
                                </span>
                                <Badge variant={PRIORITY_BADGE[item.priority]}>{item.priority}</Badge>
                                <Badge variant="outline">{item.effort}</Badge>
                              </span>
                              <span className="mt-1 block text-sm leading-relaxed text-muted">
                                {item.why}
                              </span>
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </ToolPanel>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            Time estimates are rough midpoints per effort band, not a promise. This is general
            guidance written for a typical small setup — it is not a compliance certification and it
            cannot know your specific threat model.
          </p>
        </>
      ) : (
        <EmptyState
          icon="check-square"
          title="No items match those filters"
          description={`Every checklist item is either outside the ${CONTEXTS.find((entry) => entry.id === context)?.label.toLowerCase()} context or outside the priorities you selected. Re-enable a priority to see items again.`}
          action={
            <Button
              variant="secondary"
              onClick={() => setPriorities(['essential', 'recommended', 'advanced'])}
            >
              Show all priorities
            </Button>
          }
        />
      )}
    </div>
  )
}

export default CybersecurityChecklistGeneratorTool
