/**
 * The seven AI tasks, defined once.
 *
 * The serverless function imports this module to build its prompts, and the
 * browser imports it for the labels and limits. The prompts live here rather
 * than in the request body on purpose: if the client could send its own system
 * message, the endpoint would be a free general-purpose language-model proxy
 * on TOOLZEN's key. The client only ever names a task and supplies its input.
 *
 * The key itself is never in this file, never in the browser bundle and never
 * in a response.
 */

/** The tasks the endpoint will run. Anything else is rejected. */
export type AiTaskId = 'summarise' | 'write' | 'grammar' | 'email' | 'document-qa' | 'translate' | 'rewrite'

export interface AiChoice {
  value: string
  label: string
}

export interface AiOption {
  key: string
  label: string
  choices: AiChoice[]
  fallback: string
}

export interface AiTask {
  id: AiTaskId
  /** The registry id of the tool that exposes this task. */
  toolId: string
  /** A short name for the task itself, used in error messages. */
  label: string
  /** The label above the main text box. */
  inputLabel: string
  /** The hint inside the main text box. */
  placeholder: string
  /** The heading shown above the answer. */
  resultLabel: string
  /** The longest input accepted, in characters. */
  maxInput: number
  /** Whether the request carries a separate question alongside the input. */
  needsQuestion: boolean
  /** The options this task understands, in display order. */
  options: AiOption[]
  /** The instruction the model is given. Never comes from the client. */
  system: string
  /** How much room the answer is allowed, in tokens. */
  maxOutput: number
  /** Turns the input into the user message. */
  prompt: (input: string, options: Record<string, string>, question: string) => string
}

/**
 * The longest input any task accepts.
 *
 * A ceiling exists for two reasons: the model has a finite context, and an
 * endpoint that accepts unlimited text is an endpoint that can be made
 * expensive by one request.
 */
export const HARD_INPUT_LIMIT = 20_000

const COMMON_RULES =
  'Return only the requested text. Do not wrap it in markdown code fences, do not add a preamble, and do not describe what you are about to do.'

export const TASKS: AiTask[] = [
  {
    id: 'summarise',
    toolId: 'ai-text-summarizer',
    label: 'Summarise',
    inputLabel: 'The text to summarise',
    placeholder: 'Paste the article, report or notes you want shortened.',
    resultLabel: 'Summary',
    maxInput: HARD_INPUT_LIMIT,
    needsQuestion: false,
    options: [
      {
        key: 'length',
        label: 'Length',
        fallback: 'standard',
        choices: [
          { value: 'brief', label: 'Brief — about three sentences' },
          { value: 'standard', label: 'Standard — one paragraph' },
          { value: 'detailed', label: 'Detailed — several paragraphs' },
        ],
      },
    ],
    system: `You summarise text faithfully. Use only facts that appear in the source. If the source is too short or too unclear to summarise, say so in one sentence rather than inventing content. ${COMMON_RULES}`,
    maxOutput: 900,
    prompt: (input, options) => {
      const length = options.length ?? 'standard'
      const target =
        length === 'brief'
          ? 'in about three sentences'
          : length === 'detailed'
            ? 'in several paragraphs, keeping the important detail'
            : 'in one paragraph'
      return `Summarise the following text ${target}.\n\n---\n${input}\n---`
    },
  },
  {
    id: 'write',
    toolId: 'ai-writing-assistant',
    label: 'Write',
    inputLabel: 'What you want written',
    placeholder: 'Describe what you need: the topic, the audience, and the points to cover.',
    resultLabel: 'Draft',
    maxInput: 6_000,
    needsQuestion: false,
    options: [
      {
        key: 'tone',
        label: 'Tone',
        fallback: 'neutral',
        choices: [
          { value: 'neutral', label: 'Neutral' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'formal', label: 'Formal' },
          { value: 'persuasive', label: 'Persuasive' },
        ],
      },
      {
        key: 'shape',
        label: 'Shape',
        fallback: 'paragraphs',
        choices: [
          { value: 'paragraphs', label: 'Flowing paragraphs' },
          { value: 'bullets', label: 'Short bullets' },
        ],
      },
    ],
    system: `You are a careful writing assistant. You write what the brief asks for, in the tone and shape requested. You do not add claims the brief does not support. ${COMMON_RULES}`,
    maxOutput: 1_200,
    prompt: (input, options) => {
      const tone = options.tone ?? 'neutral'
      const shape = options.shape === 'bullets' ? 'as short bullet points' : 'as flowing paragraphs'
      return `Write the following, in a ${tone} tone, ${shape}.\n\nBrief:\n${input}`
    },
  },
  {
    id: 'grammar',
    toolId: 'ai-grammar-helper',
    label: 'Proofread',
    inputLabel: 'The text to proofread',
    placeholder: 'Paste the text you want checked.',
    resultLabel: 'Corrected text',
    maxInput: 12_000,
    needsQuestion: false,
    options: [
      {
        key: 'strictness',
        label: 'Strictness',
        fallback: 'standard',
        choices: [
          { value: 'minimal', label: 'Only clear errors' },
          { value: 'standard', label: 'Errors and awkward phrasing' },
          { value: 'thorough', label: 'Also tighten the style' },
        ],
      },
    ],
    system: `You are a proofreader. You fix spelling, grammar and punctuation without changing the author's meaning or voice. You never invent new sentences to replace whole paragraphs. ${COMMON_RULES}`,
    maxOutput: 2_000,
    prompt: (input, options) => {
      const level = options.strictness ?? 'standard'
      const scope =
        level === 'minimal'
          ? 'Fix only definite errors. Leave phrasing that is merely a matter of taste.'
          : level === 'thorough'
            ? 'Fix errors, and also tighten wordy phrasing while keeping the meaning and the voice.'
            : 'Fix errors, and rephrase anything that reads awkwardly.'
      return `${scope}

Reply with the corrected text, then a line containing exactly "CHANGES:", then a short list of what you changed and why. If nothing needed changing, still write "CHANGES:" and then "No changes needed."

Text to proofread:
---
${input}
---`
    },
  },
  {
    id: 'email',
    toolId: 'ai-email-drafting',
    label: 'Draft an email',
    inputLabel: 'What the email needs to say',
    placeholder: 'e.g. Tell the landlord the boiler is broken and ask when someone can come.',
    resultLabel: 'Email draft',
    maxInput: 4_000,
    needsQuestion: false,
    options: [
      {
        key: 'tone',
        label: 'Tone',
        fallback: 'professional',
        choices: [
          { value: 'professional', label: 'Professional' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'firm', label: 'Firm' },
          { value: 'apologetic', label: 'Apologetic' },
        ],
      },
      {
        key: 'length',
        label: 'Length',
        fallback: 'short',
        choices: [
          { value: 'short', label: 'Short — a few lines' },
          { value: 'standard', label: 'Standard — three short paragraphs' },
        ],
      },
    ],
    system: `You draft emails. You write a subject line and a body. You never invent facts such as dates, prices or names that the brief does not contain, and you leave a clear placeholder in square brackets when something is genuinely needed. ${COMMON_RULES}`,
    maxOutput: 900,
    prompt: (input, options) => {
      const tone = options.tone ?? 'professional'
      const length = options.length === 'standard' ? 'three short paragraphs' : 'a few lines'
      return `Draft an email in a ${tone} tone, ${length}. Start with "Subject:" on its own line.

What the email needs to say:
${input}`
    },
  },
  {
    id: 'document-qa',
    toolId: 'ai-document-assistant',
    label: 'Answer from a document',
    inputLabel: 'The document',
    placeholder: 'Paste the document you want to ask about.',
    resultLabel: 'Answer',
    maxInput: HARD_INPUT_LIMIT,
    needsQuestion: true,
    options: [],
    system: `You answer questions using only the document provided. If the document does not contain the answer, you say "The document does not say" and stop. You never fill the gap with outside knowledge, and you never guess. Quote the sentence you relied on when it is short enough to quote.`,
    maxOutput: 1_000,
    prompt: (input, _options, question) => `Document:
---
${input}
---

Question: ${question}

Answer using only the document. If the answer is not in it, say so plainly.`,
  },
  {
    id: 'translate',
    toolId: 'ai-translation',
    label: 'Translate',
    inputLabel: 'The text to translate',
    placeholder: 'Paste the text you want translated.',
    resultLabel: 'Translation',
    maxInput: 12_000,
    needsQuestion: false,
    options: [
      {
        key: 'target',
        label: 'Into',
        fallback: 'Spanish',
        choices: [
          { value: 'Spanish', label: 'Spanish' },
          { value: 'French', label: 'French' },
          { value: 'German', label: 'German' },
          { value: 'Portuguese', label: 'Portuguese' },
          { value: 'Hindi', label: 'Hindi' },
          { value: 'Gujarati', label: 'Gujarati' },
          { value: 'Arabic', label: 'Arabic' },
          { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
          { value: 'Japanese', label: 'Japanese' },
          { value: 'Russian', label: 'Russian' },
        ],
      },
    ],
    system: `You translate. You keep the meaning, tone and formatting of the original, including paragraph breaks and lists. You do not add explanation, notes or alternatives. If a term has no good equivalent, you keep the original term in brackets. ${COMMON_RULES}`,
    maxOutput: 2_500,
    prompt: (input, options) => {
      const target = options.target ?? 'Spanish'
      return `Translate the following into ${target}. Keep the paragraph breaks exactly as they are.

---
${input}
---`
    },
  },
  {
    id: 'rewrite',
    toolId: 'ai-text-rewriter',
    label: 'Rewrite',
    inputLabel: 'The text to rewrite',
    placeholder: 'Paste the text you want rewritten.',
    resultLabel: 'Rewritten text',
    maxInput: 12_000,
    needsQuestion: false,
    options: [
      {
        key: 'style',
        label: 'Style',
        fallback: 'simpler',
        choices: [
          { value: 'simpler', label: 'Simpler' },
          { value: 'concise', label: 'Shorter' },
          { value: 'formal', label: 'More formal' },
          { value: 'engaging', label: 'More engaging' },
        ],
      },
    ],
    system: `You rewrite text. You preserve the meaning and every fact. You do not add new claims, and you do not drop detail that changes the meaning. ${COMMON_RULES}`,
    maxOutput: 2_500,
    prompt: (input, options) => {
      const style = options.style ?? 'simpler'
      const instruction =
        style === 'concise'
          ? 'Rewrite it more concisely, cutting anything that does not carry meaning.'
          : style === 'formal'
            ? 'Rewrite it in a more formal register, without becoming stiff.'
            : style === 'engaging'
              ? 'Rewrite it so it holds a reader’s attention, without hype or exclamation marks.'
              : 'Rewrite it in simpler language that a general reader can follow.'
      return `${instruction}

---
${input}
---`
    },
  },
]

/** Look a task up by id, returning undefined for anything not on the list. */
export function taskById(id: string): AiTask | undefined {
  return TASKS.find((task) => task.id === id)
}

/** Look a task up by the tool that exposes it. */
export function taskForTool(toolId: string): AiTask | undefined {
  return TASKS.find((task) => task.toolId === toolId)
}

/**
 * Resolve the options for a task, discarding anything not offered.
 *
 * A client can send any string it likes. Only values that appear in the task's
 * own choice lists survive, so an option can never carry an instruction into
 * the prompt.
 */
export function resolveOptions(task: AiTask, supplied: Record<string, unknown>): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const option of task.options) {
    const value = supplied[option.key]
    const allowed = option.choices.some((choice) => choice.value === value)
    resolved[option.key] = allowed ? String(value) : option.fallback
  }
  return resolved
}

/** Why a request cannot be run, or null when it can. */
export function requestError(task: AiTask, input: string, question: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return 'There is nothing to send. Add the text first.'
  if (input.length > task.maxInput) {
    return `That is ${(input.length - task.maxInput).toLocaleString()} characters over the ${task.maxInput.toLocaleString()} limit for this tool. Shorten it and try again.`
  }
  if (task.needsQuestion && question.trim() === '') {
    return 'Add the question you want answered from the document.'
  }
  if (task.needsQuestion && question.length > 500) {
    return 'Keep the question under 500 characters.'
  }
  return null
}

/**
 * Split the proofreader's reply into the corrected text and its notes.
 *
 * The model is asked to put a `CHANGES:` line between the two halves. If it
 * forgets, the whole reply is treated as corrected text and no notes are
 * shown — better than guessing where the boundary was.
 */
export function splitProofread(reply: string): { corrected: string; notes: string[] } {
  const marker = reply.indexOf('CHANGES:')
  if (marker === -1) return { corrected: reply.trim(), notes: [] }

  const corrected = reply.slice(0, marker).trim()
  const notes = reply
    .slice(marker + 'CHANGES:'.length)
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line !== '')

  return { corrected, notes }
}

/** A one-line description of what will be sent, for the confirmation step. */
export function sendSummary(task: AiTask, input: string): string {
  if (input.trim() === '') {
    return `When you press ${task.label}, your text will be sent to TOOLZEN's server, then on to the AI provider.`
  }
  const characters = input.length === 1 ? '1 character' : `${input.length.toLocaleString()} characters`
  return `${characters} will be sent to TOOLZEN's server for ${task.label.toLowerCase()}, then on to the AI provider.`
}
