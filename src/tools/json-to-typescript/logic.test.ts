import { describe, expect, it } from 'vitest'
import { generateFromJson, generateTypes, interfaceName, propertyName } from './logic'

describe('propertyName', () => {
  it('keeps identifiers as-is', () => {
    expect(propertyName('name')).toBe('name')
    expect(propertyName('_private')).toBe('_private')
    expect(propertyName('$ref')).toBe('$ref')
  })

  it('quotes keys that are not identifiers or are reserved', () => {
    expect(propertyName('order-id')).toBe("'order-id'")
    expect(propertyName('class')).toBe("'class'")
  })
})

describe('interfaceName', () => {
  it('pascal-cases kebab and snake keys', () => {
    expect(interfaceName('order-item')).toBe('OrderItem')
    expect(interfaceName('user_address')).toBe('UserAddress')
  })

  it('prefixes names that would start with a digit', () => {
    expect(interfaceName('2026-plan')).toBe('Item2026Plan')
  })

  it('falls back to Item for a key with no usable characters', () => {
    expect(interfaceName('---')).toBe('Item')
  })
})

describe('generateTypes', () => {
  it('emits one interface per nested object', () => {
    const result = generateTypes({ user: { name: 'Ada', age: 36 } })
    expect(result.interfaces).toEqual(['Root', 'User'])
    expect(result.code).toContain('interface Root {')
    expect(result.code).toContain('interface User {')
    expect(result.code).toContain('  name: string')
    expect(result.code).toContain('  age: number')
    expect(result.code).toContain('  user: User')
  })

  it('names the root interface after the root, not User', () => {
    const result = generateTypes({ user: { name: 'Ada' } }, 'Order')
    expect(result.interfaces).toEqual(['Order', 'User'])
    expect(result.code).toContain('export interface'.replace('export ', ''))
    expect(result.code).toContain('interface Order {')
    expect(result.code).not.toContain('export type Order')
  })

  it('types arrays of objects as a single item interface', () => {
    const result = generateTypes({ items: [{ id: 1 }, { id: 2 }] })
    expect(result.code).toContain('items: Item[]')
    expect(result.code).toContain('interface Item {')
  })

  it('unions mixed array element types', () => {
    const result = generateTypes({ values: ['a', 1] })
    expect(result.code).toContain('values: (string | number)[]')
  })

  it('emits null as an explicit union member', () => {
    const result = generateTypes({ nickname: null })
    expect(result.code).toContain('nickname: null')
  })

  it('produces a type alias for a primitive root', () => {
    const result = generateTypes('hello')
    expect(result.interfaces).toEqual(['type:Root'])
    expect(result.code).toBe('export type Root = string\n')
  })

  it('uses unknown[] for an empty array', () => {
    const result = generateTypes({ empty: [] })
    expect(result.code).toContain('empty: unknown[]')
  })

  it('quotes keys that are not identifiers', () => {
    const result = generateTypes({ 'order-id': 7 })
    expect(result.code).toContain("'order-id': number")
  })

  it('shares one interface between identical nested shapes', () => {
    const result = generateTypes({ node: { a: 1 }, 'node ': { a: 2 } })
    expect(result.interfaces).toEqual(['Root', 'Node'])
  })

  it('numbers distinct shapes that would collide', () => {
    const result = generateTypes({ node: { a: 1 }, 'node ': { b: 2 } })
    expect(new Set(result.interfaces).size).toBe(result.interfaces.length)
    expect(result.interfaces).toEqual(['Root', 'Node', 'Node2'])
  })
})

describe('generateFromJson', () => {
  it('round-trips a realistic payload', () => {
    const json = JSON.stringify({ orderId: 'A-1', lines: [{ sku: 'X', qty: 2 }], paid: true })
    const result = generateFromJson(json, 'Order')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.code).toContain('interface Order {')
    expect(result.result.code).toContain('lines: Line[]')
    expect(result.result.code).toContain('sku: string')
    expect(result.result.code).toContain('paid: boolean')
    expect(result.result.interfaces).toEqual(['Order', 'Line'])
  })

  it('rejects invalid JSON with the parser’s message', () => {
    const result = generateFromJson('{nope}')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('not valid JSON')
  })

  it('rejects empty input politely', () => {
    const result = generateFromJson('   ')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Paste some JSON')
  })
})
