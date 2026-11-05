import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { ToolCard } from '@/components/tools/ToolCard'
import { getTool } from '@/data/registry'
import type { Tool } from '@/types/tool'
import {
  clearFavorites,
  clearRecent,
  getFavorites,
  getRecent,
  isRecentDisabled,
  setRecentDisabled,
} from '@/lib/usage'

interface PersonalToolsProps {
  /** Resolved live tools, used to drop history entries that 404. */
  liveIds: Set<string>
}

interface PersonalSection {
  title: string
  description: string
  tools: Tool[]
  onClear?: () => void
  clearLabel?: string
  extra?: React.ReactNode
}

/**
 * The visitor's own tools: favourites and recently used, straight from
 * localStorage. Sections vanish when there is nothing to show, and history
 * entries pointing at tools that no longer exist are dropped rather than
 * rendered as dead cards.
 */
export function PersonalTools({ liveIds }: PersonalToolsProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [recentOff, setRecentOff] = useState(false)

  function reload() {
    setFavorites(getFavorites().filter((id) => liveIds.has(id)))
    setRecent(getRecent().filter((entry) => liveIds.has(entry.id)).map((entry) => entry.id))
    setRecentOff(isRecentDisabled())
  }

  useEffect(reload, [liveIds])

  const favoriteTools = favorites.map((id) => getTool(id)).filter((tool): tool is Tool => Boolean(tool))
  const recentTools = recent.map((id) => getTool(id)).filter((tool): tool is Tool => Boolean(tool))

  if (favoriteTools.length === 0 && (recentTools.length === 0 || recentOff)) return null

  const sections: PersonalSection[] = []
  if (favoriteTools.length > 0) {
    sections.push({
      title: 'Your favourites',
      description: 'Saved in this browser only. Star a tool to pin it here.',
      tools: favoriteTools,
      onClear: () => {
        clearFavorites()
        reload()
      },
      clearLabel: 'Clear favourites',
    })
  }
  if (!recentOff && recentTools.length > 0) {
    sections.push({
      title: 'Recently used',
      description: 'The last ten tools you opened, remembered on this device. Only tool names are stored — never files or input.',
      tools: recentTools,
      onClear: () => {
        clearRecent()
        reload()
      },
      clearLabel: 'Clear history',
      extra: (
        <button
          type="button"
          className="text-xs font-medium text-muted transition-colors hover:text-fg"
          onClick={() => {
            setRecentDisabled(true)
            reload()
          }}
        >
          Turn off history
        </button>
      ),
    })
  }

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section key={section.title} aria-labelledby={`personal-${section.title.replace(/\s+/g, '-').toLowerCase()}`}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id={`personal-${section.title.replace(/\s+/g, '-').toLowerCase()}`}
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <Icon name={section.title === 'Your favourites' ? 'star' : 'clock'} size={17} className="text-brand" />
                {section.title}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{section.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {section.extra}
              {section.onClear && (
                <button
                  type="button"
                  className="text-xs font-medium text-muted transition-colors hover:text-fg"
                  onClick={section.onClear}
                >
                  {section.clearLabel}
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.tools.map((tool) => (
              <ToolCard key={`${section.title}-${tool.id}`} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default PersonalTools
