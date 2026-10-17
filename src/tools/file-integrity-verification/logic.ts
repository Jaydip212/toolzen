/**
 * Verify that a downloaded file is exactly the file its publisher says it is.
 *
 * The user drops in the file and pastes the published checksum — either a bare
 * hash or a whole `sha256sum`-style checksum file. The matching digest is
 * recomputed locally and compared. Nothing is uploaded, and the comparison is
 * a plain string match, so it cannot be fooled by a formatting difference.
 */

import {
  digestFile,
  guessDigestAlgorithm,
  normalizeDigest,
  type DigestId,
} from '@/lib/hash'

export type { DigestId }

export interface ExpectedChecksum {
  /** The line exactly as it was pasted. */
  raw: string
  /** Lowercase hex, with separators removed. */
  hash: string
  /** The file name on the line, if the input used `hash  filename` format. */
  name: string | null
  algorithm: DigestId | null
  algorithmLabel: string | null
}

/** A `hash  filename` line, as written by `sha256sum`, `shasum` and friends. */
const CHECKSUM_LINE = /^([0-9a-fA-F]{16,128})\s+\*?(.+)$/
const HEX_ONLY = /^[0-9a-fA-F]+$/

/**
 * Pull the hash and any file name out of a single line, or `null`.
 *
 * Two shapes are accepted: `hash  filename`, and a bare hash that may be split
 * into space-separated groups (`BA7816BF 8F01CFEA …`) — a common way to print a
 * digest for a human to read.
 */
function readLine(line: string): { hash: string; name: string | null } | null {
  const withName = CHECKSUM_LINE.exec(line)
  if (withName) {
    return { hash: withName[1], name: withName[2].trim().replace(/^\*/, '') || null }
  }

  const compact = line.replace(/[\s:]/g, '').replace(/^0x/i, '')
  if (HEX_ONLY.test(compact) && compact.length >= 16 && compact.length <= 128) {
    return { hash: compact, name: null }
  }

  return null
}

/**
 * Read every usable checksum out of pasted text.
 *
 * Accepts the output of `sha256sum`, `shasum`, `certutil` and most download
 * pages: a bare hash, a space-grouped hash, or `hash  filename`, one per line.
 * Blank lines and comments (`#`) are ignored.
 */
export function parseChecksumLines(text: string): ExpectedChecksum[] {
  const results: ExpectedChecksum[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue

    const parsed = readLine(line)
    if (!parsed) continue

    const guess = guessDigestAlgorithm(parsed.hash)

    results.push({
      raw: line,
      hash: normalizeDigest(parsed.hash),
      name: parsed.name,
      algorithm: guess?.id ?? null,
      algorithmLabel: guess?.label ?? null,
    })
  }

  return results
}

/**
 * Choose the checksum to check against.
 *
 * A line whose file name matches the chosen file wins; otherwise the first
 * line whose algorithm could be identified is used.
 */
export function pickChecksum(
  entries: ExpectedChecksum[],
  fileName: string,
): ExpectedChecksum | null {
  if (entries.length === 0) return null

  const target = fileName.trim().toLowerCase()
  const byName = entries.find(
    (entry) => entry.name !== null && entry.name.toLowerCase() === target,
  )
  if (byName) return byName

  return entries.find((entry) => entry.algorithm !== null) ?? entries[0]
}

export type Verdict = 'match' | 'mismatch' | 'no-checksum' | 'unknown-algorithm'

export interface VerificationResult {
  verdict: Verdict
  expected: ExpectedChecksum | null
  /** The digest computed from the file, when one could be computed. */
  actual: string | null
  algorithm: DigestId | null
  algorithmLabel: string | null
  /** A plain-English sentence describing the outcome. */
  detail: string
}

const VERDICT_DETAIL: Record<Verdict, string> = {
  match:
    'The file matches the checksum exactly. It is byte-for-byte the file the publisher described.',
  mismatch:
    'The file does not match the checksum. Do not use it — it may be corrupted, incomplete, or tampered with.',
  'no-checksum': 'Paste the checksum you were given, then verify again.',
  'unknown-algorithm':
    'The checksum does not match the length of MD5, SHA-1, SHA-256, SHA-384 or SHA-512, so it cannot be checked here.',
}

/** Compare a file against pasted checksum text. */
export async function verifyFile(
  file: File,
  expectedText: string,
  onProgress?: (fraction: number) => void,
): Promise<VerificationResult> {
  const entries = parseChecksumLines(expectedText)
  const picked = pickChecksum(entries, file.name)

  if (!picked) {
    return {
      verdict: 'no-checksum',
      expected: null,
      actual: null,
      algorithm: null,
      algorithmLabel: null,
      detail: VERDICT_DETAIL['no-checksum'],
    }
  }

  if (!picked.algorithm) {
    return {
      verdict: 'unknown-algorithm',
      expected: picked,
      actual: null,
      algorithm: null,
      algorithmLabel: null,
      detail: VERDICT_DETAIL['unknown-algorithm'],
    }
  }

  const actual = await digestFile(picked.algorithm, file, onProgress)
  const match = normalizeDigest(actual) === picked.hash

  return {
    verdict: match ? 'match' : 'mismatch',
    expected: picked,
    actual,
    algorithm: picked.algorithm,
    algorithmLabel: picked.algorithmLabel,
    detail: VERDICT_DETAIL[match ? 'match' : 'mismatch'],
  }
}
