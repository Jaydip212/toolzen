import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, SegmentedControl, ToolPanel } from '@/tools/shared'
import { renderMarkdown } from '@/lib/markdown'
import { extractHeadings, markdownStats } from '@/lib/markdown-parse'
import { formatNumber } from '@/lib/utils'

type View = 'split' | 'editor' | 'preview'

const SAMPLE = `# Release notes

## What changed

- **Markdown Editor** is now available
- The preview is sanitised before rendering
- Everything runs in your browser

## A table

| Feature | Status |
| --- | --- |
| Live preview | Done |
| Toolbar | Done |
| Export | Done |

> Use the toolbar above, or just type — the preview updates as you go.

\`\`\`js
const tools = 98
\`\`\`
`

interface ToolbarAction {
  icon: IconName
  label: string
  run: (helpers: EditorHelpers) => void
}

interface EditorHelpers {
  wrap: (before: string, after: string, placeholder: string) => void
  prefixLines: (prefix: string, placeholder: string) => void
  insert: (text: string) => void
}

const TOOLBAR: ToolbarAction[] = [
  { icon: 'type', label: 'Bold', run: (h) => h.wrap('**', '**', 'bold text') },
  { icon: 'pilcrow', label: 'Italic', run: (h) => h.wrap('*', '*', 'italic text') },
  { icon: 'code', label: 'Inline code', run: (h) => h.wrap('`', '`', 'code') },
  { icon: 'link', label: 'Link', run: (h) => h.wrap('[', '](https://example.com)', 'link text') },
  { icon: 'image', label: 'Image', run: (h) => h.insert('![alt text](https://example.com/image.png)') },
  { icon: 'align-left', label: 'Heading', run: (h) => h.prefixLines('## ', 'Heading') },
  { icon: 'list', label: 'Bulleted list', run: (h) => h.prefixLines('- ', 'List item') },
  { icon: 'check-square', label: 'Task list', run: (h) => h.prefixLines('- [ ] ', 'Task') },
  { icon: 'file-text', label: 'Quote', run: (h) => h.prefixLines('> ', 'Quoted text') },
  { icon: 'table', label: 'Table', run: (h) => h.insert('\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n') },
  { icon: 'terminal', label: 'Code block', run: (h) => h.insert('\n```js\ncode\n```\n') },
  { icon: 'minus', label: 'Divider', run: (h) => h.insert('\n---\n') },
]

export function MarkdownEditorTool() {
  const [source, setSource] = useState('')
  const [view, setView] = useState<View>('split')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const html = useMemo(() => renderMarkdown(source), [source])
  const stats = useMemo(() => markdownStats(source), [source])
  const headings = useMemo(() => extractHeadings(source), [source])

  const htmlDocument = useMemo(
    () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Markdown document</title>
<style>
  body { max-width: 46rem; margin: 2rem auto; padding: 0 1rem; font: 16px/1.6 system-ui, sans-serif; color: #111; }
  pre { background: #f4f4f5; padding: 0.75rem; border-radius: 0.5rem; overflow: auto; }
  code { background: #f4f4f5; padding: 0.1rem 0.3rem; border-radius: 0.25rem; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
  blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #555; }
</style>
</head>
<body>
${html}
</body>
</html>
`,
    [html],
  )

  /** Replace the current selection with `before + selection + after`. */
  function wrap(before: string, after: string, placeholder: string) {
    const element = textareaRef.current
    if (!element) return
    const { selectionStart, selectionEnd, value } = element
    const selected = value.slice(selectionStart, selectionEnd) || placeholder
    const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
    setSource(next)
    window.requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(
        selectionStart + before.length,
        selectionStart + before.length + selected.length,
      )
    })
  }

  /** Prefix every line touched by the selection. */
  function prefixLines(prefix: string, placeholder: string) {
    const element = textareaRef.current
    if (!element) return
    const { selectionStart, selectionEnd, value } = element
    const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1
    const nextBreak = value.indexOf('\n', selectionEnd)
    const blockEnd = nextBreak === -1 ? value.length : nextBreak
    const block = value.slice(blockStart, blockEnd) || placeholder
    const prefixed = block
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n')
    const next = value.slice(0, blockStart) + prefixed + value.slice(blockEnd)
    setSource(next)
    window.requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(blockStart, blockStart + prefixed.length)
    })
  }

  /** Insert text at the caret. */
  function insert(text: string) {
    const element = textareaRef.current
    if (!element) return
    const { selectionStart, selectionEnd, value } = element
    const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
    setSource(next)
    window.requestAnimationFrame(() => {
      element.focus()
      const caret = selectionStart + text.length
      element.setSelectionRange(caret, caret)
    })
  }

  const helpers: EditorHelpers = { wrap, prefixLines, insert }
  const hasSource = source.trim() !== ''

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface-2/40 p-1.5">
        {TOOLBAR.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onClick={() => action.run(helpers)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <Icon name={action.icon} size={16} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-1">
          <SegmentedControl
            size="sm"
            label="Editor view"
            value={view}
            onChange={setView}
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'split', label: 'Split' },
              { value: 'preview', label: 'Preview' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setSource(SAMPLE)}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSource('')} disabled={!source}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
        {hasSource && (
          <>
            <CopyButton value={source} label="Copy Markdown" />
            <DownloadButton
              filename="document.md"
              text={source}
              mimeType="text/markdown;charset=utf-8"
              label="Download .md"
              variant="secondary"
            />
            <CopyButton value={html} label="Copy HTML" />
            <DownloadButton
              filename="document.html"
              text={htmlDocument}
              mimeType="text/html;charset=utf-8"
              label="Download .html"
              variant="secondary"
            />
          </>
        )}
      </div>

      {hasSource && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Words" value={formatNumber(stats.words)} />
          <StatTile label="Characters" value={formatNumber(stats.characters)} />
          <StatTile label="Lines" value={formatNumber(stats.lines)} />
          <StatTile label="Headings" value={formatNumber(stats.headings)} />
          <StatTile label="Links" value={formatNumber(stats.links)} />
          <StatTile label="Images" value={formatNumber(stats.images)} />
        </div>
      )}

      <div
        className={
          view === 'split' ? 'grid gap-4 lg:grid-cols-2' : 'grid gap-4'
        }
      >
        {view !== 'preview' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="markdown-editor" className="text-sm font-medium text-fg">
              Markdown
            </label>
            <textarea
              id="markdown-editor"
              ref={textareaRef}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Start writing Markdown, or press Load sample…"
              rows={22}
              spellCheck={false}
              className="tz-scroll w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-xs leading-relaxed text-fg outline-none placeholder:text-muted/70"
            />
          </div>
        )}

        {view !== 'editor' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-fg">Preview</p>
            {hasSource ? (
              <div
                className="tz-prose tz-scroll max-h-[36rem] min-h-[12rem] overflow-auto rounded-xl border border-line bg-surface px-4 py-3"
                // Sanitised by DOMPurify inside renderMarkdown.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-line px-6 text-center text-sm text-muted">
                The rendered preview appears here as you type.
              </div>
            )}
          </div>
        )}
      </div>

      {headings.length > 0 && (
        <ToolPanel title="Outline" description="Headings found in the document.">
          <ol className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-2/30 p-4 text-sm">
            {headings.map((heading, index) => (
              <li
                key={`${heading.slug}-${index}`}
                className="flex items-center gap-2"
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  H{heading.level}
                </span>
                <span className="text-fg">{heading.text}</span>
              </li>
            ))}
          </ol>
        </ToolPanel>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
        The preview is sanitised before rendering, so scripts and inline event handlers in your
        Markdown are stripped rather than executed. Your document is never uploaded.
      </p>
    </div>
  )
}

export default MarkdownEditorTool
