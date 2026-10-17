/**
 * Line-based diffing for the Text Comparison tool.
 *
 * Uses a longest-common-subsequence table, which is exact rather than
 * heuristic. The table is O(n·m), so inputs are capped — see `MAX_DIFF_LINES`.
 */

export type DiffType = 'equal' | 'insert' | 'delete'

export interface DiffOp {
  type: DiffType
  /** The original line, before any ignore-casing or ignore-whitespace rules. */
  line: string
  /** 1-based line number in the left text. Undefined for inserts. */
  leftLine?: number
  /** 1-based line number in the right text. Undefined for deletes. */
  rightLine?: number
}

export interface DiffOptions {
  /** Compare lines case-insensitively. */
  ignoreCase: boolean
  /** Ignore leading, trailing and repeated whitespace when comparing. */
  ignoreWhitespace: boolean
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignoreCase: false,
  ignoreWhitespace: false,
}

export interface DiffStats {
  added: number
  removed: number
  unchanged: number
  /** True when the two texts differ under the current comparison rules. */
  changed: boolean
}

/**
 * Maximum number of lines per side. The LCS table needs (n+1)×(m+1) entries;
 * beyond this the allocation and runtime stop being reasonable in a browser tab.
 */
export const MAX_DIFF_LINES = 3000

/** Split text into lines, normalising line endings. Empty text has no lines. */
export function splitLines(text: string): string[] {
  if (text === '') return []
  return text.replace(/\r\n?/g, '\n').split('\n')
}

/** Whether a comparison would exceed the safe input size. */
export function isDiffTooLarge(left: string, right: string): boolean {
  return splitLines(left).length > MAX_DIFF_LINES || splitLines(right).length > MAX_DIFF_LINES
}

/** Build the comparison key for a line under the active options. */
function keyFactory(options: DiffOptions): (line: string) => string {
  return (line) => {
    let value = line
    if (options.ignoreWhitespace) value = value.trim().replace(/\s+/g, ' ')
    if (options.ignoreCase) value = value.toLowerCase()
    return value
  }
}

/**
 * Diff two arrays of lines, returning the operations in reading order.
 * Original line text is preserved in the output; options only affect matching.
 */
export function diffLines(
  left: string[],
  right: string[],
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): DiffOp[] {
  const key = keyFactory(options)
  const leftKeys = left.map(key)
  const rightKeys = right.map(key)

  const n = leftKeys.length
  const m = rightKeys.length
  const width = m + 1
  // lcs[i][j] = length of the LCS of leftKeys[i..] and rightKeys[j..]
  const lcs = new Uint32Array((n + 1) * width)
  const at = (i: number, j: number) => i * width + j

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[at(i, j)] =
        leftKeys[i] === rightKeys[j]
          ? lcs[at(i + 1, j + 1)] + 1
          : Math.max(lcs[at(i + 1, j)], lcs[at(i, j + 1)])
    }
  }

  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  let leftLine = 1
  let rightLine = 1

  while (i < n && j < m) {
    if (leftKeys[i] === rightKeys[j]) {
      ops.push({ type: 'equal', line: left[i], leftLine: leftLine++, rightLine: rightLine++ })
      i += 1
      j += 1
    } else if (lcs[at(i + 1, j)] >= lcs[at(i, j + 1)]) {
      ops.push({ type: 'delete', line: left[i], leftLine: leftLine++ })
      i += 1
    } else {
      ops.push({ type: 'insert', line: right[j], rightLine: rightLine++ })
      j += 1
    }
  }
  while (i < n) {
    ops.push({ type: 'delete', line: left[i], leftLine: leftLine++ })
    i += 1
  }
  while (j < m) {
    ops.push({ type: 'insert', line: right[j], rightLine: rightLine++ })
    j += 1
  }

  return ops
}

/** Diff two blocks of text. */
export function diffText(
  left: string,
  right: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): DiffOp[] {
  return diffLines(splitLines(left), splitLines(right), options)
}

/** Count added, removed and unchanged lines. */
export function diffStats(ops: DiffOp[]): DiffStats {
  let added = 0
  let removed = 0
  let unchanged = 0
  for (const op of ops) {
    if (op.type === 'insert') added += 1
    else if (op.type === 'delete') removed += 1
    else unchanged += 1
  }
  return { added, removed, unchanged, changed: added > 0 || removed > 0 }
}

/* -------------------------------------------------------------------------- */
/* Side-by-side view                                                          */
/* -------------------------------------------------------------------------- */

export interface SideBySideCell {
  line: string
  number: number
  type: 'equal' | 'delete' | 'insert'
}

export interface SideBySideRow {
  left?: SideBySideCell
  right?: SideBySideCell
}

/**
 * Turn diff operations into aligned rows for a side-by-side view.
 * Runs of deletions and insertions are paired up row by row.
 */
export function toSideBySide(ops: DiffOp[]): SideBySideRow[] {
  const rows: SideBySideRow[] = []
  let index = 0

  while (index < ops.length) {
    const op = ops[index]

    if (op.type === 'equal') {
      rows.push({
        left: { line: op.line, number: op.leftLine ?? 0, type: 'equal' },
        right: { line: op.line, number: op.rightLine ?? 0, type: 'equal' },
      })
      index += 1
      continue
    }

    const deletes: DiffOp[] = []
    while (index < ops.length && ops[index].type === 'delete') {
      deletes.push(ops[index])
      index += 1
    }
    const inserts: DiffOp[] = []
    while (index < ops.length && ops[index].type === 'insert') {
      inserts.push(ops[index])
      index += 1
    }

    const pairs = Math.max(deletes.length, inserts.length)
    for (let k = 0; k < pairs; k += 1) {
      const removed = deletes[k]
      const added = inserts[k]
      rows.push({
        left: removed
          ? { line: removed.line, number: removed.leftLine ?? 0, type: 'delete' }
          : undefined,
        right: added
          ? { line: added.line, number: added.rightLine ?? 0, type: 'insert' }
          : undefined,
      })
    }
  }

  return rows
}

/* -------------------------------------------------------------------------- */
/* Unified diff                                                               */
/* -------------------------------------------------------------------------- */

interface Hunk {
  start: number
  end: number
}

/** Group change positions into hunks, merging those closer than 2×context. */
function buildHunks(ops: DiffOp[], context: number): Hunk[] {
  const changeIndices: number[] = []
  ops.forEach((op, index) => {
    if (op.type !== 'equal') changeIndices.push(index)
  })
  if (changeIndices.length === 0) return []

  const hunks: Hunk[] = []
  let start = changeIndices[0]
  let last = changeIndices[0]

  for (let n = 1; n < changeIndices.length; n += 1) {
    if (changeIndices[n] - last <= context * 2 + 1) {
      last = changeIndices[n]
    } else {
      hunks.push({
        start: Math.max(0, start - context),
        end: Math.min(ops.length - 1, last + context),
      })
      start = changeIndices[n]
      last = changeIndices[n]
    }
  }
  hunks.push({
    start: Math.max(0, start - context),
    end: Math.min(ops.length - 1, last + context),
  })

  return hunks
}

/**
 * Render a standard unified diff.
 * Line counts of 0 are printed as `-0,0` / `+0,0`, matching git and diff(1).
 */
export function toUnifiedDiff(
  ops: DiffOp[],
  leftLabel = 'original',
  rightLabel = 'changed',
  context = 3,
): string {
  const hunks = buildHunks(ops, context)
  if (hunks.length === 0) return ''

  // Line numbers consumed before each operation.
  const leftBefore: number[] = []
  const rightBefore: number[] = []
  let left = 1
  let right = 1
  for (const op of ops) {
    leftBefore.push(left)
    rightBefore.push(right)
    if (op.type !== 'insert') left += 1
    if (op.type !== 'delete') right += 1
  }

  const out: string[] = [`--- ${leftLabel}`, `+++ ${rightLabel}`]

  for (const hunk of hunks) {
    const slice = ops.slice(hunk.start, hunk.end + 1)
    const leftCount = slice.filter((op) => op.type !== 'insert').length
    const rightCount = slice.filter((op) => op.type !== 'delete').length
    const leftStart = leftCount === 0 ? leftBefore[hunk.start] - 1 : leftBefore[hunk.start]
    const rightStart = rightCount === 0 ? rightBefore[hunk.start] - 1 : rightBefore[hunk.start]

    out.push(`@@ -${leftStart},${leftCount} +${rightStart},${rightCount} @@`)
    for (const op of slice) {
      const marker = op.type === 'insert' ? '+' : op.type === 'delete' ? '-' : ' '
      out.push(`${marker}${op.line}`)
    }
  }

  return out.join('\n')
}
