import { useCallback, useState } from 'react'
import { Checkbox, Input } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import { DEFAULT_HTML_OPTIONS, formatHtml, minifyHtml, type HtmlFormatOptions } from './logic'

const SAMPLE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>TOOLZEN</title></head>
<body>
<!-- a comment that the minifier removes -->
<div class="card"><h1>Hello</h1><p>Free tools, no account required.</p><ul><li>One</li><li>Two</li></ul></div>
<pre>  whitespace
   inside pre is preserved  </pre>
</body></html>`

export function HtmlFormatterTool() {
  const [options, setOptions] = useState<HtmlFormatOptions>(DEFAULT_HTML_OPTIONS)

  const format = useCallback((text: string) => formatHtml(text, options), [options])
  const minify = useCallback((text: string) => minifyHtml(text), [])

  function update<K extends keyof HtmlFormatOptions>(key: K, value: HtmlFormatOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <CodeFormatter
      language="HTML"
      icon="code"
      placeholder="Paste your HTML here…"
      sample={SAMPLE}
      filename="formatted.html"
      mimeType="text/html;charset=utf-8"
      format={format}
      minify={minify}
      minifyNote="Minify removes comments and collapses whitespace between tags. It does not rename classes, drop optional quotes or shorten colours — that needs a full minifier, and a half-working one would risk breaking your markup. Content inside <pre>, <textarea>, <script> and <style> is preserved exactly."
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
          <Input
            label="Wrap long lines at"
            type="number"
            min={0}
            max={400}
            value={options.wrapLineLength}
            hint="0 disables wrapping."
            onChange={(event) => update('wrapLineLength', Number(event.target.value))}
          />
          <Checkbox
            label="Indent with tabs"
            hint="Use tab characters instead of spaces."
            checked={options.useTabs}
            onChange={(event) => update('useTabs', event.target.checked)}
          />
          <Checkbox
            label="Preserve existing line breaks"
            hint="Keep the blank lines that were already in the source."
            checked={options.preserveNewlines}
            onChange={(event) => update('preserveNewlines', event.target.checked)}
          />
        </div>
      }
    />
  )
}

export default HtmlFormatterTool
