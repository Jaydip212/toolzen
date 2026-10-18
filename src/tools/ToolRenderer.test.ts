import { describe, expect, it } from 'vitest'
import { liveTools, plannedTools } from '@/data/registry'
import { getToolComponent, hasToolComponent, implementedToolIds } from './ToolRenderer'

/**
 * These tests enforce the platform's honesty rule: a tool may only be marked
 * "live" if it actually has an implementation, and a tool that is still on the
 * roadmap must not have one.
 */
describe('ToolRenderer registry consistency', () => {
  it('has an implementation for every live tool', () => {
    const missing = liveTools()
      .filter((tool) => !hasToolComponent(tool.id))
      .map((tool) => tool.id)
    expect(missing).toEqual([])
  })

  it('has no implementation for planned tools', () => {
    const unexpected = plannedTools()
      .filter((tool) => hasToolComponent(tool.id))
      .map((tool) => tool.id)
    expect(unexpected).toEqual([])
  })

  it('returns a component for a live tool and undefined for a planned one', () => {
    // Implementations are `lazy()`-loaded, so they are objects, not functions.
    expect(getToolComponent('word-counter')).toBeDefined()
    expect(getToolComponent('unlock-pdf')).toBeUndefined()
  })

  it('exposes every implemented id for diagnostics', () => {
    const ids = implementedToolIds()
    expect(ids).toContain('word-counter')
    expect(new Set(ids).size).toBe(ids.length)
  })
})
