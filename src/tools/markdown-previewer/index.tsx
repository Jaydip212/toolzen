import { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatTile } from '@/components/tools/StatTile'
import { DownloadButton, ToolPanel } from '@/tools/shared'
import { renderMarkdown } from '@/lib/markdown'
import { extractHeadings, markdownStats } from '@/lib/markdown-parse'
import { formatNumber } from '@/lib/utils'

const SAMPLE = `# TOOLZEN

Every tool in **one place** — free, and no account required.

## Why people use it

- Files are processed *in the browser* wherever possible
- No sign-up, no email, no watermark
- Works on desktop and mobile

## A quick table

| Tool | Category | Runs locally |
| --- | --- | --- |
| Word Counter | Text | Yes |
| Case Converter | Text | Yes |

> Nothing is uploaded unless a tool says so on its page.

\`\`\`js
const tool = "markdown-previewer"
\`\`\`

Read more in the [About page](/about).
`

export function MarkdownPreviewerTool() {
  const [source, setSource] = useState('')

  const html = useMemo(() => renderMarkdown(source), [source])
  const stats = useMemo(() => markdownStats(source), [source])
  const headings = useMemo(() => extractHeadings(source), [source])
  const hasSource = source.trim().length > 0

  const htmlDocument = useMemo(
    () =>
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Markdown preview</title>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setSource(SAMPLE)}>
          <Icon name="pilcrow" size={16} />
          Load sample
        </Button>
        <Button variant="ghost" onClick={() => setSource('')} disabled={!source}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
        {hasSource && (
          <>
            <CopyButton value={html} label="Copy HTML" />
            <DownloadButton
              filename="preview.html"
              text={htmlDocument}
              mimeType="text/html;charset=utf-8"
              label="Download HTML"
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
          <StatTile label="Code blocks" value={formatNumber(stats.codeBlocks)} />
        </div>
      )}

      {hasSource ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Textarea
              label="Markdown"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Write Markdown here…"
              rows={20}
              spellCheck={false}
              className="font-mono text-xs"
            />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-fg">Preview</p>
              <div
                className="tz-prose tz-scroll max-h-[32rem] overflow-auto rounded-xl border border-line bg-surface px-4 py-3"
                // Sanitised by DOMPurify inside renderMarkdown.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>

          {headings.length > 0 && (
            <ToolPanel
              title="Document outline"
              description="Headings found in your Markdown, in order."
            >
              <ol className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-2/30 p-4 text-sm">
                {headings.map((heading, index) => (
                  <li
                    key={`${heading.slug}-${index}`}
                    className="flex items-center gap-2 text-muted"
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
            The preview is sanitised before it is displayed, so scripts and inline event handlers
            inside your Markdown are stripped rather than executed.
          </p>
        </>
      ) : (
        <EmptyState
          icon="book-open"
          title="Nothing to preview yet"
          description="Type or paste Markdown on the left and the rendered result appears on the right, updating as you write."
          action={
            <Button variant="secondary" onClick={() => setSource(SAMPLE)}>
              Load sample
            </Button>
          }
        />
      )}
    </div>
  )
}

export default MarkdownPreviewerTool
