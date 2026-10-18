import { describe, expect, it } from 'vitest'
import { applyTransforms, IDENTITY, outputSizeFor } from '@/tools/image-rotator/logic'
import { OPERATIONS, operationById, type OperationId } from './logic'

describe('OPERATIONS', () => {
  it('exposes exactly the four operations the UI renders', () => {
    expect(OPERATIONS.map((operation) => operation.id)).toEqual([
      'rotate-left',
      'rotate-right',
      'flip-horizontal',
      'flip-vertical',
    ])
  })

  it('gives every operation a non-empty label and a transform', () => {
    for (const operation of OPERATIONS) {
      expect(operation.label.length).toBeGreaterThan(0)
      expect(typeof operation.transform.rotation).toBe('number')
    }
  })

  it('uses the same rotation convention as the rotator: quarter turns', () => {
    for (const operation of OPERATIONS) {
      expect(operation.transform.rotation % 90).toBe(0)
    }
  })
})

describe('operationById', () => {
  it('resolves each id to its operation', () => {
    expect(operationById('rotate-left')).toBe(OPERATIONS[0])
    expect(operationById('flip-vertical')).toBe(OPERATIONS[3])
  })

  it('returns null for an unknown id instead of guessing', () => {
    expect(operationById('sideways')).toBeNull()
  })

  it('resolves every declared id', () => {
    for (const operation of OPERATIONS) {
      expect(operationById(operation.id as OperationId)).toBe(operation)
    }
  })
})

describe('operation transforms agree with the rotator engine', () => {
  it('flipping leaves the output dimensions unchanged', () => {
    const flip = operationById('flip-horizontal')!
    const merged = applyTransforms(IDENTITY, flip.transform)
    expect(outputSizeFor({ width: 100, height: 60 }, merged)).toEqual({ width: 100, height: 60 })
  })

  it('rotating right on a portrait image swaps the output dimensions', () => {
    const right = applyTransforms(IDENTITY, operationById('rotate-right')!.transform)
    expect(outputSizeFor({ width: 100, height: 60 }, right)).toEqual({ width: 60, height: 100 })
  })

  it('rotating left on a portrait image also swaps the output dimensions', () => {
    const left = applyTransforms(IDENTITY, operationById('rotate-left')!.transform)
    expect(outputSizeFor({ width: 100, height: 60 }, left)).toEqual({ width: 60, height: 100 })
  })

  it('left and right rotations are distinct quarter turns, not both 180°', () => {
    const left = applyTransforms(IDENTITY, operationById('rotate-left')!.transform)
    const right = applyTransforms(IDENTITY, operationById('rotate-right')!.transform)
    expect(left.rotation).not.toBe(right.rotation)
    expect([left.rotation, right.rotation].sort((a, b) => a - b)).toEqual([90, 270])
  })
})
