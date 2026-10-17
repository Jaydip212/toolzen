import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/ui/CopyButton'
import { DownloadButton } from './DownloadButton'

export interface OutputAreaProps {
  /** The text to show. An empty string renders the placeholder instead. */
  value: string
  label?: string
  /** When set, a Download button is shown next to Copy. */
  filename?: string
  mimeType?: string
  rows?: number
  placeholder?: string
  /** Extra buttons rendered on the action row. */
  actions?: ReactNode
  className?: string
}

/**
 * Read-only output block with copy and download actions.
 * Used by the text, data and developer tools for plain-text results.
 */
export function OutputArea({
  value,
  label,
  filename,
  mimeType,
  rows = 12,
  placeholder = 'Output will appear here…',
  actions,
  className,
}: OutputAreaProps) {
  const hasValue = value.length > 0

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <p className="text-sm font-medium text-fg">{label}</p>}

      <div className="tz-scroll overflow-hidden rounded-xl border border-line bg-surface-2/40">
        <textarea
          readOnly
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-label={label ?? 'Output'}
          spellCheck={false}
          className="tz-scroll block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-fg outline-none placeholder:text-muted/70"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={value} label="Copy" disabled={!hasValue} />
        {filename && <DownloadButton filename={filename} text={value} mimeType={mimeType} />}
        {actions}
      </div>
    </div>
  )
}

export default OutputArea
