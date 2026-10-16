import { tools } from './tools'
import type { Tool, ToolCategoryId, ToolStatus } from '@/types/tool'

export type ToolSort = 'name-asc' | 'name-desc' | 'newest'
export type StatusFilter = 'all' | ToolStatus

export interface SearchOptions {
  query?: string
  category?: ToolCategoryId
  status?: StatusFilter
  sort?: ToolSort
}

const byId = new Map(tools.map((tool) => [tool.id, tool]))

/** Look up a tool by its id. */
export function getTool(id: string): Tool | undefined {
  return byId.get(id)
}

/** All tools that are implemented and usable today. */
export function liveTools(): Tool[] {
  return tools.filter((tool) => tool.status === 'live')
}

/** Tools that are on the roadmap but not yet available. */
export function plannedTools(): Tool[] {
  return tools.filter((tool) => tool.status === 'planned')
}

/** Curated homepage highlights. This is an editorial pick, not a popularity rank. */
export function featuredTools(limit = 6): Tool[] {
  return liveTools()
    .filter((tool) => tool.featured)
    .slice(0, limit)
}

/** Live tools ordered by the date they were added, newest first. */
export function recentlyAddedTools(limit = 6): Tool[] {
  return [...liveTools()]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** Tools that belong to a category, split by availability. */
export function toolsByCategory(categoryId: ToolCategoryId): { live: Tool[]; planned: Tool[] } {
  const inCategory = tools.filter((tool) => tool.categories.includes(categoryId))
  return {
    live: inCategory.filter((tool) => tool.status === 'live'),
    planned: inCategory.filter((tool) => tool.status === 'planned'),
  }
}

/** Availability counts for a category, used on category cards. */
export function categoryStats(categoryId: ToolCategoryId): { live: number; total: number } {
  const { live, planned } = toolsByCategory(categoryId)
  return { live: live.length, total: live.length + planned.length }
}

/** Platform-wide availability counts. */
export function platformStats(): { live: number; total: number } {
  const live = liveTools().length
  return { live, total: tools.length }
}

/** How well a single search term matches a tool. Higher is better; 0 means no match. */
function scoreTerm(tool: Tool, term: string): number {
  const name = tool.name.toLowerCase()
  const id = tool.id.toLowerCase()
  const description = tool.description.toLowerCase()
  let score = 0

  if (name === term) score += 120
  else if (name.startsWith(term)) score += 60
  else if (name.includes(term)) score += 35

  if (id === term) score += 40
  else if (id.includes(term)) score += 20

  for (const keyword of tool.keywords) {
    const kw = keyword.toLowerCase()
    if (kw === term) score += 30
    else if (kw.startsWith(term)) score += 18
    else if (kw.includes(term)) score += 10
  }

  if (description.includes(term)) score += 8

  return score
}

/**
 * Score a tool against a multi-term query. Every term must match somewhere for
 * the tool to be considered a hit.
 */
function scoreTool(tool: Tool, terms: string[]): number {
  let total = 0
  for (const term of terms) {
    const score = scoreTerm(tool, term)
    if (score === 0) return 0
    total += score
  }
  return total
}

function sortTools(list: Tool[], sort: ToolSort): Tool[] {
  const sorted = [...list]
  switch (sort) {
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'newest':
      sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.name.localeCompare(b.name))
      break
    case 'name-asc':
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return sorted
}

/**
 * Instant search across the registry with optional category, status and sort
 * filters. With no query, results are returned sorted but unscored.
 */
export function searchTools({
  query = '',
  category,
  status = 'all',
  sort = 'name-asc',
}: SearchOptions = {}): Tool[] {
  const trimmed = query.trim().toLowerCase()
  const terms = trimmed.length > 0 ? trimmed.split(/\s+/).filter(Boolean) : []

  let pool = tools
  if (category) pool = pool.filter((tool) => tool.categories.includes(category))
  if (status !== 'all') pool = pool.filter((tool) => tool.status === status)

  if (terms.length === 0) return sortTools(pool, sort)

  const scored = pool
    .map((tool) => ({ tool, score: scoreTool(tool, terms) }))
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Available tools outrank planned ones when relevance is equal.
    if (a.tool.status !== b.tool.status) return a.tool.status === 'live' ? -1 : 1
    return a.tool.name.localeCompare(b.tool.name)
  })

  return scored.map((entry) => entry.tool)
}

/**
 * Tools related to `tool`, preferring ones that share a category. Live tools
 * are surfaced ahead of planned ones so the suggestions stay actionable.
 */
export function relatedTools(tool: Tool, limit = 4): Tool[] {
  const primary = tool.categories[0]
  const shares = (candidate: Tool) =>
    candidate.categories.some((category) => tool.categories.includes(category))

  return tools
    .filter((candidate) => candidate.id !== tool.id)
    .map((candidate) => {
      let score = 0
      if (candidate.categories.includes(primary)) score += 10
      if (shares(candidate)) score += 6
      if (candidate.status === 'live') score += 3
      if (candidate.featured) score += 1
      return { candidate, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, limit)
    .map((entry) => entry.candidate)
}
