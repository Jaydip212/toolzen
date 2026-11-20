import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_MAX_FILE_BYTES, FileDrop, fileMatchesAccept } from './FileDrop'

function fileWithSize(name: string, bytes: number): File {
  // jsdom lets us set size directly through the constructor options.
  return new File(['x'.repeat(Math.min(bytes, 8))], name, { type: 'text/plain' })
}

function assignSize(file: File, bytes: number): File {
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

describe('fileMatchesAccept', () => {
  it('accepts everything when no accept rule is set', () => {
    expect(fileMatchesAccept(new File(['x'], 'anything.xyz'))).toBe(true)
    expect(fileMatchesAccept(new File(['x'], 'anything.xyz'), '')).toBe(true)
  })

  it('matches extensions, independent of the reported MIME type', () => {
    const file = new File(['x'], 'report.pdf', { type: '' })
    expect(fileMatchesAccept(file, 'application/pdf,.pdf')).toBe(true)
    expect(fileMatchesAccept(new File(['x'], 'photo.png'), '.pdf')).toBe(false)
  })

  it('matches exact MIME types and wildcards', () => {
    expect(fileMatchesAccept(new File(['x'], 'a.png', { type: 'image/png' }), 'image/*')).toBe(true)
    expect(fileMatchesAccept(new File(['x'], 'a.txt', { type: 'text/plain' }), 'image/*')).toBe(false)
    expect(
      fileMatchesAccept(new File(['x'], 'a.bin', { type: 'application/pdf' }), 'application/pdf'),
    ).toBe(true)
  })

  it('rejects a wrong-type file dropped onto the zone and loads nothing', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} accept="application/pdf,.pdf" />)
    // A drop bypasses the picker's accept attribute, so this is the path that
    // needs its own validation.
    fireEvent.drop(screen.getByRole('button', { name: 'Choose a file' }), {
      dataTransfer: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
    })
    expect(onFiles).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('not an accepted file type')
    expect(screen.getByRole('alert')).toHaveTextContent('notes.txt')
  })

  it('loads only the accepted files from a mixed dropped batch', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} multiple accept=".pdf" />)
    fireEvent.drop(screen.getByRole('button', { name: 'Choose a file' }), {
      dataTransfer: {
        files: [
          new File(['x'], 'good.pdf', { type: 'application/pdf' }),
          new File(['x'], 'bad.txt', { type: 'text/plain' }),
        ],
      },
    })
    expect(onFiles).toHaveBeenCalledTimes(1)
    const loaded = onFiles.mock.calls[0]![0] as File[]
    expect(loaded.map((file) => file.name)).toEqual(['good.pdf'])
    expect(screen.getByRole('alert')).toHaveTextContent('bad.txt')
  })
})

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
