import { useState } from 'react'

import { ToolPanel } from '@/tools/shared'
import { StatTile } from '@/components/tools/StatTile'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { extensionForMime, parseDataUrl, sniffImage, validateBase64 } from './logic'

/** Turn a pasted Base64 string back into an image. */
export default function Base64ToImage() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    url: string
    name: string
    bytes: number
    /** The MIME type a pasted data URL claimed, if one did. */
    claimed: string | null
  } | null>(null)

  function handleDecode() {
    setError(null)
    setResult(null)

    const trimmed = input.trim()
    // A whole data URL is the single most common paste; accept it too.
    if (trimmed.startsWith('data:')) {
      const parsed = parseDataUrl(trimmed)
      if (!parsed) {
        setError('That data URL could not be read. Copy it again, including the whole “base64,” part.')
        return
      }
      // Trust the bytes first, and fall back to the URL's own claim when the
      // bytes are not a format this tool recognises.
      const found = sniffImage(parsed.bytes)
      const extension = found.extension === 'bin' ? extensionForMime(parsed.mime) : found.extension
      const mime = found.mime === 'application/octet-stream' ? parsed.mime : found.mime
      const blob = new Blob([parsed.bytes.buffer as ArrayBuffer], { type: mime })
      setResult({
        url: URL.createObjectURL(blob),
        name: `decoded-image.${extension}`,
        bytes: parsed.bytes.length,
        claimed: parsed.mime,
      })
      return
    }

    const validated = validateBase64(input)
    if (!validated.ok) {
      setError(validated.error)
      return
    }

    // No way to know the format from Base64 alone, so ask the bytes.
    const found = sniffImage(validated.bytes)
    const blob = new Blob([validated.bytes.buffer as ArrayBuffer], { type: found.mime })
    setResult({
      url: URL.createObjectURL(blob),
      name: `decoded-image.${found.extension}`,
      bytes: validated.bytes.length,
      claimed: null,
    })
  }

  return (
    <div className="space-y-4">
      <ToolPanel title="Paste Base64">
        <label htmlFor="b64" className="text-sm font-medium text-fg">
          The Base64 text, or a whole data: URL
        </label>
        <textarea
          id="b64"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={6}
          spellCheck={false}
          placeholder="iVBORw0KGgoAAAANSUhEUg…"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-fg"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={handleDecode} disabled={!input.trim()}>
            Decode
          </Button>
          {input && <CopyButton value={input} label="Copy the text back" />}
        </div>
        <p className="mt-2 text-xs text-muted">
          Nothing is sent anywhere. Decoding happens in this tab.
        </p>
      </ToolPanel>

      {result && (
        <ToolPanel
          title="Decoded"
          actions={
            <a
              href={result.url}
              download={result.name}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg"
            >
              Download {result.name}
            </a>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Bytes" value={result.bytes.toLocaleString()} />
            <StatTile label="Suggested name" value={result.name} />
          </div>
          {result.claimed !== null && (
            <p className="mt-3 text-xs text-muted">
              The data URL said {result.claimed}.{' '}
              {result.name === `decoded-image.${extensionForMime(result.claimed)}`
                ? 'The bytes agree.'
                : 'The bytes say otherwise, so the file is named from the bytes.'}
            </p>
          )}
          {result.name.endsWith('.bin') && (
            <p className="mt-3 text-xs text-muted">
              The decoded bytes are not an image this tool recognises, so the download is named .bin. The file may be
              something else entirely.
            </p>
          )}
          <img src={result.url} alt="The decoded image" className="mt-3 max-h-72 rounded border border-line" />
        </ToolPanel>
      )}
    </div>
  )
}
