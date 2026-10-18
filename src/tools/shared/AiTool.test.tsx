import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiTool } from './AiTool'

/** Stub the two endpoints the component talks to. */
function stubFetch(handlers: { probe?: unknown; run?: unknown }) {
  const mock = vi.fn(async (_url: string, init?: { method?: string }) => {
    if (init?.method === 'GET' || init === undefined) {
      return handlers.probe
    }
    return handlers.run
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AiTool when the backend is not configured', () => {
  it('says so plainly instead of offering a button that does nothing', async () => {
    stubFetch({ probe: { ok: true, json: async () => ({ configured: false, model: null }) } })
    render(<AiTool taskId="summarise" filename="summary.txt" />)

    await waitFor(() => expect(screen.getByText(/not switched on yet/i)).toBeInTheDocument())
    expect(screen.getByText(/AI_PROVIDER_API_KEY/)).toBeInTheDocument()
    // No submit control exists at all in this state.
    expect(screen.queryByRole('button', { name: /^Summarise$/i })).not.toBeInTheDocument()
  })

  it('treats a network failure as not configured rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<AiTool taskId="translate" filename="translation.txt" />)

    await waitFor(() => expect(screen.getByText(/not switched on yet/i)).toBeInTheDocument())
  })
})

describe('AiTool when the backend is ready', () => {
  const readyProbe = { ok: true, json: async () => ({ configured: true, model: 'test-model' }) }

  it('shows the form and states where the text goes', async () => {
    stubFetch({ probe: readyProbe })
    render(<AiTool taskId="summarise" filename="summary.txt" />)

    await waitFor(() => expect(screen.getByRole('button', { name: /^Summarise$/i })).toBeInTheDocument())
    expect(screen.getByText(/sent to TOOLZEN's server|sent to TOOLZEN’s server/i)).toBeInTheDocument()
    expect(screen.getByText(/test-model/)).toBeInTheDocument()
  })

  it('disables the button until there is input', async () => {
    stubFetch({ probe: readyProbe })
    render(<AiTool taskId="summarise" filename="summary.txt" />)

    const button = await screen.findByRole('button', { name: /^Summarise$/i })
    expect(button).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), 'Some text')
    expect(button).toBeEnabled()
  })

  it('shows the returned text', async () => {
    stubFetch({
      probe: readyProbe,
      run: { ok: true, json: async () => ({ text: 'A tidy summary.' }) },
    })
    render(<AiTool taskId="summarise" filename="summary.txt" />)

    const button = await screen.findByRole('button', { name: /^Summarise$/i })
    await userEvent.type(screen.getByRole('textbox'), 'Some text')
    await userEvent.click(button)

    await waitFor(() => expect(screen.getByDisplayValue('A tidy summary.')).toBeInTheDocument())
  })

  it('shows the server’s message when the request fails, never a fake result', async () => {
    stubFetch({
      probe: readyProbe,
      run: {
        ok: false,
        json: async () => ({ error: 'rate_limited', message: 'That is a lot of requests in a short time.' }),
      },
    })
    render(<AiTool taskId="summarise" filename="summary.txt" />)

    const button = await screen.findByRole('button', { name: /^Summarise$/i })
    await userEvent.type(screen.getByRole('textbox'), 'Some text')
    await userEvent.click(button)

    await waitFor(() =>
      expect(screen.getByText(/a lot of requests in a short time/i)).toBeInTheDocument(),
    )
    expect(screen.queryByText(/summary of your text/i)).not.toBeInTheDocument()
  })

  it('splits a proofread result into the corrected text and its notes', async () => {
    stubFetch({
      probe: readyProbe,
      run: {
        ok: true,
        json: async () => ({ text: 'The cat sat.\n\nCHANGES:\n- Fixed "satt".' }),
      },
    })
    render(<AiTool taskId="grammar" filename="corrected.txt" />)

    const button = await screen.findByRole('button', { name: /^Proofread$/i })
    await userEvent.type(screen.getByRole('textbox'), 'The cat satt.')
    await userEvent.click(button)

    await waitFor(() => expect(screen.getByText(/What changed/i)).toBeInTheDocument())
    expect(screen.getByText('Fixed "satt".')).toBeInTheDocument()
  })

  it('asks for a question on the document tool', async () => {
    stubFetch({ probe: readyProbe })
    render(<AiTool taskId="document-qa" filename="answer.txt" />)

    await screen.findByRole('button', { name: /Answer from a document/i })
    expect(screen.getByLabelText(/What do you want to know about it/i)).toBeInTheDocument()
  })
})
