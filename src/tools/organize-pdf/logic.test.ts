import { describe, expect, it } from 'vitest'

import { countTurns, organizeSummary, planOrganize } from './logic'

/** A grid with nothing removed and nothing turned. */
function calmGrid(count: number): { order: number[]; removed: number[]; turns: Map<number, number> } {
  return {
    order: Array.from({ length: count }, (_, index) => index + 1),
    removed: [],
    turns: new Map(),
  }
}

describe('planOrganize', () => {
  it('keeps the grid order when nothing was changed', () => {
    const grid = calmGrid(4)
    const plan = planOrganize(grid.order, grid.removed, grid.turns)
    expect(plan.ok).toBe(true)
    expect(plan.keep).toEqual([1, 2, 3, 4])
    expect(plan.turns).toEqual([0, 0, 0, 0])
  })

  it('drops the removed pages and closes the gaps', () => {
    const plan = planOrganize([1, 2, 3, 4], [2], new Map())
    expect(plan.keep).toEqual([1, 3, 4])
  })

  it('follows the slot order the grid is in', () => {
    const plan = planOrganize([4, 1, 3, 2], [], new Map())
    expect(plan.keep).toEqual([4, 1, 3, 2])
  })

  it('carries the turn for each surviving page in the same order', () => {
    const turns = new Map([
      [1, 90],
      [3, 180],
    ])
    const plan = planOrganize([1, 2, 3], [2], turns)
    expect(plan.keep).toEqual([1, 3])
    expect(plan.turns).toEqual([90, 180])
  })

  it('normalises a turn past a full rotation', () => {
    const plan = planOrganize([1], [], new Map([[1, 450]]))
    expect(plan.turns).toEqual([90])
  })

  it('refuses to build an empty document', () => {
    const plan = planOrganize([1, 2], [1, 2], new Map())
    expect(plan.ok).toBe(false)
    expect(plan.error).toContain('Every page has been removed')
    expect(plan.keep).toEqual([])
  })
})

describe('organizeSummary', () => {
  it('says so when nothing changed', () => {
    expect(organizeSummary([1, 2, 3], [], 0)).toBe('3 pages, unchanged order.')
  })

  it('names what changed', () => {
    expect(organizeSummary([1, 3], [2], 1)).toBe('2 pages kept — 1 removed, 1 turned, order applied.')
  })

  it('gets the singular right for one page', () => {
    expect(organizeSummary([1], [], 0)).toBe('1 page, unchanged order.')
  })
})

describe('countTurns', () => {
  it('counts the pages turned away from upright', () => {
    const turns = new Map([
      [1, 0],
      [2, 90],
      [3, 180],
      [4, 360],
    ])
    expect(countTurns(turns)).toBe(2)
  })

  it('counts nothing for an untouched grid', () => {
    expect(countTurns(new Map())).toBe(0)
  })
})
