/**
 * Rotate and flip planning for the flipper tool.
 *
 * A separate id from the rotator because the registry treats them as two
 * pages, but the maths is shared logic in one place.
 */

export { applyTransforms, cssFor, describeTransform, fromExifOrientation, losslessRotatePossible, outputSizeFor, IDENTITY } from '@/tools/image-rotator/logic'
export type { Transform } from '@/tools/image-rotator/logic'

/** The four operations the flipper exposes as buttons. */
export const OPERATIONS = [
  { id: 'rotate-left', label: 'Rotate left', transform: { rotation: 270, flipX: false, flipY: false } },
  { id: 'rotate-right', label: 'Rotate right', transform: { rotation: 90, flipX: false, flipY: false } },
  { id: 'flip-horizontal', label: 'Flip horizontally', transform: { rotation: 0, flipX: true, flipY: false } },
  { id: 'flip-vertical', label: 'Flip vertically', transform: { rotation: 0, flipX: false, flipY: true } },
] as const

export type OperationId = (typeof OPERATIONS)[number]['id']

export function operationById(id: string) {
  return OPERATIONS.find((operation) => operation.id === id) ?? null
}
