import { useState } from 'react'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { intToRoman, romanToInt } from '@/lib/phase7/codecs'

export function RomanNumeralConverter() {
  const [value, setValue] = useState('2026')
  const trimmed = value.trim()
  const asNumber = Number(trimmed)
  const fromNumber = trimmed !== '' && Number.isInteger(asNumber)
  const roman = fromNumber ? intToRoman(asNumber) : null
  const arabic = fromNumber ? null : romanToInt(trimmed)
  const error =
    trimmed !== '' && roman === null && arabic === null
      ? 'Enter a whole number from 1 to 3999, or a canonical Roman numeral such as MCMXCIV.'
      : null

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Number or Roman numeral" description="Type either one — the conversion is detected automatically.">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. 2026 or MMXXVI"
          aria-label="Number or Roman numeral"
        />
      </ToolPanel>

      {error ? (
        <ErrorState title="Cannot convert that" message={error} />
      ) : (
        <ToolPanel title="Result">
          <OutputArea
            value={roman !== null ? roman : arabic !== null ? String(arabic) : ''}
            label="Converted value"
            placeholder="The conversion appears here…"
            rows={2}
            filename="roman-numeral.txt"
          />
        </ToolPanel>
      )}
    </div>
  )
}

export default RomanNumeralConverter
