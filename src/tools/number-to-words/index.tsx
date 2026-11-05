import { useState } from 'react'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { numberToWords } from '@/lib/phase7/codecs'

export function NumberToWords() {
  const [value, setValue] = useState('1234567')
  const parsed = Number(value.trim())
  const result = value.trim() === '' ? null : numberToWords(parsed)
  const error =
    result === null
      ? 'Enter a whole number between -999,999,999,999,999 and 999,999,999,999,999.'
      : null

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="A number" description="Whole numbers only, in English.">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="numeric"
          placeholder="e.g. 1234567"
          aria-label="Number to spell out"
        />
      </ToolPanel>

      {error ? (
        <ErrorState title="Cannot spell that number" message={error} />
      ) : (
        <ToolPanel title="In words">
          <OutputArea
            value={result ?? ''}
            label="Number in words"
            placeholder="The words appear here…"
            rows={3}
            filename="number-in-words.txt"
          />
        </ToolPanel>
      )}
    </div>
  )
}

export default NumberToWords
