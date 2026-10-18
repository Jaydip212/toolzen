import { describe, expect, it } from 'vitest'

import { TURNS, angleAfterTurn, orientationNote, pagesToRotate, rotationSummary, turnLabel } from './logic'

describe('angleAfterTurn', () => {
  it('adds the turn to the current angle', () => {
    expect(angleAfterTurn(0, 90)).toBe(90)
    expect(angleAfterTurn(90, 90)).toBe(180)
    expect(angleAfterTurn(0, 180)).toBe(180)
  })

  it('wraps around a full turn back to upright', () => {
    expect(angleAfterTurn(270, 90)).toBe(0)
    expect(angleAfterTurn(0, -90)).toBe(270)
    expect(angleAfterTurn(90, -90)).toBe(0)
  })
})

describe('turnLabel', () => {
  it('names the turns the tool offers', () => {
    expect(turnLabel(90)).toBe('90° left (counter-clockwise)')
    expect(turnLabel(-90)).toContain('90° right')
    expect(turnLabel(180)).toBe('180°')
  })

  it('labels an unoffered turn plainly rather than pretending', () => {
    expect(turnLabel(45)).toBe('45°')
  })
})

describe('rotationSummary', () => {
  it('counts the pages and names the turn', () => {
    expect(rotationSummary(90, 3)).toContain('3 pages turned 90° left')
    expect(rotationSummary(180, 1)).toContain('1 page turned upside down')
  })

  it('always mentions the width and height swap, because it is the surprise', () => {
    expect(rotationSummary(90, 2)).toContain('swaps its width and height')
  })
})

describe('orientationNote', () => {
  it('warns that a quarter turn changes orientation', () => {
    expect(orientationNote(90, 4)).toContain('portrait page reads as landscape')
    expect(orientationNote(-90, 4)).toContain('portrait page reads as landscape')
  })

  it('says nothing for a half turn, which keeps orientation', () => {
    expect(orientationNote(180, 4)).toBeNull()
  })

  it('says nothing when no pages are selected', () => {
    expect(orientationNote(90, 0)).toBeNull()
  })
})

describe('pagesToRotate', () => {
  it('keeps the selected pages inside the document, deduplicated and sorted', () => {
    expect(pagesToRotate(5, [4, 1, 1, 9])).toEqual([1, 4])
  })

  it('reports an empty selection rather than silently rotating everything', () => {
    expect(pagesToRotate(5, [])).toEqual([])
    expect(pagesToRotate(5, [0, -1])).toEqual([])
  })
})

describe('TURNS', () => {
  it('offers one left, one right and a half turn, and nothing else', () => {
    expect(TURNS.map((turn) => turn.value).sort((a, b) => a - b)).toEqual([-90, 90, 180])
  })
})
