import { describe, expect, it } from 'vitest'
import { liveTools, plannedTools } from '@/data/registry'
import { AI_TOOL_IDS } from '@/data/tools'
import { getToolComponent, hasToolComponent, implementedToolIds } from './ToolRenderer'

/**
 * These tests enforce the platform's honesty rule: a tool may only be marked
 * "live" if it actually has an implementation, and an implementation must never
 * be orphaned where nobody can reach it.
 *
 * The AI tools are the one legitimate exception to "planned means no code":
 * they are written and tested, but they cannot run until a provider key is
 * configured, so they stay planned until the deployer sets VITE_AI_ENABLED.
 * Their implementations are reachable the moment that flag flips.
 */
describe('ToolRenderer registry consistency', () => {
  it('has an implementation for every live tool', () => {
    const missing = liveTools()
      .filter((tool) => !hasToolComponent(tool.id))
      .map((tool) => tool.id)
    expect(missing).toEqual([])
  })

  it('has no implementation for planned tools, except the gated AI tools', () => {
    const unexpected = plannedTools()
      .filter((tool) => hasToolComponent(tool.id) && !AI_TOOL_IDS.has(tool.id))
      .map((tool) => tool.id)
    expect(unexpected).toEqual([])
  })

  it('gives every gated AI tool an implementation, so the flag actually works', () => {
    const missing = [...AI_TOOL_IDS].filter((id) => !hasToolComponent(id))
    expect(missing).toEqual([])
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
