import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Decode an image file into a drawable element.
 *
 * Returns null while decoding and an error string when it fails, so the
 * caller can show a real message rather than a broken page. `createImageBitmap`
 * is used where available because it does not tie the image to the DOM.
 */
export function useDecodedImage(file: File | null): {
  image: HTMLImageElement | ImageBitmap | null
  error: string | null
} {
  const [image, setImage] = useState<HTMLImageElement | ImageBitmap | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setImage(null)
      setError(null)
      return
    }
    // Capture the non-null value so the async closure sees a File, not null.
    const target = file

    let objectUrl: string | null = null
    let cancelled = false

    async function decode() {
      try {
        if (typeof createImageBitmap === 'function') {
          const bitmap = await createImageBitmap(target)
          if (!cancelled) {
            setImage(bitmap)
            setError(null)
          }
          return
        }
        // Fallback: an <img> fed by a blob URL.
        const element = new Image()
        objectUrl = URL.createObjectURL(target)
        element.src = objectUrl
        await element.decode()
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setImage(element)
        setError(null)
      } catch {
        if (!cancelled) {
          setImage(null)
          setError('That file could not be decoded as an image. It may be corrupt or in a format this browser cannot read.')
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    void decode()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return { image, error }
}

/** Decode a File into a drawable image, once, without React. */
export function decodeImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file as Blob)
  }
  return new Promise((resolve, reject) => {
    const element = new Image()
    const url = URL.createObjectURL(file)
    element.onload = () => {
      URL.revokeObjectURL(url)
      resolve(element)
    }
    element.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be decoded as an image.'))
    }
    element.src = url
  })
}

/** The pixel size of a decoded image, whichever decoder produced it. */
export function sizeOf(image: HTMLImageElement | ImageBitmap | null): {
  width: number
  height: number
} {
  if (!image) return { width: 0, height: 0 }
  return { width: image.width, height: image.height }
}

/**
 * Draw a source onto a fresh canvas at the given size.
 *
 * The source is cleared first, so a partially-drawn frame is never exported
 * when the caller's own draw step throws.
 */
export function drawToCanvas(
  source: CanvasImageSource,
  sourceBox: { x: number; y: number; width: number; height: number },
  target: { width: number; height: number },
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, target.width, target.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    source,
    sourceBox.x,
    sourceBox.y,
    sourceBox.width,
    sourceBox.height,
    0,
    0,
    target.width,
    target.height,
  )
  return canvas
}

/**
 * Encode a canvas and report the size of the result.
 *
 * `toBlob` is used rather than `toDataURL` because the blob is what gets
 * downloaded and measured, and a data URL would need re-parsing to do either.
 */
export function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<{ blob: Blob | null; size: number }> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve({ blob, size: blob?.size ?? 0 }),
      mime,
      quality / 100,
    )
  })
}

/**
 * Read the raw RGBA pixels of a canvas, for palette extraction.
 *
 * Sampling is capped so a 400-megapixel panorama cannot hang the page: the
 * count reported alongside lets the UI say "sampled" honestly.
 */
export function readPixels(
  canvas: HTMLCanvasElement,
  maxSamples = 4_000_000,
): { pixels: Uint8ClampedArray; sampled: boolean; total: number } {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return { pixels: new Uint8ClampedArray(), sampled: false, total: 0 }

  const total = canvas.width * canvas.height
  let width = canvas.width
  let height = canvas.height
  let sampled = false

  if (total > maxSamples) {
    // Scale down by the ratio needed to stay under the cap.
    const factor = Math.sqrt(maxSamples / total)
    width = Math.max(1, Math.round(canvas.width * factor))
    height = Math.max(1, Math.round(canvas.height * factor))
    sampled = true
  }

  // getImageData hands back a Uint8ClampedArray, which is a different type
  // from Uint8Array even though the palette code only reads bytes from it.
  if (sampled) {
    const scaled = document.createElement('canvas')
    scaled.width = width
    scaled.height = height
    const scaledContext = scaled.getContext('2d')
    if (!scaledContext) return { pixels: new Uint8ClampedArray(), sampled: false, total: 0 }
    scaledContext.drawImage(canvas, 0, 0, width, height)
    return { pixels: scaledContext.getImageData(0, 0, width, height).data, sampled, total }
  }

  return { pixels: context.getImageData(0, 0, width, height).data, sampled, total }
}

/** Read a File's bytes for header sniffing and EXIF parsing. */
export function useFileBytes(file: File | null): Uint8Array | null {
  const [bytes, setBytes] = useState<Uint8Array | null>(null)

  useEffect(() => {
    if (!file) {
      setBytes(null)
      return
    }
    let cancelled = false
    // Only the head is needed for format detection; EXIF lives there too.
    file
      .slice(0, 512 * 1024)
      .arrayBuffer()
      .then((buffer) => {
        if (!cancelled) setBytes(new Uint8Array(buffer))
      })
      .catch(() => {
        if (!cancelled) setBytes(null)
      })
    return () => {
      cancelled = true
    }
  }, [file])

  return bytes
}

/**
 * A debounced value, for the controls that would otherwise re-encode on every
 * keystroke.
 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/** A ref that always holds the latest callback, for long-lived listeners. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/** True while a promise-returning job is in flight. */
export function useBusy(): [boolean, <T>(job: () => Promise<T>) => Promise<T | null>] {
  const [busy, setBusy] = useState(false)

  const run = useCallback(async <T,>(job: () => Promise<T>): Promise<T | null> => {
    setBusy(true)
    try {
      return await job()
    } finally {
      setBusy(false)
    }
  }, [])

  return [busy, run]
}
