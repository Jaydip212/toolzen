import { useCallback, useRef, useState } from 'react'
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
  // Counts enter/leave pairs so dragging over child nodes does not flicker.
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const emit = useCallback(
    (list: FileList | null | undefined) => {
      if (!list || list.length === 0) return
      const files = Array.from(list)
      const oversized = files.filter((file) => file.size > maxFileSizeBytes)
      if (oversized.length > 0) {
        setSizeError(
          oversized.length === 1
            ? `${oversized[0]!.name} is ${formatMb(oversized[0]!.size)}, over the ${formatMb(maxFileSizeBytes)} limit. Nothing was loaded.`
            : `${oversized.length} files were over the ${formatMb(maxFileSizeBytes)} limit. Nothing was loaded.`,
        )
        const acceptable = files.filter((file) => file.size <= maxFileSizeBytes)
        if (acceptable.length > 0) onFiles(multiple ? acceptable : acceptable.slice(0, 1))
        return
      }
      setSizeError(null)
      onFiles(multiple ? files : files.slice(0, 1))
    },
    [multiple, onFiles, maxFileSizeBytes],
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

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
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
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150',
        dragging ? 'border-brand bg-brand-soft' : 'border-line bg-surface-2/40 hover:border-brand/60',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          dragging ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted',
        )}
      >
        <Icon name={dragging ? 'download' : 'upload'} size={20} />
      </span>
      <span className="text-sm font-medium text-fg">
        {dragging ? 'Drop to load' : label}
      </span>
      {hint && <span className="max-w-sm text-xs leading-relaxed text-muted">{hint}</span>}
      {sizeError && (
        <span role="alert" className="max-w-sm text-xs font-medium leading-relaxed text-danger">
          {sizeError}
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
