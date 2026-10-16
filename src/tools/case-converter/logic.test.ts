import { describe, expect, it } from 'vitest'
import { convertCase, splitWords } from './logic'

describe('splitWords', () => {
  it('splits on spaces and punctuation', () => {
    expect(splitWords('hello, world!')).toEqual(['hello', 'world'])
  })

  it('splits camelCase boundaries', () => {
    expect(splitWords('helloWorld')).toEqual(['hello', 'World'])
  })

  it('splits acronym boundaries', () => {
    expect(splitWords('myHTTPServer')).toEqual(['my', 'HTTP', 'Server'])
  })

  it('splits snake and kebab case', () => {
    expect(splitWords('hello_world-example')).toEqual(['hello', 'world', 'example'])
  })

  it('returns an empty array for empty input', () => {
    expect(splitWords('')).toEqual([])
  })
})

describe('convertCase', () => {
  it('converts to upper and lower case', () => {
    expect(convertCase('Hello World', 'upper')).toBe('HELLO WORLD')
    expect(convertCase('Hello World', 'lower')).toBe('hello world')
  })

  it('converts to title case', () => {
    expect(convertCase('hello world', 'title')).toBe('Hello World')
    expect(convertCase('HELLO WORLD', 'title')).toBe('Hello World')
  })

  it('converts to sentence case', () => {
    expect(convertCase('hello world. how are you?', 'sentence')).toBe('Hello world. How are you?')
  })

  it('converts to camelCase', () => {
    expect(convertCase('hello world example', 'camel')).toBe('helloWorldExample')
  })

  it('converts to PascalCase', () => {
    expect(convertCase('hello world', 'pascal')).toBe('HelloWorld')
  })

  it('converts to snake_case', () => {
    expect(convertCase('Hello World Example', 'snake')).toBe('hello_world_example')
  })

  it('converts to kebab-case', () => {
    expect(convertCase('Hello World', 'kebab')).toBe('hello-world')
  })

  it('converts to CONSTANT_CASE', () => {
    expect(convertCase('hello world', 'constant')).toBe('HELLO_WORLD')
  })

  it('converts to alternating case', () => {
    expect(convertCase('abcd', 'alternating')).toBe('aBcD')
  })

  it('preserves non-letter characters while alternating letters', () => {
    // "a" is the first letter (lower), "b" the second (upper); "-" is untouched.
    expect(convertCase('a-b', 'alternating')).toBe('a-B')
  })

  it('handles empty input for every style', () => {
    for (const style of ['upper', 'lower', 'title', 'sentence', 'camel', 'snake'] as const) {
      expect(convertCase('', style)).toBe('')
    }
  })
})
