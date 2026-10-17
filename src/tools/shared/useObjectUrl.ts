import { useEffect, useState } from 'react'

/**
 * Keep an object URL in sync with the lifetime of a Blob.
 *
 * Returns `null` while there is no blob and revokes the previous URL whenever
 * the blob changes or the component unmounts, so previews never leak memory.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}

export default useObjectUrl
