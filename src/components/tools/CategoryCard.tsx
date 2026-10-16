import { Link } from 'react-router-dom'
import { categoryRoute } from '@/data/categories'
import { categoryStats } from '@/data/registry'
import type { Category } from '@/types/tool'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'

export interface CategoryCardProps {
  category: Category
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const { live, total } = categoryStats(category.id)

  return (
    <Link
      to={categoryRoute(category.id)}
      className={cn(
        'group tz-card flex flex-col gap-4 p-5 transition duration-200',
        'hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl',
          category.accent.chip,
          category.accent.icon,
        )}
      >
        <Icon name={category.icon} size={21} />
      </span>

      <div className="flex-1">
        <h3 className="text-sm font-semibold tracking-tight text-fg group-hover:text-brand">
          {category.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{category.tagline}</p>
      </div>

      <div className="flex items-center justify-between">
        {live > 0 ? (
          <Badge variant="brand">
            {live} available
          </Badge>
        ) : (
          <Badge variant="outline">In development</Badge>
        )}
        <span className="text-xs text-muted">
          {total} {total === 1 ? 'tool' : 'tools'}
        </span>
      </div>
    </Link>
  )
}

export default CategoryCard
