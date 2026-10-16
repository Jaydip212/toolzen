import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { WordCounterTool } from './index'

function renderTool() {
  return render(
    <ToastProvider>
      <WordCounterTool />
    </ToastProvider>,
  )
}

describe('WordCounterTool', () => {
  it('shows an empty state before any text is entered', () => {
    renderTool()
    expect(screen.getByText('No text yet')).toBeInTheDocument()
  })

  it('counts words live as the user types', async () => {
    renderTool()

    await userEvent.type(screen.getByLabelText('Your text'), 'one two three')

    const wordsTile = screen.getByText('Words').closest('div')
    expect(wordsTile).toHaveTextContent('3')
  })

  it('clears the input and returns to the empty state', async () => {
    renderTool()

    await userEvent.type(screen.getByLabelText('Your text'), 'some text')
    expect(screen.getByText('Words')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /clear/i }))

    expect(screen.getByText('No text yet')).toBeInTheDocument()
  })

  it('loads the sample text when asked', async () => {
    renderTool()

    await userEvent.click(screen.getByRole('button', { name: /load sample/i }))

    expect((screen.getByLabelText('Your text') as HTMLTextAreaElement).value.length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText('No text yet')).not.toBeInTheDocument()
  })
})
