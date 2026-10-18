/**
 * Merge decisions: how many files, what the result is called, and what the
 * user is told before they press the button.
 */

/** Beyond this, a single in-browser merge starts to exhaust the tab. */
export const MAX_MERGE_FILES = 25

/** Why a merge cannot start, or null when it can. */
export function mergeError(fileCount: number, openedCount: number): string | null {
  if (fileCount < 2) return 'Choose at least two PDFs to merge.'
  if (fileCount > MAX_MERGE_FILES) {
    return `This merge is limited to ${MAX_MERGE_FILES} files, to stay within what a browser tab can hold at once. Split the work into batches.`
  }
  if (openedCount !== fileCount) {
    return 'Every chosen file has to open before the merge can run. Remove any file that failed to load.'
  }
  return null
}

/** The output name: the first file's name, marked as merged. */
export function mergedName(firstFileName: string): string {
  const dot = firstFileName.lastIndexOf('.')
  const stem = dot > 0 ? firstFileName.slice(0, dot) : firstFileName
  return `${stem}-merged.pdf`
}

/**
 * A line describing what the merge will produce.
 *
 * The page count is the sum of the parts, which is only true once every file
 * has been opened — so the caller passes opened counts, not file names.
 */
export function mergeSummary(pageCounts: number[]): string {
  const files = pageCounts.length
  const pages = pageCounts.reduce((total, count) => total + count, 0)
  const fileLabel = files === 1 ? '1 file' : `${files} files`
  return `${fileLabel} → 1 PDF, ${pages} page${pages === 1 ? '' : 's'}.`
}

/**
 * What happens to the parts of a PDF that are not the pages themselves.
 *
 * `copyPages` deep-copies each page dictionary, so page content, text, images
 * and annotations that sit on a page all come across. What does not survive is
 * anything that lives in the document's index rather than on its pages:
 * bookmarks, and the registration that makes a form field fillable.
 */
export const MERGE_NOTE =
  'Page content, text, images and on-page annotations come across. Bookmarks and fillable form fields do not: a bookmark lives in the document’s index, and a form field only works when the document registers it. Merge with a PDF editor if you need those.'
