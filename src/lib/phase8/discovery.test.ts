import { describe, expect, it } from 'vitest'
import {
  collectionSummary,
  filterToolsByQuery,
  guidesForCategory,
  heroBadgeLabel,
  personalToolIds,
  relatedCategories,
} from './discovery'

describe('honest copy helpers', () => {
  it('derives the hero badge from the live count', () => {
    expect(heroBadgeLabel(113)).toBe('113 free online tools')
    expect(heroBadgeLabel(0)).toBe('0 free online tools')
  })

  it('derives the category summary from the real count, with correct grammar', () => {
    expect(collectionSummary(11)).toContain('11 focused collections')
    expect(collectionSummary(1)).toContain('1 focused collection')
    expect(collectionSummary(11)).not.toContain('Twelve')
  })
})

describe('personalToolIds', () => {
  const known = new Set(['merge-pdf', 'word-counter', 'json-formatter'])

  it('puts favourites first, deduplicates and drops unknown ids', () => {
    expect(personalToolIds(['word-counter', 'gone-tool'], ['merge-pdf', 'word-counter'], known)).toEqual([
      'word-counter',
      'merge-pdf',
    ])
  })

  it('caps the list at the requested limit', () => {
    expect(personalToolIds(['word-counter', 'merge-pdf', 'json-formatter'], [], known, 2)).toEqual([
      'word-counter',
      'merge-pdf',
    ])
  })

  it('returns nothing when the visitor has no data', () => {
    expect(personalToolIds([], [], known)).toEqual([])
  })
})

describe('guidesForCategory', () => {
  const guides = [
    { slug: 'a', toolIds: ['merge-pdf'] },
    { slug: 'b', toolIds: ['word-counter'] },
    { slug: 'c', toolIds: ['json-formatter', 'merge-pdf'] },
    { slug: 'd', toolIds: ['qr-code-generator'] },
  ]

  it('returns only guides linked to tools in the category', () => {
    const result = guidesForCategory(guides, new Set(['merge-pdf']))
    expect(result.map((guide) => guide.slug)).toEqual(['a', 'c'])
  })

  it('honours the limit', () => {
    expect(guidesForCategory(guides, new Set(['merge-pdf', 'word-counter', 'json-formatter']), 2)).toHaveLength(2)
  })

  it('returns nothing for a category with no matching guides', () => {
    expect(guidesForCategory(guides, new Set(['csv-viewer']))).toEqual([])
  })
})

describe('filterToolsByQuery', () => {
  const tools = [
    { name: 'Merge PDF', description: 'Combine PDF files', keywords: ['combine', 'join'] },
    { name: 'Split PDF', description: 'Divide a PDF into parts', keywords: [] },
  ]

  it('returns everything for an empty query', () => {
    expect(filterToolsByQuery(tools, '  ')).toEqual(tools)
  })

  it('matches name, description and keywords, case-insensitively', () => {
    expect(filterToolsByQuery(tools, 'join').map((t) => t.name)).toEqual(['Merge PDF'])
    expect(filterToolsByQuery(tools, 'DIVIDE').map((t) => t.name)).toEqual(['Split PDF'])
  })

  it('requires every term and returns nothing for nonsense', () => {
    expect(filterToolsByQuery(tools, 'merge zzzz')).toEqual([])
  })
})

describe('relatedCategories', () => {
  const categories = [{ id: 'pdf' }, { id: 'image' }, { id: 'text' }, { id: 'qr' }]
  const counts: Record<string, number> = { pdf: 20, image: 15, text: 30, qr: 2 }

  it('excludes the current category and orders by honest tool counts', () => {
    const result = relatedCategories(categories, 'pdf', (id) => counts[id] ?? 0, 2)
    expect(result.map((c) => c.id)).toEqual(['text', 'image'])
  })

  it('never includes the current category', () => {
    const result = relatedCategories(categories, 'qr', (id) => counts[id] ?? 0, 4)
    expect(result.map((c) => c.id)).not.toContain('qr')
  })
})
