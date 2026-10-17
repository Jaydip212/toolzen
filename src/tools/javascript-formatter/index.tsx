import { useCallback, useState } from 'react'
import { Checkbox, Input } from '@/components/ui/Form'
import { CodeFormatter } from '@/tools/shared/CodeFormatter'
import {
  DEFAULT_JS_OPTIONS,
  transformJavaScript,
  type JsFormatOptions,
  type JsMode,
} from './logic'

const SAMPLE = `// TOOLZEN example
const tool={name:"javascript-formatter",free:true}
function describe(t){const label=t.name.replace(/-/g," ");return \`\${label} — \${t.free?"free":"paid"}\`}
/* a block comment */
const url="https://example.com//not-a-comment"
const ratio=10/2
console.log(describe(tool),url,ratio)`

export function JavaScriptFormatterTool() {
  const [options, setOptions] = useState<JsFormatOptions>(DEFAULT_JS_OPTIONS)

  const format = useCallback(
    (text: string) => transformJavaScript(text, options, 'format' satisfies JsMode),
    [options],
  )
  const minify = useCallback(
    (text: string) => transformJavaScript(text, options, 'minify' satisfies JsMode),
    [options],
  )

  function update<K extends keyof JsFormatOptions>(key: K, value: JsFormatOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <CodeFormatter
      language="JavaScript"
      icon="braces"
      placeholder="Paste your JavaScript here…"
      sample={SAMPLE}
      filename="formatted.js"
      mimeType="text/javascript;charset=utf-8"
      format={format}
      minify={minify}
      minifyNote="Compact mode only touches whitespace: it removes indentation and blank lines, and optionally comments. It does NOT rename variables or remove dead code — that is what a real minifier such as Terser does, and a partial version would silently change how your code behaves."
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
              label="Space before parentheses"
              hint="Write “if (x)” rather than “if(x)”."
              checked={options.spaceInParen}
              onChange={(event) => update('spaceInParen', event.target.checked)}
            />
            <Checkbox
              label="Opening brace on the same line"
              hint="Write “function f() {” rather than a brace on its own line."
              checked={options.braceSameLine}
              onChange={(event) => update('braceSameLine', event.target.checked)}
            />
            <Checkbox
              label="Preserve existing line breaks"
              hint="Keep the blank lines that were already in the source."
              checked={options.preserveNewlines}
              onChange={(event) => update('preserveNewlines', event.target.checked)}
            />
            <Checkbox
              label="Remove comments"
              hint="Strip // and /* … */ comments. Comments inside strings and regular expressions are left alone."
              checked={options.stripComments}
              onChange={(event) => update('stripComments', event.target.checked)}
            />
          </div>
        </div>
      }
    />
  )
}

export default JavaScriptFormatterTool
