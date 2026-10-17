import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TextFormatterTool } from './index'

function renderTool() {
  return render(<TextFormatterTool />)
}

/** Read the formatted output textarea. */
function outputValue(): string {
  return (screen.getByLabelText('Formatted text') as HTMLTextAreaElement).value
}

describe('TextFormatterTool', () => {
  it('shows an empty state before any text is entered', () => {
    renderTool()
    expect(screen.getByText('Nothing to format yet')).toBeInTheDocument()
  })

  it('applies the default rules to pasted text', () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Your text'), {
      target: { value: '  hello  \n\n\n\n  world  ' },
    })
    // Defaults: trim each line, collapse blank lines, trim the document.
    expect(outputValue()).toBe('hello\n\nworld')
  })

  it('removes blank lines when that rule is switched on', async () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Your text'), { target: { value: 'a\n\nb' } })
    expect(outputValue()).toBe('a\n\nb')

    await userEvent.click(screen.getByLabelText(/remove blank lines/i))

    expect(outputValue()).toBe('a\nb')
  })

  it('collapses repeated spaces when that rule is switched on', async () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Your text'), { target: { value: 'a    b' } })
    await userEvent.click(screen.getByLabelText(/collapse repeated spaces/i))
    expect(outputValue()).toBe('a b')
  })

  it('clears the input and returns to the empty state', async () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Your text'), { target: { value: 'hello' } })
    expect(screen.queryByText('Nothing to format yet')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^clear$/i }))

    expect(screen.getByText('Nothing to format yet')).toBeInTheDocument()
  })

  it('loads the sample text when asked', async () => {
    renderTool()
    // Two buttons offer the sample: the toolbar one and the empty-state one.
    await userEvent.click(screen.getAllByRole('button', { name: /load sample/i })[0])

    expect((screen.getByLabelText('Your text') as HTMLTextAreaElement).value.length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText('Nothing to format yet')).not.toBeInTheDocument()
  })

  it('copies the result back into the input on request', async () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Your text'), { target: { value: '  hello  ' } })
    expect(outputValue()).toBe('hello')

    await userEvent.click(screen.getByRole('button', { name: /replace input with result/i }))

    expect((screen.getByLabelText('Your text') as HTMLTextAreaElement).value).toBe('hello')
  })
})
