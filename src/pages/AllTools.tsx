import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories } from '@/data/categories'
import { searchTools, type StatusFilter, type ToolSort } from '@/data/registry'
import type { ToolCategoryId } from '@/types/tool'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Input, Select } from '@/components/ui/Form'
import { Seo } from '@/components/seo/Seo'
import { ToolCard } from '@/components/tools/ToolCard'
import { PageShell } from '@/components/layout/PageShell'

export function AllTools() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [category, setCategory] = useState<ToolCategoryId | 'all'>('all')
  // The directory opens on tools that actually work. The rest of the roadmap is
  // one click away rather than padding the default view.
  const [status, setStatus] = useState<StatusFilter>(() =>
    searchParams.get('q') ? 'all' : 'live',
  )
  const [sort, setSort] = useState<ToolSort>('name-asc')

  function updateQuery(next: string) {
    setQuery(next)
    // Searching means "find this tool" — do not hide roadmap matches behind a filter.
    if (next.trim()) setStatus('all')
    const params = new URLSearchParams(searchParams)
    if (next.trim()) params.set('q', next)
    else params.delete('q')
    setSearchParams(params, { replace: true })
  }

  const results = useMemo(
    () =>
      searchTools({
        query,
        category: category === 'all' ? undefined : category,
        status,
        sort,
      }),
    [query, category, status, sort],
  )

  // How many planned tools match the current search/category, used for the
  // "show the roadmap" prompt.
  const plannedCount = useMemo(
    () =>
      searchTools({
        query,
        category: category === 'all' ? undefined : category,
        status: 'planned',
        sort,
      }).length,
    [query, category, sort],
  )

  const available = results.filter((tool) => tool.status === 'live')
  const comingSoon = results.filter((tool) => tool.status === 'planned')
  const filtersActive = query.trim().length > 0 || category !== 'all' || status !== 'live'

  function resetFilters() {
    updateQuery('')
    setCategory('all')
    setStatus('live')
    setSort('name-asc')
  }

  return (
    <>
      <Seo
        title="All Tools"
        description="Browse every TOOLZEN tool in one place. Filter by category, search instantly and see which tools are available now."
        path="/tools"
      />

      <PageShell>
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All Tools</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Every TOOLZEN tool that works today. Search by name or filter by category — and switch
            to “All tools” to see the full roadmap, including tools still in development.
          </p>
        </header>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-4">
          <Input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search tools…"
            aria-label="Search tools"
            leading={<Icon name="search" size={17} />}
          />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-2" role="group" aria-label="Filter by category">
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  category === 'all'
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line text-muted hover:border-brand/40 hover:text-fg',
                )}
              >
                All categories
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    category === item.id
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line text-muted hover:border-brand/40 hover:text-fg',
                  )}
                >
                  {item.shortName}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Select
                aria-label="Filter by availability"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                containerClassName="w-40"
              >
                <option value="all">All tools</option>
                <option value="live">Available now</option>
                <option value="planned">Coming soon</option>
              </Select>

              <Select
                aria-label="Sort tools"
                value={sort}
                onChange={(event) => setSort(event.target.value as ToolSort)}
                containerClassName="w-44"
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="newest">Newest first</option>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? 'tool' : 'tools'} found
            {available.length > 0 && ` · ${available.length} available now`}
          </p>
        </div>

        {/* Roadmap prompt — keeps the default view focused on working tools. */}
        {status === 'live' && plannedCount > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3.5">
            <p className="text-sm text-muted">
              <span className="font-medium text-fg">{plannedCount}</span>{' '}
              {plannedCount === 1 ? 'more tool is' : 'more tools are'} on the roadmap and not usable
              yet.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setStatus('all')}>
              <Icon name="layers" size={15} />
              Show all {results.length + plannedCount} tools
            </Button>
          </div>
        )}

        {/* Results */}
        {results.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon="search"
            title="No tools match your filters"
            description={
              query.trim()
                ? `Nothing matched “${query.trim()}”. Try a different search term or clear the filters.`
                : 'Try a different category or clear the filters.'
            }
            action={
              filtersActive ? (
                <Button variant="secondary" onClick={resetFilters}>
                  <Icon name="refresh" size={16} />
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="mt-8 flex flex-col gap-12">
            {available.length > 0 && (
              <section aria-labelledby="available-heading">
                <h2 id="available-heading" className="text-lg font-semibold tracking-tight">
                  Available now
                  <span className="ml-2 text-sm font-normal text-muted">{available.length}</span>
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {available.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}

            {comingSoon.length > 0 && (
              <section aria-labelledby="coming-soon-heading">
                <h2 id="coming-soon-heading" className="text-lg font-semibold tracking-tight">
                  Coming soon
                  <span className="ml-2 text-sm font-normal text-muted">{comingSoon.length}</span>
                </h2>
                <p className="mt-1 text-sm text-muted">
                  These tools are planned. They are listed so you can see what is coming, but they
                  are not usable yet.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {comingSoon.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageShell>
    </>
  )
}

export default AllTools
