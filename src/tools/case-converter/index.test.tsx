import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CaseConverterTool } from './index'

describe('CaseConverterTool', () => {
  it('shows an empty state before any text is entered', () => {
    render(<CaseConverterTool />)
    expect(screen.getByText('Nothing to convert yet')).toBeInTheDocument()
  })

  it('applies the default style to typed text', async () => {
    render(<CaseConverterTool />)

    await userEvent.type(screen.getByLabelText('Your text'), 'hello world')

    expect((screen.getByLabelText('Converted text') as HTMLTextAreaElement).value).toBe(
      'HELLO WORLD',
    )
  })

  it('re-converts when a different style is selected', async () => {
    render(<CaseConverterTool />)

    await userEvent.type(screen.getByLabelText('Your text'), 'Hello World')
    await userEvent.click(screen.getByRole('button', { name: /snake_case/ }))

    expect((screen.getByLabelText('Converted text') as HTMLTextAreaElement).value).toBe(
      'hello_world',
    )
  })

  it('marks the selected style as pressed', async () => {
    render(<CaseConverterTool />)

    const snake = screen.getByRole('button', { name: /snake_case/ })
    await userEvent.click(snake)

    expect(snake).toHaveAttribute('aria-pressed', 'true')
  })
})
