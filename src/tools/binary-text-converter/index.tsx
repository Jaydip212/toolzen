import { useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { SegmentedControl, ToolPanel, OutputArea } from '@/tools/shared'
import { binaryToText, textToBinary } from '@/lib/phase7/codecs'

export function BinaryTextConverter() {
  const [mode, setMode] = useState<'to-binary' | 'to-text'>('to-binary')
  const [input, setInput] = useState('Hello, TOOLZEN!')

  const decoded = mode === 'to-text' ? binaryToText(input) : null
  const output = mode === 'to-binary' ? textToBinary(input) : decoded?.ok ? decoded.text : ''

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Direction">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          label="Conversion direction"
          options={[
            { value: 'to-binary', label: 'Text to binary' },
            { value: 'to-text', label: 'Binary to text' },
          ]}
        />
      </ToolPanel>

      <ToolPanel title="Input" description={mode === 'to-binary' ? 'UTF-8 text — accents and emoji are handled correctly.' : 'Eight-digit binary groups separated by spaces.'}>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={6}
          aria-label="Text or binary to convert"
          spellCheck={false}
          placeholder={mode === 'to-binary' ? 'Type some text…' : '01001000 01101001'}
        />
      </ToolPanel>

      {decoded && !decoded.ok ? (
        <ErrorState title="Cannot decode that" message={decoded.error} />
      ) : (
        <ToolPanel title="Output">
          <OutputArea
            value={output}
            label="Converted output"
            placeholder="The conversion appears here…"
            rows={6}
            filename={mode === 'to-binary' ? 'binary.txt' : 'decoded.txt'}
          />
        </ToolPanel>
      )}
    </div>
  )
}

export default BinaryTextConverter
