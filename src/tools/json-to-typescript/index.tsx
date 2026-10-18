import { useMemo, useState } from 'react'
import { Input, Textarea } from '@/components/ui/Form'
import { CopyButton } from '@/components/ui/CopyButton'
import { Icon } from '@/components/ui/Icon'
import { ErrorState } from '@/components/ui/ErrorState'
import { OutputArea, ToolPanel } from '@/tools/shared'
import { generateFromJson } from './logic'

const SAMPLE = JSON.stringify(
  {
    orderId: 'A-1024',
    customer: { name: 'Ada Lovelace', tier: 'gold' },
    lines: [
      { sku: 'BOOK-1', qty: 2, price: 18.5 },
      { sku: 'PEN-9', qty: 1, price: 3.25 },
    ],
    giftWrap: null,
  },
  null,
  2,
)

export function JsonToTypescriptTool() {
  const [input, setInput] = useState(SAMPLE)
  const [rootName, setRootName] = useState('Root')

  const result = useMemo(() => generateFromJson(input, rootName.trim() === '' ? 'Root' : rootName), [input, rootName])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The JSON" description="Every object becomes an interface; arrays get their element type.">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={10}
          placeholder="Paste JSON here…"
          aria-label="JSON to convert"
          spellCheck={false}
        />
      </ToolPanel>

      <ToolPanel title="Root type name">
        <Input
          value={rootName}
          onChange={(event) => setRootName(event.target.value)}
          placeholder="Root"
          aria-label="Root type name"
          leading={<Icon name="braces" size={16} />}
        />
      </ToolPanel>

      {!result.ok && <ErrorState title="Could not read that JSON" message={result.error} />}

      {result.ok && (
        <ToolPanel
          title="TypeScript"
          description={
            result.result.interfaces.length > 0
              ? `${result.result.interfaces.length} interface${result.result.interfaces.length === 1 ? '' : 's'} generated.`
              : undefined
          }
          actions={<CopyButton value={result.result.code} label="Copy types" size="sm" />}
        >
          <OutputArea value={result.result.code} label="Generated TypeScript" mimeType="text/plain" rows={14} filename="types.ts" />
        </ToolPanel>
      )}
    </div>
  )
}

export default JsonToTypescriptTool
