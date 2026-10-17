import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Base64ToImage from './index'

/** A few bytes starting with the PNG signature — enough for the sniffer. */
const PNG_BYTES = '\x89PNG\r\n\x1a\n\x00\x00\x00\x00'
const JPEG_BYTES = '\xff\xd8\xff\xe0\x00\x00\x00\x00'

function renderTool() {
  return render(<Base64ToImage />)
}

describe('Base64ToImage', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()
  })

  it('names a raw Base64 PNG from its bytes', async () => {
    renderTool()

    await userEvent.type(screen.getByLabelText(/Base64 text/), btoa(PNG_BYTES))
    await userEvent.click(screen.getByRole('button', { name: 'Decode' }))

    expect(screen.getByText('decoded-image.png')).toBeInTheDocument()
    // A raw paste has no MIME claim to report.
    expect(screen.queryByText(/data URL said/)).not.toBeInTheDocument()
  })

  it('trusts the bytes over a data URL that claims the wrong type', async () => {
    renderTool()

    const lyingUrl = `data:image/png;base64,${btoa(JPEG_BYTES)}`
    await userEvent.type(screen.getByLabelText(/Base64 text/), lyingUrl)
    await userEvent.click(screen.getByRole('button', { name: 'Decode' }))

    // Named from the JPEG signature, not from the PNG claim.
    expect(screen.getByText('decoded-image.jpg')).toBeInTheDocument()
    expect(screen.getByText(/The data URL said image\/png/)).toBeInTheDocument()
    expect(screen.getByText(/The bytes say otherwise/)).toBeInTheDocument()
  })

  it('agrees with a data URL whose claim matches its bytes', async () => {
    renderTool()

    await userEvent.type(screen.getByLabelText(/Base64 text/), `data:image/png;base64,${btoa(PNG_BYTES)}`)
    await userEvent.click(screen.getByRole('button', { name: 'Decode' }))

    expect(screen.getByText('decoded-image.png')).toBeInTheDocument()
    expect(screen.getByText(/The bytes agree/)).toBeInTheDocument()
  })

  it('keeps the button disabled until something is pasted', () => {
    renderTool()
    expect(screen.getByRole('button', { name: 'Decode' })).toBeDisabled()
  })
})
