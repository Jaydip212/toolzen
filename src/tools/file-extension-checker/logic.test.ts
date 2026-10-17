import { describe, expect, it } from 'vitest'

import {
  CATEGORIES,
  EXTENSION_MAP,
  baseName,
  describeExtension,
  extensionsInCategory,
  extractExtension,
  isRiskyExtension,
  searchExtensions,
} from './logic'

describe('extractExtension', () => {
  it('reads an extension from a filename', () => {
    expect(extractExtension('photo.png')).toBe('png')
  })

  it('lowercases it', () => {
    expect(extractExtension('PHOTO.PNG')).toBe('png')
  })

  it('takes the last dot', () => {
    expect(extractExtension('archive.tar.gz')).toBe('gz')
  })

  it('ignores a path', () => {
    expect(extractExtension('/home/user/report.pdf')).toBe('pdf')
    expect(extractExtension('C:\\Users\\me\\report.pdf')).toBe('pdf')
  })

  it('accepts a bare extension with a dot', () => {
    expect(extractExtension('.png')).toBe('png')
  })

  it('accepts a bare extension without a dot', () => {
    expect(extractExtension('png')).toBe('png')
  })

  it('ignores a query string', () => {
    expect(extractExtension('image.png?x=1')).toBe('png')
  })

  it('returns an empty string when there is no extension', () => {
    expect(extractExtension('README')).toBe('')
  })

  it('handles empty input', () => {
    expect(extractExtension('')).toBe('')
  })

  it('treats a dotfile as a name with no extension', () => {
    expect(extractExtension('.gitignore')).toBe('')
  })
})

describe('baseName', () => {
  it('drops the extension', () => {
    expect(baseName('photo.png')).toBe('photo')
  })

  it('keeps a dotfile name', () => {
    expect(baseName('.gitignore')).toBe('.gitignore')
  })

  it('handles a name with no extension', () => {
    expect(baseName('README')).toBe('README')
  })
})

describe('describeExtension', () => {
  it('reports a known extension', () => {
    const report = describeExtension('photo.png')
    expect(report.extension).toBe('png')
    expect(report.mime).toBe('image/png')
    expect(report.category).toBe('image')
    expect(report.known).toBe(true)
  })

  it('reports an unknown extension honestly', () => {
    const report = describeExtension('file.zzz')
    expect(report.known).toBe(false)
    expect(report.mime).toBeNull()
    expect(report.category).toBe('other')
    expect(report.description).toContain('not in this table')
  })

  it('explains when no extension was found', () => {
    expect(describeExtension('README').description).toContain('No extension')
  })

  it('reads a full path', () => {
    expect(describeExtension('/tmp/report.pdf').mime).toBe('application/pdf')
  })

  it('is case-insensitive', () => {
    expect(describeExtension('PHOTO.PNG').mime).toBe('image/png')
  })
})

describe('EXTENSION_MAP integrity', () => {
  it('uses a lowercase extension as every key', () => {
    for (const key of Object.keys(EXTENSION_MAP)) expect(key).toBe(key.toLowerCase())
  })

  it('gives every entry a MIME type with a slash', () => {
    for (const [key, info] of Object.entries(EXTENSION_MAP)) {
      expect(info.mime, key).toContain('/')
    }
  })

  it('gives every entry a description', () => {
    for (const [key, info] of Object.entries(EXTENSION_MAP)) {
      expect(info.description.length, key).toBeGreaterThan(5)
    }
  })

  it('uses only known categories', () => {
    const known = new Set(CATEGORIES.map((category) => category.id))
    for (const [key, info] of Object.entries(EXTENSION_MAP)) expect(known.has(info.category), key).toBe(true)
  })

  it('covers at least fifty extensions', () => {
    expect(Object.keys(EXTENSION_MAP).length).toBeGreaterThanOrEqual(50)
  })

  it('has at least one entry in every category except other', () => {
    for (const category of CATEGORIES.filter((entry) => entry.id !== 'other')) {
      expect(extensionsInCategory(category.id).length, category.id).toBeGreaterThan(0)
    }
  })
})

describe('extensionsInCategory', () => {
  it('returns sorted extensions', () => {
    const images = extensionsInCategory('image')
    expect(images).toContain('png')
    expect([...images].sort()).toEqual(images)
  })

  it('returns nothing for "other"', () => {
    expect(extensionsInCategory('other')).toEqual([])
  })
})

describe('searchExtensions', () => {
  it('returns everything for a blank query, sorted', () => {
    const all = searchExtensions('')
    expect(all).toHaveLength(Object.keys(EXTENSION_MAP).length)
    expect(all[0].extension < all[1].extension).toBe(true)
  })

  it('matches an extension', () => {
    expect(searchExtensions('png').some((entry) => entry.extension === 'png')).toBe(true)
  })

  it('matches a description', () => {
    expect(searchExtensions('lossless').length).toBeGreaterThan(0)
  })

  it('matches a MIME type', () => {
    expect(searchExtensions('image/').length).toBeGreaterThan(0)
  })

  it('matches a category', () => {
    expect(searchExtensions('archive').length).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    expect(searchExtensions('PNG').length).toBe(searchExtensions('png').length)
  })

  it('returns nothing for a nonsense query', () => {
    expect(searchExtensions('zzzzzz')).toEqual([])
  })
})

describe('isRiskyExtension', () => {
  it('flags executables and scripts', () => {
    expect(isRiskyExtension('exe')).toBe(true)
    expect(isRiskyExtension('bat')).toBe(true)
    expect(isRiskyExtension('ps1')).toBe(true)
    expect(isRiskyExtension('apk')).toBe(true)
  })

  it('does not flag ordinary documents', () => {
    expect(isRiskyExtension('pdf')).toBe(false)
    expect(isRiskyExtension('png')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isRiskyExtension('EXE')).toBe(true)
  })
})
