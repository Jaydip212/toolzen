/**
 * Size breakdown decisions.
 *
 * The tool walks the objects in a PDF and adds up the binary streams, because
 * "what is taking up the space" is a question about where the bytes are, not
 * about what the file is called. The verdict is deliberately conservative: it
 * says which kind of data dominates, and what that means for shrinking it.
 */

/** The kinds of stream a PDF can carry, as far as this tool is concerned. */
export type StreamKind = 'image' | 'font' | 'content' | 'other'

/** One stream found in the document. */
export interface StreamEntry {
  kind: StreamKind
  bytes: number
}

export interface SizePart {
  kind: StreamKind
  bytes: number
  /** Percentage of the whole file, rounded to one decimal. */
  share: number
}

export interface SizeReport {
  /** The size of the whole file. */
  total: number
  parts: SizePart[]
  /** The kind holding the most bytes, or null when there are no streams. */
  biggest: StreamKind | null
  /** The sum of the streams found, which is never more than the file. */
  measured: number
}

/** Add the streams up by kind, largest first. */
export function analyseSize(total: number, streams: StreamEntry[]): SizeReport {
  const totals = new Map<StreamKind, number>()
  for (const stream of streams) {
    totals.set(stream.kind, (totals.get(stream.kind) ?? 0) + stream.bytes)
  }

  const parts: SizePart[] = [...totals.entries()]
    .map(([kind, bytes]) => ({
      kind,
      bytes,
      share: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes)

  const measured = streams.reduce((sum, stream) => sum + stream.bytes, 0)

  return { total, parts, biggest: parts[0]?.kind ?? null, measured }
}

/** The label for a kind, as a reader would say it. */
export const KIND_LABELS: Record<StreamKind, string> = {
  image: 'Images',
  font: 'Fonts',
  content: 'Page content',
  other: 'Everything else',
}

/** Whether the measured streams can exceed the file they came from. */
export function isCoherent(report: SizeReport): boolean {
  return report.measured <= report.total
}

/**
 * What the breakdown means for shrinking the file.
 *
 * The honest answer depends on what dominates, and it differs by kind: images
 * dominate the usual bloated PDF and cannot be re-compressed here; fonts are
 * already compressed; content streams are the only part a re-save touches.
 * A document whose space is genuinely spread out is reported as such rather
 * than having a winner invented for it.
 */
export function adviceFor(report: SizeReport): string {
  const share = (kind: StreamKind) => report.parts.find((part) => part.kind === kind)?.share ?? 0
  const imageShare = share('image')

  if (report.parts.length === 0) {
    return 'No embedded streams were found. The document is structure rather than data, so there is nothing to shrink.'
  }
  if (imageShare >= 60) {
    return (
      'Images make up most of the file. A structural re-save will not shrink them, because re-compressing an ' +
      'embedded image means decoding and re-encoding it, which this tool does not do in the browser. Shrinking ' +
      'this file means shrinking the images before they go in.'
    )
  }
  if (imageShare >= 30) {
    return 'Images are the largest part, but not the whole story. A structural re-save may still help a little.'
  }
  if (report.biggest === 'font') {
    return 'Fonts are the largest part, and they are usually already compressed, so there is little to win here.'
  }
  if (report.biggest === 'content') {
    return 'Page content is the largest part, which is what happens with a text-heavy document. A structural re-save can help most here.'
  }
  return 'The space is spread across the document, with no single part dominating.'
}

/** A line describing the file, e.g. "2.4 MB total, 68% of it images". */
export function sizeSummary(report: SizeReport): string {
  if (report.parts.length === 0) return `${formatBinary(report.total)}, no embedded streams measured.`
  const top = report.parts[0]
  return `${formatBinary(report.total)}, ${top.share}% of it ${KIND_LABELS[top.kind].toLowerCase()}.`
}

/**
 * A binary size in the units a file manager uses.
 *
 * Binary units, because that is what an operating system reports, so the
 * number matches what the user sees outside the browser.
 */
export function formatBinary(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

/**
 * The caveat that belongs on the page.
 *
 * Object streams are the one structural win available, and they only help when
 * the document has many small objects. Saying so sets the expectation before
 * the user presses the button rather than after they see the number.
 */
export const SCOPE_NOTE =
  'This counts the binary streams inside the file — images, fonts and page content. It does not decode the images, and it cannot tell you whether any of them is larger than it needs to be. A measurement, not an optimisation.'
