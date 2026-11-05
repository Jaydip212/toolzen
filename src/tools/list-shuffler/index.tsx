import { useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { Icon } from '@/components/ui/Icon'
import { ToolPanel } from '@/tools/shared'
import { shuffleLines } from '@/lib/phase7/generators'

export function ListShuffler() {
  const [input, setInput] = useState('Alpha\nBeta\nGamma\nDelta\nEpsilon')
  const [output, setOutput] = useState<string[] | null>(null)

  function run() {
    const lines = input.split(/\r?\n/).filter((line) => line.trim() !== '')
    setOutput(shuffleLines(lines.join('\n')))
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel
        title="Your list"
        description="One item per line. Blank lines are skipped; duplicates are preserved."
        actions={
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-fg transition-colors hover:border-brand/40 hover:text-brand"
          >
            <Icon name="shuffle" size={14} />
            Shuffle
          </button>
        }
      >
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} aria-label="List to shuffle" />
      </ToolPanel>

      {output !== null && (
        <ToolPanel
          title="Shuffled"
          description="Uses crypto.getRandomValues with a Fisher-Yates shuffle."
          actions={<CopyButton value={output.join('\n')} label="Copy shuffled list" size="sm" />}
        >
          {output.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
              Nothing to shuffle — add at least one line.
            </p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg">
              {output.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ol>
          )}
        </ToolPanel>
      )}
    </div>
  )
}

export default ListShuffler
