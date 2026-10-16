import { describe, expect, it } from 'vitest'
import { liveTools, plannedTools } from '@/data/registry'
import { getToolComponent, hasToolComponent } from './ToolRenderer'

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
    expect(getToolComponent('word-counter')).toBeTypeOf('function')
    expect(getToolComponent('merge-pdf')).toBeUndefined()
  })
})
