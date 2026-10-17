/**
 * Hashing helpers for the Hash Generator tool.
 *
 * The digest implementations live in `@/lib/hash` and are shared with the
 * file-integrity tools, so there is one tested implementation of each
 * algorithm rather than several.
 */
import { DIGEST_ALGORITHMS, digestFile, digestText, type DigestId } from '@/lib/hash'

export { DIGEST_ALGORITHMS, digestFile, digestText }
export type { DigestId }

export interface HashRow {
  id: DigestId
  label: string
  value: string
}

/** Whether an algorithm is available in this browser context. */
export function isAvailable(id: DigestId): boolean {
  // MD5 is implemented locally, so it always works.
  if (id === 'md5') return true
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/** Compute every requested digest for a string, in the given order. */
export async function hashAllText(
  text: string,
  ids: DigestId[] = DIGEST_ALGORITHMS.map((algorithm) => algorithm.id),
): Promise<HashRow[]> {
  const rows: HashRow[] = []
  for (const id of ids) {
    const label = DIGEST_ALGORITHMS.find((algorithm) => algorithm.id === id)?.label ?? id
    rows.push({ id, label, value: await digestText(id, text) })
  }
  return rows
}

/** Compute every requested digest for a file. */
export async function hashAllFile(
  file: File,
  ids: DigestId[] = DIGEST_ALGORITHMS.map((algorithm) => algorithm.id),
  onProgress?: (fraction: number) => void,
): Promise<HashRow[]> {
  const rows: HashRow[] = []
  const total = ids.length
  for (let index = 0; index < total; index += 1) {
    const id = ids[index]
    const label = DIGEST_ALGORITHMS.find((algorithm) => algorithm.id === id)?.label ?? id
    const value = await digestFile(id, file, (fraction) => {
      onProgress?.((index + fraction) / total)
    })
    rows.push({ id, label, value })
  }
  onProgress?.(1)
  return rows
}

/**
 * Normalise a checksum for comparison: lower-case, and strip the separators
 * people paste in (spaces, colons, dashes and a leading `0x`).
 */
export function normalizeChecksum(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^0x/, '')
    .replace(/[\s:_-]/g, '')
}

export interface ChecksumComparison {
  match: boolean
  normalizedExpected: string
  normalizedActual: string
  /** True when the two values are the same length, so a match is meaningful. */
  comparable: boolean
}

/**
 * Compare a pasted checksum against a computed one.
 * Returns `null` when the expected value is empty.
 */
export function compareChecksums(
  expected: string,
  actual: string,
): ChecksumComparison | null {
  const normalizedExpected = normalizeChecksum(expected)
  if (normalizedExpected === '') return null
  const normalizedActual = normalizeChecksum(actual)
  return {
    match: normalizedExpected === normalizedActual,
    normalizedExpected,
    normalizedActual,
    comparable: normalizedExpected.length === normalizedActual.length,
  }
}

/** Which digest an expected checksum most likely corresponds to, by length. */
export function guessAlgorithm(expected: string): string | null {
  const length = normalizeChecksum(expected).length
  const byLength: Record<number, string> = {
    32: 'MD5',
    40: 'SHA-1',
    64: 'SHA-256',
    96: 'SHA-384',
    128: 'SHA-512',
  }
  return byLength[length] ?? null
}
