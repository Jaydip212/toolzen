import { describe, expect, it } from 'vitest'
import { digestText, hashText, md5, toHex, toHexUpper } from './hash'

/**
 * MD5 vectors from RFC 1321 appendix A.5, plus widely published SHA vectors
 * from NIST. If these pass, the hand-written MD5 is correct.
 */
describe('md5', () => {
  it('matches RFC 1321 test vectors', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e')
    expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661')
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(md5('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0')
    expect(md5('abcdefghijklmnopqrstuvwxyz')).toBe('c3fcd3d76192e4007dfb496cca67e13b')
    expect(md5('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe(
      '57edf4a22be3c955ac49da2e2107b67a',
    )
  })

  it('handles the padding boundary at 55/56/64 bytes', () => {
    // 55 bytes fits in one block, 56 forces a second block.
    expect(md5('a'.repeat(55))).toHaveLength(32)
    expect(md5('a'.repeat(56))).toHaveLength(32)
    expect(md5('a'.repeat(64))).toHaveLength(32)
    expect(md5('a'.repeat(55))).not.toBe(md5('a'.repeat(56)))
  })

  it('hashes the quick brown fox', () => {
    expect(md5('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    )
  })

  it('hashes multi-byte characters as UTF-8', () => {
    // "é" is two bytes in UTF-8; the digest must match the UTF-8 byte sequence.
    expect(md5('é')).toBe(md5(new TextEncoder().encode('é')))
  })

  it('accepts a byte array directly', () => {
    expect(md5(new Uint8Array([97, 98, 99]))).toBe('900150983cd24fb0d6963f7d28e17f72')
  })
})

describe('toHex', () => {
  it('formats bytes as lowercase hex', () => {
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe('000fff')
  })

  it('formats uppercase hex', () => {
    expect(toHexUpper(new Uint8Array([0, 15, 255]))).toBe('000FFF')
  })
})

describe('Web Crypto digests', () => {
  it('computes SHA-256 for "abc"', async () => {
    expect(await hashText('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('computes SHA-1 for "abc"', async () => {
    expect(await hashText('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  it('computes SHA-512 for "abc"', async () => {
    expect(await hashText('SHA-512', 'abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })
})

describe('digestText', () => {
  it('routes md5 without touching Web Crypto', async () => {
    expect(await digestText('md5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('routes SHA-256 to Web Crypto', async () => {
    expect(await digestText('SHA-256', 'abc')).toHaveLength(64)
  })
})
