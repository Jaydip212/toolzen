import { describe, expect, it } from 'vitest'

import {
  FONT_SIZE,
  MARGIN,
  PAGE_SIZES,
  charactersPerLine,
  encodingError,
  isEncodable,
  layoutError,
  layoutFor,
  layoutSummary,
  linesPerPage,
  paginate,
  unsupportedCharacters,
  wrapText,
} from './logic'

describe('charactersPerLine', () => {
  it('fits A4 to a sensible line for an 11-point face', () => {
    // 595.28 - 112 = 483.28 usable, divided by 5.5 points per character.
    expect(charactersPerLine(595.28)).toBe(87)
  })

  it('never claims a line narrower than ten characters', () => {
    expect(charactersPerLine(50)).toBe(10)
  })
})

describe('linesPerPage', () => {
  it('fits an A4 page at the standard spacing', () => {
    // (841.89 - 112) / (11 * 1.35) = 49.17 -> 49 lines.
    expect(linesPerPage(841.89)).toBe(49)
  })

  it('always leaves room for at least one line', () => {
    expect(linesPerPage(20)).toBe(1)
  })
})

describe('wrapText', () => {
  it('keeps a short paragraph on one line', () => {
    expect(wrapText('hello world', 20)).toEqual(['hello world'])
  })

  it('wraps at a word boundary rather than mid-word', () => {
    expect(wrapText('the quick brown fox', 10)).toEqual(['the quick', 'brown fox'])
  })

  it('breaks a word longer than the line, rather than dropping it', () => {
    expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij'])
  })

  it('keeps blank lines, so paragraphs survive', () => {
    expect(wrapText('one\n\ntwo', 20)).toEqual(['one', '', 'two'])
  })

  it('collapses runs of spaces, which a text box often accumulates', () => {
    expect(wrapText('a    b', 20)).toEqual(['a b'])
  })
})

describe('paginate', () => {
  it('splits lines into full pages and a remainder', () => {
    expect(paginate(['a', 'b', 'c', 'd', 'e'], 2).pages).toEqual([['a', 'b'], ['c', 'd'], ['e']])
  })

  it('always returns at least one page, so an empty document is still a document', () => {
    expect(paginate([], 10).pages).toEqual([[]])
  })

  it('reports the line count it was given', () => {
    expect(paginate(['a', 'b'], 10).lineCount).toBe(2)
  })
})

describe('layoutFor', () => {
  it('lays a short text onto one A4 page', () => {
    const layout = layoutFor('A short note.', 'a4')
    expect(layout.pages).toHaveLength(1)
    expect(layout.perLine).toBe(charactersPerLine(595.28))
    expect(layout.perPage).toBe(49)
  })

  it('spreads a long text across pages', () => {
    const long = Array.from({ length: 120 }, (_, index) => `line ${index}`).join('\n')
    const layout = layoutFor(long, 'a4')
    expect(layout.pages.length).toBeGreaterThan(1)
  })

  it('fits Letter more characters per line but fewer lines, being wider and shorter', () => {
    const letter = layoutFor('x', 'letter')
    const a4 = layoutFor('x', 'a4')
    expect(letter.perLine).toBeGreaterThan(a4.perLine)
    expect(letter.perPage).toBeLessThan(a4.perPage)
  })
})

describe('layoutSummary', () => {
  it('counts words and pages', () => {
    expect(layoutSummary('one two three', { pages: [['one two three']], lineCount: 1 })).toBe('3 words on 1 page.')
  })

  it('gets the singular right', () => {
    expect(layoutSummary('alone', { pages: [['alone']], lineCount: 1 })).toBe('1 word on 1 page.')
  })

  it('says nothing rather than zero for empty text', () => {
    expect(layoutSummary('   ', { pages: [[]], lineCount: 0 })).toBe('0 words on 1 page.')
  })
})

describe('layoutError', () => {
  it('asks for text before building a document', () => {
    expect(layoutError('')).toContain('Enter the text')
    expect(layoutError('  \n ')).toContain('Enter the text')
  })

  it('allows real text through', () => {
    expect(layoutError('A note.')).toBeNull()
  })
})

describe('isEncodable', () => {
  it('accepts Latin-1 and the Windows-1252 extras, curly quotes included', () => {
    expect(isEncodable(0x65)).toBe(true) // e
    expect(isEncodable(0xe9)).toBe(true) // é
    expect(isEncodable(0xa0)).toBe(true) // non-breaking space
    expect(isEncodable(0x20ac)).toBe(true) // €
    expect(isEncodable(0x2019)).toBe(true) // ’ right single quote
    expect(isEncodable(0x201c)).toBe(true) // “ left double quote
    expect(isEncodable(0x2014)).toBe(true) // — em dash
    expect(isEncodable(0x2122)).toBe(true) // ™
    expect(isEncodable(0x0178)).toBe(true) // Ÿ
  })

  it('rejects the line breaks only because they are drawn as paragraphs', () => {
    expect(isEncodable(0x0a)).toBe(true)
    expect(isEncodable(0x0d)).toBe(true)
  })

  it('rejects every control character, the tab included', () => {
    expect(isEncodable(0x09)).toBe(false)
    expect(isEncodable(0x07)).toBe(false)
    expect(isEncodable(0x7f)).toBe(false)
  })

  it('rejects the scripts the standard fonts have no glyphs for', () => {
    expect(isEncodable(0x041f)).toBe(false) // П
    expect(isEncodable(0x4e16)).toBe(false) // 世
    expect(isEncodable(0x1f600)).toBe(false) // emoji
    expect(isEncodable(0x2028)).toBe(false) // line separator
  })
})

describe('unsupportedCharacters', () => {
  it('names each bad character once, in the order it was met', () => {
    expect(unsupportedCharacters('ok П ok 世 ok П')).toEqual(['П', '世'])
  })

  it('returns nothing when the text is fully drawable', () => {
    expect(unsupportedCharacters('Plain ASCII and é and €')).toEqual([])
  })
})

describe('encodingError', () => {
  it('says nothing for ordinary text', () => {
    expect(encodingError('A perfectly ordinary note.')).toBeNull()
  })

  it('names the offending characters with their code points', () => {
    const error = encodingError('Hello 世界')
    expect(error).toContain('“世” (U+4E16)')
    expect(error).toContain('cannot draw')
  })

  it('caps the list and counts the rest, in the right number', () => {
    // Eleven distinct undrawable characters: eight are named, three are counted.
    const distinct = ['世', '界', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'].join('')
    expect(encodingError(distinct)).toContain('and 3 more characters')
  })

  it('says "1 more character" for a single one over the limit', () => {
    const distinct = ['世', '界', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'ζ'].join('')
    expect(encodingError(distinct)).toContain('and 1 more character')
  })

  it('points at the tab, which surprises people most', () => {
    expect(encodingError('a\tb')).toContain('U+0009')
  })
})

describe('wrapText with tabs', () => {
  it('turns a tab into a space, so the line can still be drawn', () => {
    expect(wrapText('a\tb', 40)).toEqual(['a b'])
  })
})

describe('PAGE_SIZES', () => {
  it('offers A4 and Letter, A4 being the taller of the two', () => {
    const sizes = Object.fromEntries(PAGE_SIZES.map((entry) => [entry.value, entry]))
    expect(sizes.a4.height).toBeGreaterThan(sizes.letter.height)
    expect(sizes.letter.width).toBeGreaterThan(sizes.a4.width)
  })
})

describe('constants', () => {
  it('keeps the margin a sane share of a page', () => {
    expect(MARGIN).toBeGreaterThan(0)
    expect(MARGIN / 595.28).toBeLessThan(0.15)
  })

  it('uses a body size a printer accepts', () => {
    expect(FONT_SIZE).toBeGreaterThanOrEqual(10)
  })
})
