import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, FileDrop, OutputArea, SegmentedControl, ToolPanel, useObjectUrl } from '@/tools/shared'
import { formatBytes, formatNumber } from '@/lib/utils'
import {
  Base64Error,
  base64ByteLength,
  base64Overhead,
  decodeBase64,
  encodeBase64,
  encodeBase64Bytes,
  parseDataUrl,
  textByteLength,
  toDataUrl,
} from './logic'

type Mode = 'encode' | 'decode' | 'file' | 'unpack'

const SAMPLE = 'TOOLZEN — every tool, one place.'

export function Base64EncoderDecoderTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [text, setText] = useState('')
  const [encoded, setEncoded] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [unpacked, setUnpacked] = useState<{ name: string; blob: Blob } | null>(null)

  const decodedPreview = useObjectUrl(unpacked?.blob ?? null)

  const encodeResult = useMemo(() => {
    if (mode !== 'encode') return ''
    return encodeBase64(text)
  }, [mode, text])

  const decodeResult = useMemo(() => {
    if (mode !== 'decode' || encoded.trim() === '') return { value: '', error: null as string | null }
    try {
      return { value: decodeBase64(encoded), error: null as string | null }
    } catch (error) {
      return { value: '', error: error instanceof Base64Error ? error.message : String(error) }
    }
  }, [mode, encoded])

  const unpackResult = useMemo(() => {
    if (mode !== 'unpack' || dataUrl.trim() === '') return { parsed: null, error: null as string | null }
    try {
      const parsed = parseDataUrl(dataUrl)
      return { parsed, error: null as string | null }
    } catch (error) {
      return { parsed: null, error: error instanceof Base64Error ? error.message : String(error) }
    }
  }, [mode, dataUrl])

  async function loadFile(selected: File[]) {
    const next = selected[0]
    if (!next) return
    setFileError(null)
    setFile(next)
    setFileBytes(null)
    try {
      const buffer = await next.arrayBuffer()
      setFileBytes(new Uint8Array(buffer))
    } catch {
      setFileError('That file could not be read. It may have been moved or the browser may have blocked it.')
    }
  }

  function clearAll() {
    setText('')
    setEncoded('')
    setFile(null)
    setFileBytes(null)
    setFileError(null)
    setDataUrl('')
    setUnpacked(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'encode', label: 'Text → Base64' },
          { value: 'decode', label: 'Base64 → Text' },
          { value: 'file', label: 'File → Base64' },
          { value: 'unpack', label: 'Data URL' },
        ]}
      />

      {mode === 'encode' && (
        <>
          <Textarea
            label="Your text"
            rows={8}
            value={text}
            placeholder="Type or paste anything. Non-ASCII characters are encoded as UTF-8 first."
            onChange={(event) => setText(event.target.value)}
          />

          {text !== '' && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Input bytes" value={formatNumber(textByteLength(text))} hint="UTF-8" />
                <StatTile label="Output length" value={formatNumber(encodeResult.length)} hint="Base64 characters" />
                <StatTile label="Overhead" value={`+${base64Overhead(textByteLength(text))}%`} hint="inherent to Base64" />
                <StatTile label="Decoded size" value={formatNumber(base64ByteLength(encodeResult))} hint="matches the input" />
              </div>

              <OutputArea
                label="Base64"
                value={encodeResult}
                filename="encoded.txt"
                mimeType="text/plain"
                rows={8}
              />
            </>
          )}

          {text === '' && (
            <EmptyState
              icon="braces"
              title="Enter some text to encode"
              description="Everything is encoded in your browser using TextEncoder first, so accented characters and emoji survive the round trip intact."
              action={
                <Button variant="secondary" onClick={() => setText(SAMPLE)}>
                  Try a sample
                </Button>
              }
            />
          )}
        </>
      )}

      {mode === 'decode' && (
        <>
          <Textarea
            label="Base64"
            rows={8}
            value={encoded}
            placeholder="aGVsbG8gd29ybGQ="
            className="font-mono text-xs"
            spellCheck={false}
            onChange={(event) => setEncoded(event.target.value)}
          />

          {decodeResult.error && (
            <ErrorState title="That is not valid Base64" message={decodeResult.error} />
          )}

          {!decodeResult.error && encoded.trim() !== '' && (
            <OutputArea
              label="Decoded text"
              value={decodeResult.value}
              filename="decoded.txt"
              mimeType="text/plain"
              rows={8}
            />
          )}

          {encoded.trim() === '' && (
            <EmptyState
              icon="code"
              title="Paste some Base64"
              description="Whitespace and line breaks are ignored, so a value copied out of a JSON file or an email header will decode cleanly."
            />
          )}
        </>
      )}

      {mode === 'file' && (
        <>
          <ToolPanel
            title="Choose a file"
            description="The file is read locally with the File API. Nothing is uploaded."
            actions={
              file && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <Icon name="trash" size={16} />
                  Clear
                </Button>
              )
            }
          >
            <FileDrop
              label="Drop a file here"
              hint="Any file type. Very large files will make the page slow — the whole result is held in memory."
              onFiles={(files) => void loadFile(files)}
            />
          </ToolPanel>

          {fileError && <ErrorState title="Could not read that file" message={fileError} />}

          {file && fileBytes && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="File" value={<span className="text-base">{file.name}</span>} hint={file.type || 'unknown type'} />
                <StatTile label="Size" value={formatBytes(file.size)} />
                <StatTile label="Base64 length" value={formatNumber(encodeBase64Bytes(fileBytes).length)} hint="characters" />
                <StatTile label="Overhead" value={`+${base64Overhead(file.size)}%`} />
              </div>

              <ToolPanel
                title="Result"
                description="Two forms are offered: a bare Base64 string, and a data: URL you can paste into CSS or an img src."
                actions={
                  <div className="flex flex-wrap gap-2">
                    <DownloadButton
                      filename={`${file.name}.base64.txt`}
                      text={encodeBase64Bytes(fileBytes)}
                      mimeType="text/plain"
                      label="Download .txt"
                    />
                  </div>
                }
              >
                <OutputArea
                  label="Base64"
                  value={encodeBase64Bytes(fileBytes)}
                  filename={`${file.name}.base64.txt`}
                  mimeType="text/plain"
                  rows={10}
                />
                <OutputArea
                  label="Data URL"
                  value={toDataUrl(fileBytes, file.type)}
                  filename={`${file.name}.dataurl.txt`}
                  mimeType="text/plain"
                  rows={4}
                />
              </ToolPanel>
            </>
          )}

          {!file && (
            <EmptyState
              icon="upload"
              title="No file selected"
              description="Drop any file to get its Base64 form and a ready-to-use data: URL."
            />
          )}
        </>
      )}

      {mode === 'unpack' && (
        <>
          <Textarea
            label="Data URL"
            rows={6}
            value={dataUrl}
            placeholder="data:image/png;base64,iVBORw0KGgo..."
            className="font-mono text-xs"
            spellCheck={false}
            onChange={(event) => {
              setDataUrl(event.target.value)
              setUnpacked(null)
            }}
          />

          {unpackResult.error && (
            <ErrorState title="That data URL could not be read" message={unpackResult.error} />
          )}

          {unpackResult.parsed && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Media type" value={<span className="text-base">{unpackResult.parsed.mimeType}</span>} />
                <StatTile label="Decoded size" value={formatBytes(unpackResult.parsed.bytes.length)} />
                <StatTile label="Base64 length" value={formatNumber(unpackResult.parsed.base64.length)} />
                <StatTile label="Bytes" value={formatNumber(unpackResult.parsed.bytes.length)} />
              </div>

              <ToolPanel
                title="Extracted file"
                description="Previewed when the browser can display the media type."
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const extension = unpackResult.parsed?.mimeType.split('/')[1]?.split('+')[0] ?? 'bin'
                      setUnpacked({
                        name: `decoded.${extension}`,
                        blob: new Blob([unpackResult.parsed!.bytes.buffer as ArrayBuffer], {
                          type: unpackResult.parsed!.mimeType,
                        }),
                      })
                    }}
                  >
                    Prepare download
                  </Button>
                }
              >
                {decodedPreview && unpacked && (
                  <div className="flex flex-col gap-3">
                    {unpacked.blob.type.startsWith('image/') ? (
                      <img
                        src={decodedPreview}
                        alt="Decoded preview"
                        className="max-h-72 w-auto self-start rounded-xl border border-line"
                      />
                    ) : (
                      <p className="text-sm text-muted">
                        This media type cannot be previewed inline. Use the download button below.
                      </p>
                    )}
                    <DownloadButton filename={unpacked.name} blob={unpacked.blob} label="Download" />
                  </div>
                )}
                {!decodedPreview && (
                  <p className="text-sm text-muted">
                    Press “Prepare download” to build the file from the decoded bytes.
                  </p>
                )}
              </ToolPanel>
            </>
          )}

          {dataUrl.trim() === '' && (
            <EmptyState
              icon="file"
              title="Paste a data URL"
              description="Data URLs look like data:image/png;base64,…. This reads the media type, decodes the payload and gives you the original file back."
            />
          )}
        </>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Base64 is an encoding, not encryption. Anyone can reverse it, so never use it to hide a secret.{' '}
        <Badge variant="outline">+{base64Overhead(100)}% typical overhead</Badge>
      </p>
    </div>
  )
}

export default Base64EncoderDecoderTool
