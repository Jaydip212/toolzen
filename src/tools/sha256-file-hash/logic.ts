/**
 * File hashing.
 *
 * Every digest is computed from the bytes of the file, read locally. SHA-1,
 * SHA-256, SHA-384 and SHA-512 use the browser's Web Crypto API; MD5 is a
 * local RFC 1321 implementation, offered only so legacy checksums can be
 * compared.
 */

import {
  DIGEST_ALGORITHMS,
  digestFile,
  guessDigestAlgorithm,
  normalizeDigest,
  type DigestId,
} from '@/lib/hash'

export type { DigestId }

/** Normalise a pasted checksum so it can be compared. */
export const normalizeHash = normalizeDigest

/** Guess which algorithm produced a pasted checksum, from its length. */
export const guessAlgorithm = guessDigestAlgorithm

/** Every algorithm this tool can compute, in display order. */
export const FILE_ALGORITHMS = DIGEST_ALGORITHMS

/** Algorithms selected by default — the one people actually need. */
export const DEFAULT_ALGORITHMS: DigestId[] = ['SHA-256']

/** Above this size the tool warns before reading, so nobody freezes a tab by accident. */
export const LARGE_FILE_BYTES = 200 * 1024 * 1024

export interface HashRow {
  id: DigestId
  label: string
  value: string
  /** Lowercase hex length, useful for a quick sanity check. */
  hexLength: number
}

/** Whether the browser can compute this algorithm at all. */
export function isAvailable(id: DigestId): boolean {
  if (id === 'md5') return true
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/** Compute the selected digests for a file, reporting progress from 0 to 1. */
export async function computeFileHashes(
  file: File,
  ids: DigestId[],
  onProgress?: (fraction: number) => void,
): Promise<HashRow[]> {
  const usable = ids.filter(isAvailable)
  const rows: HashRow[] = []

  for (let index = 0; index < usable.length; index += 1) {
    const id = usable[index]
    const label = FILE_ALGORITHMS.find((algorithm) => algorithm.id === id)?.label ?? id
    const value = await digestFile(id, file, (fraction) => {
      onProgress?.((index + fraction) / usable.length)
    })
    rows.push({ id, label, value, hexLength: value.length })
  }

  onProgress?.(1)
  return rows
}

/** Whether two checksums refer to the same digest. */
export function hashesMatch(expected: string, actual: string): boolean {
  const a = normalizeHash(expected)
  const b = normalizeHash(actual)
  return a !== '' && a === b
}

/**
 * Build a checksum file in the format produced by `sha256sum` and friends:
 * `<hash>  <filename>` — two spaces, so the output can be fed straight into
 * `sha256sum -c`.
 */
export function buildChecksumFile(fileName: string, rows: HashRow[]): string {
  const safeName = fileName === '' ? 'file' : fileName
  return rows.map((row) => `${row.value}  ${safeName}`).join('\n')
}

/** A suggested download name, e.g. `report.pdf.sha256.txt`. */
export function checksumFileName(fileName: string, ids: DigestId[]): string {
  const extension = ids.length === 1 ? ids[0].toLowerCase().replace('-', '') : 'checksums'
  return `${fileName === '' ? 'file' : fileName}.${extension}.txt`
}

/** Group a hex digest into blocks to make long values easier to scan. */
export function groupHash(value: string, size = 8): string {
  const chunks: string[] = []
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size))
  }
  return chunks.join(' ')
}

/** Human-readable warning for a very large file, or `null` when it is fine. */
export function largeFileWarning(bytes: number): string | null {
  if (bytes < LARGE_FILE_BYTES) return null
  return 'This file is large. Hashing reads the whole file into memory, which can take a while and use a lot of RAM.'
}
