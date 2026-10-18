import type { IconName } from '@/components/ui/Icon'

/** Whether a tool is usable today or still on the roadmap. */
export type ToolStatus = 'live' | 'planned'

/**
 * Where a tool performs its work. Surfaced to users for transparency.
 *
 * - `client`  — entirely in the browser; nothing leaves the device.
 * - `network` — runs in the browser but queries a public API directly from the
 *               user's device (for example DNS-over-HTTPS or a CT log). The
 *               request never passes through a TOOLZEN server.
 * - `server`  — would require a TOOLZEN backend. No tool uses this today.
 */
export type ProcessingMode = 'client' | 'network' | 'server'

/** Identifier for one of TOOLZEN's twelve tool categories. */
export type ToolCategoryId =
  | 'pdf'
  | 'image'
  | 'document'
  | 'conversion'
  | 'text'
  | 'developer'
  | 'security'
  | 'calculator'
  | 'qr'
  | 'color'
  | 'productivity'

/** A decorative accent used by category cards. */
export interface CategoryAccent {
  /** Icon chip background, e.g. `bg-indigo-500/10`. */
  chip: string
  /** Icon colour, e.g. `text-indigo-600 dark:text-indigo-400`. */
  icon: string
}

export interface Category {
  id: ToolCategoryId
  name: string
  /** Short label used in navigation and breadcrumbs. */
  shortName: string
  /** One-line summary used on category cards. */
  tagline: string
  /** Longer description used on the category page. */
  description: string
  icon: IconName
  accent: CategoryAccent
}

/** A question and answer pair. Rendered on the page and emitted as FAQPage schema. */
export interface FaqEntry {
  question: string
  answer: string
}

export interface Tool {
  /** Stable unique identifier, also used as the URL slug. */
  id: string
  name: string
  /** One-line description shown on cards and in search results. */
  description: string
  /**
   * Categories this tool belongs to. The first entry is the primary category;
   * additional entries create legitimate cross-listings.
   */
  categories: ToolCategoryId[]
  /** Extra search terms that are not already in the name or description. */
  keywords: string[]
  /** Absolute in-app path to the tool. Derived from `id`. */
  route: string
  icon: IconName
  status: ToolStatus
  /** Human-readable accepted input, e.g. "PDF file". */
  inputFormat: string
  /** Human-readable produced output, e.g. "Merged PDF file". */
  outputFormat: string
  processingMode: ProcessingMode
  /** Display string for the upload limit, e.g. "50 MB per file". */
  maxFileSize?: string
  /** ISO date the tool was added to the registry. */
  addedAt: string
  /** Curated homepage highlight. Not a popularity metric. */
  featured?: boolean
  /** Step-by-step guidance rendered on the tool page. */
  instructions?: string[]
  /**
   * Tool-specific questions with concise, directly quotable answers.
   * Feeds the on-page FAQ and the FAQPage structured data (AEO).
   */
  faqs?: FaqEntry[]
  /** Optional note about how and where the data is processed. */
  privacyNote?: string
}

/** Registry record with the derived route guaranteed to be present. */
export type RegisteredTool = Tool
