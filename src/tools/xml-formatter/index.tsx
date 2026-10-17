import { useCallback, useState } from 'react'
import { Checkbox, Select } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import { formatXml, minifyXml, validateXml } from './logic'

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?><catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><price>44.95</price><description>An in-depth look at creating applications with XML.</description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><price>5.95</price></book></catalog>`

export function XmlFormatterTool() {
  const [indentSize, setIndentSize] = useState('2')
  const [validate, setValidate] = useState(true)

  const indent = indentSize === 'tab' ? '\t' : ' '.repeat(Number(indentSize))

  const check = useCallback(
    (input: string) => {
      if (!validate) return
      const error = validateXml(input)
      if (error) {
        const where =
          error.line !== null
            ? ` (line ${error.line}${error.column !== null ? `, column ${error.column}` : ''})`
            : ''
        throw new Error(`${error.message}${where}`)
      }
    },
    [validate],
  )

  const format = useCallback(
    (input: string) => {
      check(input)
      return formatXml(input, indent)
    },
    [check, indent],
  )

  const minify = useCallback(
    (input: string) => {
      check(input)
      return minifyXml(input)
    },
    [check],
  )

  return (
    <CodeFormatter
      language="XML"
      placeholder={'<?xml version="1.0"?>\n<root>\n  <item id="1">value</item>\n</root>'}
      sample={SAMPLE}
      filename="formatted.xml"
      mimeType="application/xml"
      format={format}
      minify={minify}
      icon="code"
      minifyNote="Whitespace between tags is removed. Whitespace inside pre, textarea, script and style is preserved exactly, because there it is significant."
      optionsPanel={
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Indent"
            value={indentSize}
            containerClassName="w-32"
            onChange={(event) => setIndentSize(event.target.value)}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </Select>
          <Checkbox
            label="Check well-formedness first"
            hint="Uses the browser's XML parser. Turn it off if you are formatting a fragment rather than a whole document."
            checked={validate}
            onChange={(event) => setValidate(event.target.checked)}
          />
        </div>
      }
    />
  )
}

export default XmlFormatterTool
