import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categories, categoryRoute, getCategory } from '@/data/categories'
import { categoryStats, toolsByCategory } from '@/data/registry'
import { breadcrumbSchema } from '@/lib/schema'
import type { ToolCategoryId } from '@/types/tool'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Form'
import { AdSlot } from '@/components/ads/AdSlot'
import { SponsorSlot } from '@/components/ads/SponsorSlot'
import { trackEvent } from '@/lib/analytics'
import { GUIDES } from '@/data/guides'
import { filterToolsByQuery, guidesForCategory, relatedCategories } from '@/lib/phase8/discovery'
import { Seo } from '@/components/seo/Seo'
import { ToolCard } from '@/components/tools/ToolCard'
import { PageShell } from '@/components/layout/PageShell'
import { NotFound } from './NotFound'

export function CategoryPage() {
  const { categoryId = '' } = useParams()
  const category = getCategory(categoryId as ToolCategoryId)
  const [query, setQuery] = useState('')

  useEffect(() => {
    trackEvent('category_view', { categoryId })
    setQuery('')
  }, [categoryId])

  if (!category) return <NotFound />

  const { live, planned } = toolsByCategory(category.id)
  const visibleLive = filterToolsByQuery(live, query)
  const visiblePlanned = filterToolsByQuery(planned, query)
  const searching = query.trim() !== ''

  const related = relatedCategories(
    categories,
    category.id,
    (id) => categoryStats(id as ToolCategoryId).live,
    4,
  )
  const guides = guidesForCategory(GUIDES, new Set(live.map((tool) => tool.id)), 3)

  return (
    <>
      <Seo
        title={`${category.name} — Free Online Tools`}
        description={category.description}
        path={categoryRoute(category.id)}
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'All Tools', path: '/tools' },
          { name: category.name, path: categoryRoute(category.id) },
        ])}
      />

      <PageShell>
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li>
              <Link to="/" className="transition-colors hover:text-fg">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li>
              <Link to="/tools" className="transition-colors hover:text-fg">
                All Tools
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevron-right" size={14} />
            </li>
            <li aria-current="page" className="font-medium text-fg">
              {category.name}
            </li>
          </ol>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              category.accent.chip,
              category.accent.icon,
            )}
          >
            <Icon name={category.icon} size={24} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
              {live.length > 0 ? (
                <Badge variant="brand">{live.length} available</Badge>
              ) : (
                <Badge variant="outline">In development</Badge>
              )}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {category.description}
            </p>
          </div>
        </header>

        {/* Search within the category — filters the registry, no new routes. */}
        <div className="mt-8 max-w-xl">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${category.name.toLowerCase()}…`}
            aria-label={`Search tools in ${category.name}`}
            leading={<Icon name="search" size={17} />}
          />
          {searching && (
            <p className="mt-2 text-xs text-muted" aria-live="polite">
              {visibleLive.length + visiblePlanned.length} of {live.length + planned.length} tools
              match “{query.trim()}”
            </p>
          )}
        </div>

        <AdSlot placement="category" className="mt-8" />
        <SponsorSlot placement="category" />

        {visibleLive.length > 0 ? (
          <section className="mt-10" aria-labelledby="available-heading">
            <h2 id="available-heading" className="text-lg font-semibold tracking-tight">
              Available now
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleLive.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        ) : searching ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Icon name="search" size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold">No tools match that search</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
              Try a different word, or{' '}
              <Link to="/tools" className="font-medium text-brand hover:underline">
                search all tools
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Icon name="lightbulb" size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold">No tools in this category yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
              Nothing here is available to use yet. The tools below are planned — we publish them
              only once they genuinely work.
            </p>
          </div>
        )}

        {visiblePlanned.length > 0 && (
          <section className="mt-12" aria-labelledby="coming-soon-heading">
            <h2 id="coming-soon-heading" className="text-lg font-semibold tracking-tight">
              Coming soon
              <span className="ml-2 text-sm font-normal text-muted">{visiblePlanned.length}</span>
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePlanned.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )}

        {guides.length > 0 && (
          <section className="mt-14" aria-labelledby="category-guides">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="category-guides" className="tz-section-title">
                Guides for this category
              </h2>
              <Link to="/guides" className="text-sm font-medium text-brand transition-colors hover:underline">
                All guides →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  to={`/guides/${guide.slug}`}
                  className="tz-card tz-card-interactive group flex flex-col p-5"
                >
                  <Icon name="book-open" size={18} className="text-brand" />
                  <h3 className="mt-3 text-sm font-semibold tracking-tight text-fg group-hover:text-brand">
                    {guide.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{guide.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14" aria-labelledby="other-categories">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="tz-eyebrow">Keep exploring</p>
              <h2 id="other-categories" className="tz-section-title mt-2">
                Related categories
              </h2>
            </div>
            <Link to="/tools" className="text-sm font-medium text-brand transition-colors hover:underline">
              All categories →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.id}
                to={categoryRoute(item.id)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-muted transition-colors hover:border-brand/40 hover:text-fg"
              >
                <Icon name={item.icon} size={15} />
                {item.name}
                <span className="text-xs tabular-nums text-muted">
                  {categoryStats(item.id).live}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  )
}

export default CategoryPage
