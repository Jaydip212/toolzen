import { Link } from 'react-router-dom'
import type { Tool } from '@/types/tool'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'

export interface ToolCardProps {
  tool: Tool
  className?: string
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const isPlanned = tool.status === 'planned'

  return (
    <Link
      to={tool.route}
      className={cn(
        'group tz-card flex flex-col gap-3 p-5 transition duration-200',
        'hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isPlanned ? 'bg-surface-2 text-muted' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon name={tool.icon} size={19} />
        </span>
        {isPlanned && <Badge variant="outline">Coming soon</Badge>}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold tracking-tight text-fg group-hover:text-brand">
          {tool.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{tool.description}</p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon name={tool.processingMode === 'client' ? 'cpu' : 'globe'} size={13} />
        <span>{tool.processingMode === 'client' ? 'Runs in your browser' : 'Server-assisted'}</span>
      </div>
    </Link>
  )
}

export default ToolCard
