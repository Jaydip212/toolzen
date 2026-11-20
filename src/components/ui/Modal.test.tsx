import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { Modal } from './Modal'

describe('Modal accessibility', () => {
  it('renders a labelled dialog with its description wired up', () => {
    render(<Modal open onClose={vi.fn()} title="Delete file" description="This cannot be undone." />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Delete file')
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Dialog" />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the dialog and restores it on close', () => {
    const onClose = vi.fn()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()

    const { rerender } = render(<Modal open onClose={onClose} title="Dialog" />)
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)

    rerender(<Modal open={false} onClose={onClose} title="Dialog" />)
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('locks body scroll while open and restores it on close', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Modal open onClose={onClose} title="Dialog" />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Modal open={false} onClose={onClose} title="Dialog" />)
    expect(document.body.style.overflow).toBe('')
  })
})
