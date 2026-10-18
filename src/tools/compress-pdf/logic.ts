/**
 * Compression decisions.
 *
 * The only thing this tool can honestly promise is a structural re-save, so it
 * measures both ways rather than claiming a saving: the document is saved once
 * as it is and once with its objects packed into object streams, and the
 * smaller result is used. If packing makes the file bigger, that is reported
 * as a growth rather than hidden.
 *
 * What it does not do is re-compress embedded images, which is where most of
 * a bloated PDF's bytes live, and the scope note says so.
 */

export interface CompressionResult {
  /** The size of the file saved without object streams. */
  plainBytes: number
  /** The size saved with object streams. */
  packedBytes: number
  /** Bytes saved, or 0 when packing made the file larger. */
  saved: number
  /** The saving as a percentage of the plain size, rounded to one decimal. */
  savedShare: number
  /** True when the packed file is the larger one. */
  packedIsLarger: boolean
}

/** Compare the two saves and pick the honest story. */
export function compareSizes(plainBytes: number, packedBytes: number): CompressionResult {
  const saved = Math.max(0, plainBytes - packedBytes)
  return {
    plainBytes,
    packedBytes,
    saved,
    savedShare: plainBytes > 0 ? Math.round((saved / plainBytes) * 1000) / 10 : 0,
    packedIsLarger: packedBytes > plainBytes,
  }
}

/** Which save to use: the smaller one, always. */
export function smallerSave(result: CompressionResult): 'packed' | 'plain' {
  return result.packedIsLarger ? 'plain' : 'packed'
}

/** What to tell the user, based on what the measurement actually showed. */
export function verdictFor(result: CompressionResult): string {
  if (result.saved === 0) {
    return (
      'Packing the document’s objects made no difference, so the file is returned as it was. ' +
      'The space in this PDF is in its images, which this tool does not re-compress.'
    )
  }
  const share = result.savedShare === 0 ? 'less than 0.1%' : `${result.savedShare}%`
  return `Packing the document’s objects saved ${share} of the file. The result is the smaller of the two saves.`
}

/** Why a compression cannot start, or null when it can. */
export function compressionError(pageCount: number, plainBytes: number): string | null {
  if (pageCount < 1) return 'This PDF has no pages, so there is nothing to compress.'
  if (plainBytes <= 0) return 'That file could not be read, so its size could not be measured.'
  return null
}

/** A line describing both saves, e.g. "2.4 MB → 1.9 MB, saving 20.8%". */
export function sizeLine(result: CompressionResult, format: (bytes: number) => string): string {
  if (result.packedIsLarger) {
    return `${format(result.plainBytes)} → ${format(result.packedBytes)} — packing made it larger, so the original is kept.`
  }
  if (result.saved === 0) {
    return `${format(result.plainBytes)} → ${format(result.packedBytes)} — no change either way.`
  }
  return `${format(result.plainBytes)} → ${format(result.packedBytes)}, saving ${result.savedShare}%.`
}

/**
 * What this tool is for, stated before the button is pressed.
 *
 * Object streams pack many small PDF objects into one compressed container.
 * That helps documents with thousands of small objects and does almost nothing
 * for a document whose bytes are photographs.
 */
export const SCOPE_NOTE =
  'This re-saves the document with its objects packed into compressed object streams, and keeps whichever version is smaller. It does not re-compress images, re-encode fonts, or change anything visible. A PDF made of photographs will barely move; one made of thousands of small objects will.'

/** Whether the two saves are close enough that the tool should say so. */
export function isMarginal(result: CompressionResult): boolean {
  return result.savedShare > 0 && result.savedShare < 1
}
