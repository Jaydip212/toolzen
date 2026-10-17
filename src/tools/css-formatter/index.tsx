import { useCallback, useState } from 'react'
import { Checkbox, Input } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import { DEFAULT_CSS_OPTIONS, formatCss, minifyCss, type CssFormatOptions } from './logic'

const SAMPLE = `/* TOOLZEN card */
:root{--brand:#4f46e5}
.card{display:flex;flex-direction:column;gap:1rem;padding:1.5rem;border:1px solid #e5e7eb;border-radius:1rem}
.card h2,.card h3{font-weight:600;color:var(--brand)}
.card::after{content:"a  b   c"}
@media (max-width:640px){.card{padding:1rem}}`

export function CssFormatterTool() {
  const [options, setOptions] = useState<CssFormatOptions>(DEFAULT_CSS_OPTIONS)

  const format = useCallback((text: string) => formatCss(text, options), [options])
  const minify = useCallback((text: string) => minifyCss(text), [])

  function update<K extends keyof CssFormatOptions>(key: K, value: CssFormatOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <CodeFormatter
      language="CSS"
      icon="palette"
      placeholder="Paste your CSS here…"
      sample={SAMPLE}
      filename="formatted.css"
      mimeType="text/css;charset=utf-8"
      format={format}
      minify={minify}
      minifyNote="Minify strips comments and whitespace around punctuation. Text inside string literals — such as a content value — is never altered."
      optionsPanel={
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Input
            label="Indent size"
            type="number"
            min={1}
            max={8}
            value={options.indentSize}
            disabled={options.useTabs}
            hint="Spaces per indent level (1–8)."
            onChange={(event) => update('indentSize', Number(event.target.value))}
          />
          <div className="flex flex-col gap-3">
            <Checkbox
              label="Indent with tabs"
              hint="Use tab characters instead of spaces."
              checked={options.useTabs}
              onChange={(event) => update('useTabs', event.target.checked)}
            />
            <Checkbox
              label="One selector per line"
              hint="Split grouped selectors such as a, b, c onto separate lines."
              checked={options.selectorSeparatorNewline}
              onChange={(event) => update('selectorSeparatorNewline', event.target.checked)}
            />
            <Checkbox
              label="Blank line between rules"
              hint="Add a blank line before each new rule."
              checked={options.newlineBetweenRules}
              onChange={(event) => update('newlineBetweenRules', event.target.checked)}
            />
          </div>
        </div>
      }
    />
  )
}

export default CssFormatterTool
