import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Form'
import { OutputArea } from './OutputArea'
import { SegmentedControl } from './SegmentedControl'
import { ToolPanel } from './ToolPanel'

import { AiError, probeAi, runAiTask } from '@/lib/ai-client'
import { sendSummary, splitProofread, taskById, type AiTaskId } from '@/lib/ai-tasks'

export interface AiToolProps {
  /** Which task this tool runs. The task holds its own labels and limits. */
  taskId: AiTaskId
  /** The file name for a downloaded result. */
  filename: string
}

/**
 * The shared body of every AI tool.
 *
 * All seven tools differ only in which task they name, so the honest states —
 * not configured, working, failed, done — are written once. That matters more
 * here than anywhere else on the platform: an AI tool that guesses when it has
 * no backend would be the exact thing TOOLZEN promises not to do.
 */
export function AiTool({ taskId, filename }: AiToolProps) {
  const task = taskById(taskId)

  const [status, setStatus] = useState<'probing' | 'ready' | 'unconfigured'>('probing')
  const [model, setModel] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!task) return
    // Start from each option's own fallback so the form is always valid.
    const initial: Record<string, string> = {}
    for (const option of task.options) initial[option.key] = option.fallback
    setOptions(initial)
  }, [task])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    void probeAi(controller.signal).then((next) => {
      if (cancelled) return
      setStatus(next.configured ? 'ready' : 'unconfigured')
      setModel(next.model)
    })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  if (!task) {
    return (
      <p className="text-sm text-danger">
        This tool is registered against a task that no longer exists. Nothing will run.
      </p>
    )
  }

  const overLimit = input.length > task.maxInput

  async function handleRun() {
    if (!task) return
    setBusy(true)
    setError(null)
    setResult(null)

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const text = await runAiTask(task.id, input, options, question, controller.signal)
      setResult(text)
    } catch (cause) {
      if (cause instanceof AiError && cause.code === 'cancelled') {
        setError('Cancelled. Nothing was returned.')
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('The request failed. Nothing was returned.')
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  if (status === 'probing') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner size={16} label="Checking" />
        Checking whether the AI backend is configured…
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className="flex flex-col gap-4">
        <ToolPanel title="This tool is not switched on yet">
          <p className="text-sm text-fg">
            TOOLZEN’s AI tools need a server-side API key, and this deployment does not have one set. Nothing has
            been sent anywhere, and no result has been made up to fill the space.
          </p>
          <p className="mt-2 text-xs text-muted">
            The site owner can switch these tools on by setting <code className="rounded bg-surface-2 px-1 py-0.5">AI_PROVIDER_API_KEY</code>{' '}
            in the hosting environment and enabling <code className="rounded bg-surface-2 px-1 py-0.5">VITE_AI_ENABLED</code> at build time. Until
            both are done, the tool stays listed as planned rather than pretending to work.
          </p>
        </ToolPanel>

        <ToolPanel title="Why it is built this way">
          <p className="text-sm text-muted">
            Every other TOOLZEN tool runs entirely in your browser. These seven cannot: producing new text needs a
            language model, and a key that ships to a browser is a key anyone can take. So the key stays on the
            server, and the server is the only part of TOOLZEN that ever sees your text.
          </p>
        </ToolPanel>
      </div>
    )
  }

  const proofread = task.id === 'grammar' && result ? splitProofread(result) : null

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title={`1. ${task.inputLabel}`}>
        <Textarea
          id={`${task.id}-input`}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setResult(null)
            setError(null)
          }}
          rows={task.id === 'document-qa' ? 12 : 8}
          spellCheck={task.id === 'grammar'}
          placeholder={task.placeholder}
          className="text-sm"
          aria-describedby={`${task.id}-count`}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">Nothing is sent until you press the button below.</p>
          <p id={`${task.id}-count`} className={`text-xs ${overLimit ? 'text-danger' : 'text-muted'}`}>
            {input.length.toLocaleString()} / {task.maxInput.toLocaleString()} characters
          </p>
        </div>
      </ToolPanel>

      {task.options.length > 0 && (
        <ToolPanel title="2. How it should read">
          <div className="flex flex-col gap-4">
            {task.options.map((option) => (
              <SegmentedControl
                key={option.key}
                label={option.label}
                options={option.choices}
                value={options[option.key] ?? option.fallback}
                onChange={(value) => {
                  setOptions({ ...options, [option.key]: value })
                  setResult(null)
                }}
              />
            ))}
          </div>
        </ToolPanel>
      )}

      {task.needsQuestion && (
        <ToolPanel title="2. Your question">
          <label htmlFor={`${task.id}-question`} className="text-sm font-medium text-fg">
            What do you want to know about it?
          </label>
          <Textarea
            id={`${task.id}-question`}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value)
              setResult(null)
            }}
            rows={3}
            placeholder="e.g. What is the notice period, and who do I tell?"
            className="mt-2 text-sm"
          />
        </ToolPanel>
      )}

      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
        <p className="text-xs text-fg">
          {sendSummary(task, input)}
          {model ? ` Model: ${model}.` : ''} This is the only kind of tool on TOOLZEN where your text leaves the
          browser.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void handleRun()} disabled={busy || input.trim() === '' || overLimit} size="lg">
          {busy ? (
            <>
              <Spinner size={16} label="Working" />
              Working…
            </>
          ) : (
            <>
              <Icon name="sparkles" size={16} />
              {task.label}
            </>
          )}
        </Button>
        {busy && (
          <Button variant="ghost" onClick={() => abortRef.current?.abort()} size="lg">
            Cancel
          </Button>
        )}
        {overLimit && <span className="text-sm text-danger">That is longer than this tool accepts.</span>}
      </div>

      {result && !proofread && (
        <ToolPanel title={task.resultLabel} className="border-success/30">
          <OutputArea value={result} filename={filename} mimeType="text/plain" rows={14} />
        </ToolPanel>
      )}

      {result && proofread && (
        <ToolPanel title={task.resultLabel} className="border-success/30">
          <OutputArea value={proofread.corrected} filename={filename} mimeType="text/plain" rows={12} />
          {proofread.notes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-fg">What changed</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                {proofread.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </ToolPanel>
      )}

      <p className="text-xs text-muted">
        AI output can be wrong. Read it before you send it, publish it or rely on it — the tool produces text, not
        verified fact.
      </p>
    </div>
  )
}

export default AiTool
