import { describe, expect, it } from 'vitest'

import {
  CATEGORIES,
  CHECKLIST_ITEMS,
  CONTEXTS,
  buildChecklist,
  checklistStats,
  formatEstimate,
  groupChecklist,
  toCsv,
  toMarkdown,
} from './logic'

describe('content integrity', () => {
  it('has unique ids', () => {
    const ids = CHECKLIST_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only known categories', () => {
    const known = new Set(CATEGORIES.map((category) => category.id))
    for (const item of CHECKLIST_ITEMS) expect(known.has(item.category), item.id).toBe(true)
  })

  it('gives every item a real reason', () => {
    for (const item of CHECKLIST_ITEMS) {
      expect(item.why.length, item.id).toBeGreaterThan(40)
      expect(item.title.length, item.id).toBeGreaterThan(15)
    }
  })

  it('applies every item to at least one context', () => {
    for (const item of CHECKLIST_ITEMS) expect(item.contexts.length, item.id).toBeGreaterThan(0)
  })

  it('has at least ten items per context', () => {
    for (const context of CONTEXTS) {
      const count = CHECKLIST_ITEMS.filter((item) => item.contexts.includes(context.id)).length
      expect(count, context.id).toBeGreaterThanOrEqual(10)
    }
  })

  it('covers every category in the personal checklist', () => {
    const categories = new Set(
      CHECKLIST_ITEMS.filter((item) => item.contexts.includes('personal')).map((item) => item.category),
    )
    for (const category of CATEGORIES) expect(categories.has(category.id), category.id).toBe(true)
  })
})

describe('buildChecklist', () => {
  it('returns only items for the chosen context', () => {
    const items = buildChecklist({ context: 'personal' })
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) expect(item.contexts).toContain('personal')
  })

  it('excludes developer-only items from the personal checklist', () => {
    const ids = buildChecklist({ context: 'personal' }).map((item) => item.id)
    expect(ids).not.toContain('dev-secrets')
  })

  it('includes developer-only items for the developer context', () => {
    const ids = buildChecklist({ context: 'developer' }).map((item) => item.id)
    expect(ids).toContain('dev-secrets')
  })

  it('filters by priority', () => {
    const items = buildChecklist({ context: 'business', priorities: ['essential'] })
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) expect(item.priority).toBe('essential')
  })

  it('returns nothing when no priority is selected', () => {
    expect(buildChecklist({ context: 'personal', priorities: [] })).toEqual([])
  })

  it('orders by category then priority', () => {
    const items = buildChecklist({ context: 'developer' })
    const categories = items.map((item) => item.category)
    const firstSeen: string[] = []
    for (const category of categories) {
      if (!firstSeen.includes(category)) firstSeen.push(category)
    }
    expect(firstSeen).toEqual(CATEGORIES.map((category) => category.id).filter((id) => firstSeen.includes(id)))
  })

  it('puts essentials before recommended within a category', () => {
    const items = buildChecklist({ context: 'personal' }).filter((item) => item.category === 'accounts')
    const priorities = items.map((item) => item.priority)
    const firstRecommended = priorities.indexOf('recommended')
    const lastEssential = priorities.lastIndexOf('essential')
    if (firstRecommended !== -1 && lastEssential !== -1) {
      expect(lastEssential).toBeLessThan(firstRecommended)
    }
  })
})

describe('groupChecklist', () => {
  it('drops empty categories', () => {
    const items = buildChecklist({ context: 'personal', priorities: ['essential'] })
    const groups = groupChecklist(items)
    for (const group of groups) expect(group.items.length).toBeGreaterThan(0)
  })

  it('preserves the total item count', () => {
    const items = buildChecklist({ context: 'developer' })
    const total = groupChecklist(items).reduce((sum, group) => sum + group.items.length, 0)
    expect(total).toBe(items.length)
  })

  it('returns nothing for an empty list', () => {
    expect(groupChecklist([])).toEqual([])
  })
})

describe('checklistStats', () => {
  it('counts priorities and efforts', () => {
    const stats = checklistStats(buildChecklist({ context: 'personal' }))
    expect(stats.total).toBe(stats.essential + stats.recommended + stats.advanced)
    expect(stats.total).toBe(stats.quick + stats.moderate + stats.involved)
  })

  it('estimates time from effort bands', () => {
    const stats = checklistStats([
      { id: 'a', title: 't', why: 'w', category: 'accounts', priority: 'essential', effort: 'quick', contexts: ['personal'] },
      { id: 'b', title: 't', why: 'w', category: 'accounts', priority: 'essential', effort: 'moderate', contexts: ['personal'] },
      { id: 'c', title: 't', why: 'w', category: 'accounts', priority: 'essential', effort: 'involved', contexts: ['personal'] },
    ])
    expect(stats.estimatedMinutes).toBe(5 + 30 + 120)
  })

  it('returns zeros for an empty list', () => {
    const stats = checklistStats([])
    expect(stats.total).toBe(0)
    expect(stats.estimatedMinutes).toBe(0)
  })
})

describe('formatEstimate', () => {
  it('uses minutes under an hour', () => {
    expect(formatEstimate(45)).toBe('about 45 minutes')
  })

  it('uses hours under a working day', () => {
    expect(formatEstimate(120)).toBe('about 2 hours')
  })

  it('uses working days above eight hours', () => {
    expect(formatEstimate(60 * 16)).toBe('about 2 working days')
  })

  it('handles zero', () => {
    expect(formatEstimate(0)).toBe('nothing to do')
  })
})

describe('toMarkdown', () => {
  const items = buildChecklist({ context: 'personal', priorities: ['essential'] })

  it('starts with a heading naming the context', () => {
    expect(toMarkdown(items, 'personal').split('\n')[0]).toBe('# Security checklist — Personal')
  })

  it('uses real markdown checkboxes', () => {
    const markdown = toMarkdown(items, 'personal')
    expect(markdown).toContain('- [ ] ')
  })

  it('includes every item title', () => {
    const markdown = toMarkdown(items, 'personal')
    for (const item of items) expect(markdown).toContain(item.title)
  })

  it('includes a category heading per group', () => {
    const markdown = toMarkdown(items, 'personal')
    expect(markdown).toContain('## Accounts and access')
  })

  it('ends with a caveat', () => {
    expect(toMarkdown(items, 'personal')).toContain('not the same as being secure')
  })
})

describe('toCsv', () => {
  it('writes a header row', () => {
    expect(toCsv([]).split('\n')[0]).toBe('category,priority,effort,title,why')
  })

  it('writes one row per item', () => {
    const items = buildChecklist({ context: 'personal' })
    expect(toCsv(items).split('\n')).toHaveLength(items.length + 1)
  })

  it('quotes a field containing a comma', () => {
    const csv = toCsv([
      {
        id: 'a',
        title: 'Do a thing, then another',
        why: 'Because it matters.',
        category: 'accounts',
        priority: 'essential',
        effort: 'quick',
        contexts: ['personal'],
      },
    ])
    expect(csv).toContain('"Do a thing, then another"')
  })
})
