/**
 * Browser download helpers.
 *
 * All TOOLZEN tools produce their output locally, so every download is an
 * object URL created from an in-memory Blob. Nothing is uploaded.
 */

/** Start a browser download for `href`, optionally naming the saved file. */
function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** Download a Blob, releasing the object URL once the browser has taken it. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  // Revoke on the next macrotask so the download has already started.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Download a string as a file with the given MIME type. */
export function downloadText(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename)
}

/** Download a data: URL (used for canvas output such as PNG/JPEG/QR). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  triggerDownload(dataUrl, filename)
}

/** Turn a filename into a safe base name for a derived download. */
export function baseName(filename: string): string {
  const withoutPath = filename.split(/[\\/]/).pop() ?? filename
  const dot = withoutPath.lastIndexOf('.')
  return dot > 0 ? withoutPath.slice(0, dot) : withoutPath
}
