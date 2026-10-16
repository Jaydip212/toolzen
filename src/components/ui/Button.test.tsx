import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label and calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('defaults to type="button" so it never submits a form accidentally', () => {
    render(<Button>Safe</Button>)
    expect(screen.getByRole('button', { name: 'Safe' })).toHaveAttribute('type', 'button')
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Nope' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
