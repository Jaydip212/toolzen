import { describe, expect, it } from 'vitest'
import { tools } from './tools'
import {
  categoryStats,
  getTool,
  liveTools,
  platformStats,
  plannedTools,
  relatedTools,
  searchTools,
  toolsByCategory,
} from './registry'

describe('tool registry integrity', () => {
  it('has unique tool ids', () => {
    const ids = tools.map((tool) => tool.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('derives every route from the tool id', () => {
    for (const tool of tools) {
      expect(tool.route).toBe(`/tools/${tool.id}`)
    }
  })

  it('gives every tool a primary category and at least one keyword', () => {
    for (const tool of tools) {
      expect(tool.categories.length).toBeGreaterThan(0)
      expect(tool.keywords.length).toBeGreaterThan(0)
    }
  })

  it('gives every tool a name, description and ISO addedAt date', () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0)
      expect(tool.description.length).toBeGreaterThan(0)
      expect(tool.addedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('availability', () => {
  it('exposes exactly the three implemented tools as live', () => {
    expect(liveTools().map((tool) => tool.id).sort()).toEqual([
      'case-converter',
      'character-counter',
      'word-counter',
    ])
  })

  it('splits live and planned tools without overlap', () => {
    const live = new Set(liveTools().map((tool) => tool.id))
    for (const tool of plannedTools()) {
      expect(live.has(tool.id)).toBe(false)
    }
  })

  it('reports platform stats consistently', () => {
    const stats = platformStats()
    expect(stats.live).toBe(liveTools().length)
    expect(stats.total).toBe(tools.length)
    expect(stats.total).toBeGreaterThan(stats.live)
  })
})

describe('getTool', () => {
  it('finds a tool by id', () => {
    expect(getTool('word-counter')?.name).toBe('Word Counter')
  })

  it('returns undefined for an unknown id', () => {
    expect(getTool('not-a-real-tool')).toBeUndefined()
  })
})

describe('searchTools', () => {
  it('returns the whole registry when no filters are supplied', () => {
    expect(searchTools()).toHaveLength(tools.length)
  })

  it('ranks an exact name match first', () => {
    const results = searchTools({ query: 'word counter' })
    expect(results[0]?.id).toBe('word-counter')
  })

  it('matches on keywords', () => {
    const results = searchTools({ query: 'camelcase' })
    expect(results.some((tool) => tool.id === 'case-converter')).toBe(true)
  })

  it('requires every query term to match', () => {
    const results = searchTools({ query: 'word zzzzzznotfound' })
    expect(results).toHaveLength(0)
  })

  it('returns nothing for a nonsense query', () => {
    expect(searchTools({ query: 'qqqqzzzz' })).toHaveLength(0)
  })

  it('is case insensitive', () => {
    expect(searchTools({ query: 'WORD COUNTER' })[0]?.id).toBe('word-counter')
  })

  it('filters by category', () => {
    const results = searchTools({ category: 'pdf' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((tool) => tool.categories.includes('pdf'))).toBe(true)
  })

  it('filters by status', () => {
    expect(searchTools({ status: 'live' }).every((tool) => tool.status === 'live')).toBe(true)
    expect(searchTools({ status: 'planned' }).every((tool) => tool.status === 'planned')).toBe(true)
  })

  it('sorts by name ascending and descending', () => {
    const ascending = searchTools({ sort: 'name-asc' }).map((tool) => tool.name)
    expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b)))

    const descending = searchTools({ sort: 'name-desc' }).map((tool) => tool.name)
    expect(descending).toEqual([...descending].sort((a, b) => b.localeCompare(a)))
  })

  it('sorts newest first', () => {
    const dates = searchTools({ sort: 'newest' }).map((tool) => tool.addedAt)
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))
  })
})

describe('toolsByCategory and categoryStats', () => {
  it('splits a category into live and planned tools', () => {
    const { live, planned } = toolsByCategory('text')
    expect(live.length).toBeGreaterThan(0)
    expect(live.every((tool) => tool.status === 'live')).toBe(true)
    expect(planned.every((tool) => tool.status === 'planned')).toBe(true)
  })

  it('reports totals that match the split', () => {
    const { live, planned } = toolsByCategory('text')
    const stats = categoryStats('text')
    expect(stats.live).toBe(live.length)
    expect(stats.total).toBe(live.length + planned.length)
  })

  it('reports zero live tools for a category that has none yet', () => {
    expect(categoryStats('ai').live).toBe(0)
  })
})

describe('relatedTools', () => {
  it('never includes the tool itself', () => {
    const tool = getTool('word-counter')
    expect(tool).toBeDefined()
    const related = relatedTools(tool!, 4)
    expect(related.every((item) => item.id !== tool!.id)).toBe(true)
  })

  it('prefers tools from the same category', () => {
    const tool = getTool('merge-pdf')!
    const related = relatedTools(tool, 4)
    expect(related.length).toBeGreaterThan(0)
    expect(related[0]?.categories.includes('pdf')).toBe(true)
  })

  it('respects the requested limit', () => {
    const tool = getTool('word-counter')!
    expect(relatedTools(tool, 2).length).toBeLessThanOrEqual(2)
  })
})
