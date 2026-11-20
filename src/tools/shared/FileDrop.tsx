import { useCallback, useId, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface FileDropProps {
  /** Comma-separated list of accepted types, e.g. `image/*,.pdf`. */
  accept?: string
  multiple?: boolean
  /** Called with the selected or dropped files. Never called with an empty list. */
  onFiles: (files: File[]) => void
  /** Primary call to action. */
  label?: string
  /** Secondary line, e.g. the accepted formats and size limit. */
  hint?: string
  /**
   * Per-file size ceiling in bytes. Oversized files are rejected here with a
   * clear message instead of being read into memory and crashing the tab.
   * Defaults to 100 MB; tools whose hint promises a tighter limit pass it.
   */
  maxFileSizeBytes?: number
  disabled?: boolean
  className?: string
}

/** The default per-file ceiling, generous for browser-only processing. */
export const DEFAULT_MAX_FILE_BYTES = 100 * 1024 * 1024

/**
 * Whether a file satisfies an `accept` attribute.
 *
 * The browser enforces `accept` on the picker, but a drag-and-drop bypasses it
 * entirely, so the same rule has to be applied here. Three token forms are
 * understood: extensions (`.pdf`), exact MIME types
 * (`application/pdf`), and wildcards (`image/*`). Extensions are matched
 * against the file name because some systems report an empty MIME type for
 * documents — the extension is the reliable signal in that case.
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0) return true

  const name = file.name.toLowerCase()
  const type = (file.type ?? '').toLowerCase()
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token)
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1))
    return type === token
  })
}

/**
 * Accessible drag-and-drop file picker.
 *
 * The whole surface is a button, so it is reachable by keyboard and announced
 * correctly. Dropped files are handed straight to the caller — nothing is read
 * or uploaded here.
 */
export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  label = 'Choose a file',
  hint,
  maxFileSizeBytes = DEFAULT_MAX_FILE_BYTES,
  disabled = false,
  className,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  // Counts enter/leave pairs so dragging over child nodes does not flicker.
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emit = useCallback(
    (list: FileList | null | undefined) => {
      if (!list || list.length === 0) return
      const files = Array.from(list)

      // The picker enforces `accept`, but a drop does not — validate both
      // routes here so a wrong-type file is named instead of silently loaded.
      const wrongType = files.filter((file) => !fileMatchesAccept(file, accept))
      const oversized = files.filter(
        (file) => fileMatchesAccept(file, accept) && file.size > maxFileSizeBytes,
      )
      const accepted = files.filter(
        (file) => fileMatchesAccept(file, accept) && file.size <= maxFileSizeBytes,
      )

      const messages: string[] = []
      if (wrongType.length > 0) {
        messages.push(
          wrongType.length === 1
            ? `${wrongType[0]!.name} is not an accepted file type.`
            : `${wrongType.length} files were not accepted file types.`,
        )
      }
      if (oversized.length > 0) {
        messages.push(
          oversized.length === 1
            ? `${oversized[0]!.name} is ${formatMb(oversized[0]!.size)}, over the ${formatMb(maxFileSizeBytes)} limit.`
            : `${oversized.length} files were over the ${formatMb(maxFileSizeBytes)} limit.`,
        )
      }
      setError(messages.length > 0 ? `${messages.join(' ')} Nothing was loaded from those files.` : null)

      if (accepted.length > 0) onFiles(multiple ? accepted : accepted.slice(0, 1))
    },
    [accept, multiple, onFiles, maxFileSizeBytes],
  )

  function openPicker() {
    if (disabled) return
    inputRef.current?.click()
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    dragDepth.current += 1
    setDragging(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled) return
    // Required so the browser fires `drop` rather than opening the file.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    emit(event.dataTransfer?.files)
  }

  const sizeLabel =
    maxFileSizeBytes >= 1024 * 1024
      ? `${Math.round(maxFileSizeBytes / (1024 * 1024))} MB per file`
      : `${Math.round(maxFileSizeBytes / 1024)} KB per file`

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-describedby={hintId}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200',
        dragging
          ? 'scale-[1.01] border-brand bg-brand-soft shadow-card-hover'
          : 'border-line bg-surface-2/40 hover:border-brand/60 hover:bg-surface-2/70',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200',
          dragging ? 'scale-110 bg-brand text-brand-fg' : 'bg-surface-2 text-muted',
        )}
      >
        <Icon name={dragging ? 'download' : 'upload'} size={20} />
      </span>
      <span className="text-sm font-medium text-fg">
        {dragging ? 'Drop to load' : label}
      </span>
      <span id={hintId} className="flex max-w-sm flex-col items-center gap-1.5">
        {hint && <span className="text-xs leading-relaxed text-muted">{hint}</span>}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
          <Icon name="shield" size={12} />
          {sizeLabel} · stays on your device
        </span>
      </span>
      {error && (
        <span role="alert" className="max-w-sm text-xs font-medium leading-relaxed text-danger">
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          emit(event.target.files)
          // Reset so picking the same file twice still fires a change event.
          event.target.value = ''
        }}
      />
    </div>
  )
}

export default FileDrop

/** Human-readable megabytes for size messages. */
function formatMb(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`
}
