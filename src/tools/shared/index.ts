/**
 * Shared building blocks for tool implementations.
 *
 * Importing from `@/tools/shared` keeps every tool consistent and keeps the
 * per-tool code focused on its actual logic.
 */
export { FileDrop } from './FileDrop'
export type { FileDropProps } from './FileDrop'

export { DownloadButton } from './DownloadButton'
export type { DownloadButtonProps } from './DownloadButton'

export { OutputArea } from './OutputArea'
export type { OutputAreaProps } from './OutputArea'

export { ToolPanel } from './ToolPanel'
export type { ToolPanelProps } from './ToolPanel'

export { SegmentedControl } from './SegmentedControl'
export type { SegmentedControlProps, SegmentedOption } from './SegmentedControl'

export { useObjectUrl } from './useObjectUrl'
