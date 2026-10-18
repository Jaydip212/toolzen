/**
 * Rendering PDF pages to images, for the tools that show or export them.
 *
 * pdfjs-dist is close to a megabyte, so it is imported dynamically and only
 * when a tool actually needs to draw a page. The worker is loaded from a URL
 * that Vite resolves, which keeps it out of the main bundle too.
 *
 * Nothing here uploads: the document bytes are handed to pdfjs in this tab.
 */

/** The document type pdfjs hands back, narrowed to what this module uses. */
export type RenderablePage = {
  getViewport(options: { scale: number }): { width: number; height: number }
  render(options: {
    canvas: HTMLCanvasElement
    canvasContext: CanvasRenderingContext2D
    viewport: unknown
  }): { promise: Promise<void> }
  /** The positioned text items a page carries, which is the text layer. */
  getTextContent(): Promise<{ items: Array<Record<string, unknown>> }>
  cleanup(): void
}

/** The document type pdfjs hands back, narrowed to what this module uses. */
export type RenderableDocument = {
  numPages: number
  getPage(pageNumber: number): Promise<RenderablePage>
  /**
   * Releases the worker. Present at runtime, but not declared in the types
   * that ship with this version of pdfjs-dist, so it is optional here.
   */
  destroy?(): Promise<void>
}

export interface RenderedPage {
  /** A data URL, ready for an <img> src or a canvas encode. */
  dataUrl: string
  width: number
  height: number
}

/** How wide a thumbnail should be, in device-independent pixels. */
export const THUMBNAIL_WIDTH = 180

/** How wide a full-quality export should be, at 150 DPI for A4. */
export const EXPORT_WIDTH = 1275

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

/** Load pdfjs and its worker once, then reuse the same instance. */
export function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(async (pdfjs) => {
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      return pdfjs
    })
  }
  return pdfjsPromise
}

/** Open document bytes with pdfjs, for rendering. */
export async function openForRendering(bytes: Uint8Array): Promise<RenderableDocument> {
  const pdfjs = await loadPdfjs()
  // A copy per call: pdfjs transfers the buffer it is given to the worker,
  // which detaches it, and the caller still owns the original.
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) })
  return task.promise as Promise<RenderableDocument>
}

/**
 * Render one page to a data URL.
 *
 * The scale is derived from the requested width, so the caller asks for a size
 * rather than doing the viewport arithmetic. For JPEG the page is painted on
 * white first, because JPEG has no alpha and transparent areas would otherwise
 * render as black.
 */
export async function renderPage(
  pdf: RenderableDocument,
  pageNumber: number,
  targetWidth: number,
  as: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.85,
): Promise<RenderedPage> {
  const page = await pdf.getPage(pageNumber)
  const unit = page.getViewport({ scale: 1 })
  const scale = targetWidth > 0 ? targetWidth / unit.width : 1
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(viewport.width))
  canvas.height = Math.max(1, Math.round(viewport.height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser refused to create a canvas, so the page could not be rendered.')

  if (as === 'image/jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  await page.render({ canvas, canvasContext: context, viewport }).promise
  page.cleanup()

  return {
    dataUrl: canvas.toDataURL(as, quality),
    width: canvas.width,
    height: canvas.height,
  }
}

/** Every page number in a document, one-based. */
export function pageNumbersOf(pdf: RenderableDocument): number[] {
  const numbers: number[] = []
  for (let page = 1; page <= pdf.numPages; page += 1) numbers.push(page)
  return numbers
}

/**
 * The text items on one page, in reading order.
 *
 * This reads the text layer — the words the document actually stores — rather
 * than rendering anything, so a scanned page returns an empty list because
 * there are no words to find. Item shapes are passed through untyped so the
 * caller can decide what to keep.
 */
export async function pageTextItems(pdf: RenderableDocument, pageNumber: number) {
  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  return content.items
}
