import { describe, expect, it } from 'vitest'
import { getTool, liveTools } from '@/data/registry'
import { GUIDES, getGuide } from './guides'

describe('guides dataset integrity', () => {
  it('has unique slugs', () => {
    const slugs = GUIDES.map((guide) => guide.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every guide has complete content', () => {
    for (const guide of GUIDES) {
      expect(guide.title.length).toBeGreaterThan(0)
      expect(guide.description.length).toBeGreaterThan(40)
      expect(guide.intro.length).toBeGreaterThan(40)
      expect(guide.steps.length).toBeGreaterThanOrEqual(3)
      expect(guide.faqs.length).toBeGreaterThanOrEqual(2)
      for (const step of guide.steps) {
        expect(step.title.length).toBeGreaterThan(0)
        expect(step.body.length).toBeGreaterThan(20)
      }
    }
  })

  it('links only to tools that exist and are live', () => {
    const liveIds = new Set(liveTools().map((tool) => tool.id))
    for (const guide of GUIDES) {
      expect(guide.toolIds.length).toBeGreaterThan(0)
      for (const id of guide.toolIds) {
        expect(liveIds.has(id), `${guide.slug} links to non-live tool ${id}`).toBe(true)
        expect(getTool(id)).toBeDefined()
      }
    }
  })

  it('describes tools truthfully — browser-only tools are never described as uploading', () => {
    for (const guide of GUIDES) {
      for (const faq of guide.faqs) {
        for (const toolId of guide.toolIds) {
          const tool = getTool(toolId)!
          if (tool.processingMode === 'client') {
            // A browser-only tool must not be described as uploaded to a server.
            expect(faq.answer.toLowerCase()).not.toMatch(/is uploaded to (our|the) server/)
          }
        }
      }
    }
  })
})

describe('getGuide', () => {
  it('resolves a slug to its guide', () => {
    expect(getGuide('merge-pdf-files')?.title).toContain('merge PDF')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getGuide('not-a-guide')).toBeUndefined()
  })
})
