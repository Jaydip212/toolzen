import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearFavorites,
  clearRecent,
  filterKnown,
  getFavorites,
  getRecent,
  isFavorite,
  isRecentDisabled,
  RECENT_LIMIT,
  setRecentDisabled,
  toggleFavorite,
  touchRecent,
} from './usage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('favorites', () => {
  it('starts empty', () => {
    expect(getFavorites()).toEqual([])
    expect(isFavorite('merge-pdf')).toBe(false)
  })

  it('toggles and reports the new state', () => {
    expect(toggleFavorite('merge-pdf')).toBe(true)
    expect(isFavorite('merge-pdf')).toBe(true)
    expect(toggleFavorite('merge-pdf')).toBe(false)
    expect(isFavorite('merge-pdf')).toBe(false)
  })

  it('persists across reads and keeps insertion order', () => {
    toggleFavorite('merge-pdf')
    toggleFavorite('word-counter')
    expect(getFavorites()).toEqual(['merge-pdf', 'word-counter'])
  })

  it('clears everything at once', () => {
    toggleFavorite('merge-pdf')
    clearFavorites()
    expect(getFavorites()).toEqual([])
  })
})

describe('recently used', () => {
  it('is empty until a tool is visited', () => {
    expect(getRecent()).toEqual([])
  })

  it('records visits newest first', () => {
    touchRecent('merge-pdf')
    touchRecent('word-counter')
    expect(getRecent().map((entry) => entry.id)).toEqual(['word-counter', 'merge-pdf'])
  })

  it('moves a repeat visit to the front instead of duplicating it', () => {
    touchRecent('merge-pdf')
    touchRecent('word-counter')
    touchRecent('merge-pdf')
    expect(getRecent().map((entry) => entry.id)).toEqual(['merge-pdf', 'word-counter'])
  })

  it('caps the history at RECENT_LIMIT entries', () => {
    for (let index = 0; index < RECENT_LIMIT + 5; index += 1) {
      touchRecent(`tool-${index}`)
    }
    expect(getRecent()).toHaveLength(RECENT_LIMIT)
    expect(getRecent()[0]!.id).toBe(`tool-${RECENT_LIMIT + 4}`)
  })

  it('clears on demand', () => {
    touchRecent('merge-pdf')
    clearRecent()
    expect(getRecent()).toEqual([])
  })

  it('can be disabled entirely, wiping stored history', () => {
    touchRecent('merge-pdf')
    setRecentDisabled(true)
    expect(isRecentDisabled()).toBe(true)
    expect(getRecent()).toEqual([])
    touchRecent('word-counter')
    expect(getRecent()).toEqual([])
    setRecentDisabled(false)
    touchRecent('word-counter')
    expect(getRecent().map((entry) => entry.id)).toEqual(['word-counter'])
  })

  it('stores no content beyond ids and timestamps', () => {
    touchRecent('merge-pdf')
    const raw = window.localStorage.getItem('toolzen:recent') ?? ''
    expect(JSON.parse(raw)).toEqual([{ id: 'merge-pdf', at: expect.any(Number) }])
  })
})

describe('filterKnown', () => {
  it('drops ids that are no longer usable', () => {
    const known = new Set(['merge-pdf', 'word-counter'])
    expect(filterKnown(['merge-pdf', 'gone-tool', 'word-counter'], known)).toEqual([
      'merge-pdf',
      'word-counter',
    ])
  })
})
