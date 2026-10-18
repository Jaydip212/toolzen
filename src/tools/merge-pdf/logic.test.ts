import { describe, expect, it } from 'vitest'

import { MAX_MERGE_FILES, MERGE_NOTE, mergeError, mergeSummary, mergedName } from './logic'

describe('mergeError', () => {
  it('needs at least two files', () => {
    expect(mergeError(1, 1)).toContain('at least two')
    expect(mergeError(0, 0)).toContain('at least two')
  })

  it('caps the batch and says why', () => {
    const error = mergeError(MAX_MERGE_FILES + 1, MAX_MERGE_FILES + 1)
    expect(error).toContain(String(MAX_MERGE_FILES))
    expect(error).toContain('browser tab')
  })

  it('waits for every file to open before agreeing', () => {
    expect(mergeError(3, 2)).toContain('Every chosen file')
  })

  it('allows a normal batch', () => {
    expect(mergeError(2, 2)).toBeNull()
    expect(mergeError(25, 25)).toBeNull()
  })
})

describe('mergedName', () => {
  it('keeps the first file name and marks the merge', () => {
    expect(mergedName('report.pdf')).toBe('report-merged.pdf')
    expect(mergedName('My Notes.PDF')).toBe('My Notes-merged.pdf')
  })

  it('still produces a PDF when the name had no extension', () => {
    expect(mergedName('scan')).toBe('scan-merged.pdf')
  })
})

describe('mergeSummary', () => {
  it('counts the files and the pages they add up to', () => {
    expect(mergeSummary([4, 1, 12])).toBe('3 files → 1 PDF, 17 pages.')
  })

  it('gets the singular right for one file and one page', () => {
    expect(mergeSummary([1])).toBe('1 file → 1 PDF, 1 page.')
  })

  it('handles an empty selection rather than dividing by zero', () => {
    expect(mergeSummary([])).toBe('0 files → 1 PDF, 0 pages.')
  })
})

describe('MERGE_NOTE', () => {
  it('states what survives and what does not, in that order', () => {
    expect(MERGE_NOTE).toContain('come across')
    expect(MERGE_NOTE).toContain('Bookmarks and fillable form fields do not')
  })
})
