import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_MAX_FILE_BYTES, FileDrop } from './FileDrop'

function fileWithSize(name: string, bytes: number): File {
  // jsdom lets us set size directly through the constructor options.
  return new File(['x'.repeat(Math.min(bytes, 8))], name, { type: 'text/plain' })
}

function assignSize(file: File, bytes: number): File {
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

describe('FileDrop size guard', () => {
  it('has a generous default ceiling of 100 MB', () => {
    expect(DEFAULT_MAX_FILE_BYTES).toBe(100 * 1024 * 1024)
  })

  it('rejects an oversized file with a clear message and loads nothing', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} maxFileSizeBytes={50 * 1024 * 1024} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const big = assignSize(fileWithSize('huge.pdf', 8), 120 * 1024 * 1024)
    await userEvent.upload(input, big)
    expect(onFiles).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('over the 50 MB limit')
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing was loaded')
  })

  it('accepts a file within the limit', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} maxFileSizeBytes={50 * 1024 * 1024} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, assignSize(fileWithSize('ok.pdf', 8), 1024))
    expect(onFiles).toHaveBeenCalledWith([expect.objectContaining({ name: 'ok.pdf' })])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('loads only the acceptable files from a mixed batch', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} multiple maxFileSizeBytes={10 * 1024 * 1024} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const small = assignSize(fileWithSize('small.txt', 8), 1024)
    const big = assignSize(fileWithSize('big.txt', 8), 90 * 1024 * 1024)
    await userEvent.upload(input, [small, big])
    expect(onFiles).toHaveBeenCalledTimes(1)
    const loaded = onFiles.mock.calls[0]![0] as File[]
    expect(loaded.map((file) => file.name)).toEqual(['small.txt'])
    expect(screen.getByRole('alert')).toHaveTextContent('big.txt')
  })
})
