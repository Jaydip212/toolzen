import { Link, useParams } from 'react-router-dom'
import { categories, categoryRoute, getCategory } from '@/data/categories'
import { toolsByCategory } from '@/data/registry'
import { breadcrumbSchema } from '@/lib/schema'
import type { ToolCategoryId } from '@/types/tool'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { AdSlot } from '@/components/ads/AdSlot'
import { Seo } from '@/components/seo/Seo'
import { ToolCard } from '@/components/tools/ToolCard'
import { PageShell } from '@/components/layout/PageShell'
import { NotFound } from './NotFound'

export function CategoryPage() {
  const { categoryId = '' } = useParams()
  const category = getCategory(categoryId as ToolCategoryId)

  if (!category) return <NotFound />

  const { live, planned } = toolsByCategory(category.id)
  const otherCategories = categories.filter((item) => item.id !== category.id)

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

        <AdSlot placement="category" className="mt-8" />

        {live.length > 0 ? (
          <section className="mt-10" aria-labelledby="available-heading">
            <h2 id="available-heading" className="text-lg font-semibold tracking-tight">
              Available now
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {live.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
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

        {planned.length > 0 && (
          <section className="mt-12" aria-labelledby="coming-soon-heading">
            <h2 id="coming-soon-heading" className="text-lg font-semibold tracking-tight">
              Coming soon
              <span className="ml-2 text-sm font-normal text-muted">{planned.length}</span>
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {planned.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14" aria-labelledby="other-categories">
          <h2 id="other-categories" className="text-lg font-semibold tracking-tight">
            Other categories
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherCategories.map((item) => (
              <Link
                key={item.id}
                to={categoryRoute(item.id)}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-brand/40 hover:text-fg"
              >
                <Icon name={item.icon} size={15} />
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  )
}

export default CategoryPage
