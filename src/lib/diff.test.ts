import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DIFF_OPTIONS,
  MAX_DIFF_LINES,
  diffStats,
  diffText,
  isDiffTooLarge,
  splitLines,
  toSideBySide,
  toUnifiedDiff,
} from './diff'

describe('splitLines', () => {
  it('returns no lines for empty text', () => {
    expect(splitLines('')).toEqual([])
  })

  it('normalises CRLF', () => {
    expect(splitLines('a\r\nb')).toEqual(['a', 'b'])
  })

  it('keeps a trailing empty line', () => {
    expect(splitLines('a\n')).toEqual(['a', ''])
  })
})

describe('diffText', () => {
  it('reports no changes for identical text', () => {
    const ops = diffText('a\nb', 'a\nb')
    expect(ops.every((op) => op.type === 'equal')).toBe(true)
    expect(diffStats(ops).changed).toBe(false)
  })

  it('detects a single insertion', () => {
    const ops = diffText('a\nc', 'a\nb\nc')
    expect(ops.map((op) => op.type)).toEqual(['equal', 'insert', 'equal'])
    expect(diffStats(ops)).toMatchObject({ added: 1, removed: 0, unchanged: 2, changed: true })
  })

  it('detects a single deletion', () => {
    const ops = diffText('a\nb\nc', 'a\nc')
    expect(ops.map((op) => op.type)).toEqual(['equal', 'delete', 'equal'])
    expect(diffStats(ops)).toMatchObject({ added: 0, removed: 1, unchanged: 2 })
  })

  it('detects a replacement as delete + insert', () => {
    const ops = diffText('a\nb', 'a\nx')
    const stats = diffStats(ops)
    expect(stats.added).toBe(1)
    expect(stats.removed).toBe(1)
  })

  it('numbers left lines only where they exist', () => {
    const ops = diffText('a\nc', 'a\nb\nc')
    const insert = ops.find((op) => op.type === 'insert')
    expect(insert?.rightLine).toBe(2)
    expect(insert?.leftLine).toBeUndefined()
  })

  it('numbers right lines only where they exist', () => {
    const ops = diffText('a\nb\nc', 'a\nc')
    const removed = ops.find((op) => op.type === 'delete')
    expect(removed?.leftLine).toBe(2)
    expect(removed?.rightLine).toBeUndefined()
  })

  it('preserves original line text when ignoring case', () => {
    const ops = diffText('Hello', 'hello', { ignoreCase: true, ignoreWhitespace: false })
    expect(ops).toHaveLength(1)
    expect(ops[0].type).toBe('equal')
    expect(ops[0].line).toBe('Hello')
  })

  it('ignores whitespace differences when asked', () => {
    const ops = diffText('a  b', 'a b', { ignoreCase: false, ignoreWhitespace: true })
    expect(diffStats(ops).changed).toBe(false)
  })

  it('still reports whitespace differences by default', () => {
    const ops = diffText('a  b', 'a b')
    expect(diffStats(ops).changed).toBe(true)
  })

  it('handles one side being empty', () => {
    const ops = diffText('', 'a\nb')
    expect(diffStats(ops)).toMatchObject({ added: 2, removed: 0 })
  })

  it('handles both sides being empty', () => {
    expect(diffText('', '')).toEqual([])
  })
})

describe('isDiffTooLarge', () => {
  it('accepts inputs at the limit', () => {
    const text = Array.from({ length: MAX_DIFF_LINES }, (_, i) => `line ${i}`).join('\n')
    expect(isDiffTooLarge(text, 'small')).toBe(false)
  })

  it('rejects inputs past the limit', () => {
    const text = Array.from({ length: MAX_DIFF_LINES + 1 }, (_, i) => `line ${i}`).join('\n')
    expect(isDiffTooLarge(text, 'small')).toBe(true)
  })
})

describe('toSideBySide', () => {
  it('pairs a replacement on one row', () => {
    const rows = toSideBySide(diffText('a\nb', 'a\nx'))
    expect(rows).toHaveLength(2)
    expect(rows[1].left).toMatchObject({ line: 'b', type: 'delete' })
    expect(rows[1].right).toMatchObject({ line: 'x', type: 'insert' })
  })

  it('leaves the opposite cell empty for an unpaired insertion', () => {
    const rows = toSideBySide(diffText('a', 'a\nb'))
    expect(rows[1].left).toBeUndefined()
    expect(rows[1].right).toMatchObject({ line: 'b', type: 'insert' })
  })

  it('leaves the opposite cell empty for an unpaired deletion', () => {
    const rows = toSideBySide(diffText('a\nb', 'a'))
    expect(rows[1].left).toMatchObject({ line: 'b', type: 'delete' })
    expect(rows[1].right).toBeUndefined()
  })

  it('emits one row per unchanged line', () => {
    const rows = toSideBySide(diffText('a\nb\nc', 'a\nb\nc'))
    expect(rows).toHaveLength(3)
    expect(rows.every((row) => row.left?.type === 'equal' && row.right?.type === 'equal')).toBe(true)
  })
})

describe('toUnifiedDiff', () => {
  it('returns an empty string when nothing changed', () => {
    expect(toUnifiedDiff(diffText('a', 'a'))).toBe('')
  })

  it('emits file headers and a hunk header', () => {
    const out = toUnifiedDiff(diffText('a\nb', 'a\nc'), 'before.txt', 'after.txt')
    expect(out.startsWith('--- before.txt\n+++ after.txt\n')).toBe(true)
    expect(out).toContain('@@')
  })

  it('marks removed lines with − and added lines with +', () => {
    const out = toUnifiedDiff(diffText('a\nb', 'a\nc'))
    expect(out).toContain('-b')
    expect(out).toContain('+c')
  })

  it('includes unchanged context lines with a leading space', () => {
    const out = toUnifiedDiff(diffText('a\nb\nc', 'a\nX\nc'))
    expect(out).toContain(' a')
    expect(out).toContain(' c')
  })

  it('produces a hunk header with correct counts', () => {
    // One line removed, one added, two unchanged context lines.
    const out = toUnifiedDiff(diffText('keep1\nold\nkeep2', 'keep1\nnew\nkeep2'))
    const header = out.split('\n').find((line) => line.startsWith('@@'))
    expect(header).toBe('@@ -1,3 +1,3 @@')
  })

  it('handles an insertion into an empty file', () => {
    const out = toUnifiedDiff(diffText('', 'a'))
    expect(out).toContain('+a')
    expect(out).toContain('@@')
  })

  it('defaults the labels', () => {
    const out = toUnifiedDiff(diffText('a', 'b'))
    expect(out).toContain('--- original')
    expect(out).toContain('+++ changed')
  })
})

describe('DEFAULT_DIFF_OPTIONS', () => {
  it('compares exactly by default', () => {
    expect(DEFAULT_DIFF_OPTIONS).toEqual({ ignoreCase: false, ignoreWhitespace: false })
  })
})
