import io

p = r'F:\Toolzen platform jayvik labs\README.md'
s = io.open(p, encoding='utf-8').read()

anchor = '## Monetization and analytics (Phase 4)'
addition = '''## Advanced utilities (Phase 7)

Fifteen new tools were added with no new dependencies: time-zone conversion
(Intl, DST-aware), Roman numerals, number to words, UTF-8 binary text, CSS
unit conversion, crypto-random number and token generation, list shuffling,
meta tag / robots.txt / sitemap.xml generators, file signature inspection,
canvas image effects (grayscale, invert, brightness, contrast) and exact-cents
tip and split-bill calculators. The Unit Converter gained area, volume and
speed families. All of them are client-side; the shared pure logic lives in
`src/lib/phase7/` and is unit-tested in Node.

Deliberately excluded, with reasons rather than placeholders:
- **DOCX / XLSX / PPTX / RTF reading and writing** — these are ZIP-based
  Office Open XML formats that need a large document library (and some
  conversions, notably PPTX to PDF, genuinely require server-side rendering).
  Shipping a partial parser that mangles files would be worse than not
  shipping one. Clearly identified as needing a future server component.
- **Language minifiers, HTML/CSS validators and YAML converters** — correct
  implementations require real parsers, not regex, and adding those libraries
  would grow every bundle. Nothing here fakes a minify or a validation.
- **Timers, calendars and the remaining money calculators** — not built this
  phase; the existing percentage, EMI, GST, compound-interest, date and time
  calculators continue to work.
- **Tool comparison/education** — handled by the Phase 6 guides library
  rather than duplicated as thin pages.

Every published tool has registry metadata, instructions, three FAQs, a
privacy note and a real implementation; the registry integrity test enforces
that standard.

'''

assert anchor in s, 'README anchor missing'
s = s.replace(anchor, addition + anchor, 1)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('README updated')
