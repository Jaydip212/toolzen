import { useState } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { FileDrop, ToolPanel } from '@/tools/shared'
import { formatBytes } from '@/lib/utils'
import { hexPreview, identifySignature } from '@/lib/phase7/file-signatures'

interface Inspection {
  name: string
  size: number
  preview: string
  signature: ReturnType<typeof identifySignature>
}

export function FileSignatureInspector() {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: File[]) {
    const file = files[0]!
    setError(null)
    try {
      // Only the first 64 bytes are read — the whole file is never loaded.
      const head = new Uint8Array(await file.slice(0, 64).arrayBuffer())
      setInspection({
        name: file.name,
        size: file.size,
        preview: hexPreview(head),
        signature: identifySignature(head),
      })
    } catch {
      setError('The first bytes of that file could not be read in this browser.')
      setInspection(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Choose a file" description="Only the first 64 bytes are read. The file never leaves your browser.">
        <FileDrop
          onFiles={handleFiles}
          label="Drop any file to inspect its signature"
          hint="Reads the first 64 bytes only — safe even for very large files."
        />
      </ToolPanel>

      {error && <ErrorState title="Could not read the file" message={error} />}

      {inspection && (
        <ToolPanel title="Result">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="File" value={inspection.name} />
            <StatTile label="Size" value={formatBytes(inspection.size)} />
            <StatTile label="Detected type" value={inspection.signature?.name ?? 'Unrecognised signature'} />
            <StatTile label="Expected extension" value={inspection.signature?.extension ?? '—'} />
          </div>
          <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">First bytes (hex)</p>
            <p className="mt-1 break-all font-mono text-sm text-fg">{inspection.preview}</p>
          </div>
          {inspection.signature?.note && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{inspection.signature.note}</p>
          )}
          {!inspection.signature && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              No known magic number matched. This tool reports that honestly — it does not guess a
              type from the file extension.
            </p>
          )}
        </ToolPanel>
      )}
    </div>
  )
}

export default FileSignatureInspector
