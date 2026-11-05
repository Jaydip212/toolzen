/**
 * The TOOLZEN guides library.
 *
 * Content rules this file enforces:
 *  - Every guide describes what the linked tools actually do. No step may
 *    reference a feature the tool does not have, and no claim is made about
 *    results the tool cannot guarantee (compression gains, for example, vary
 *    by file and the guides say so).
 *  - Tool links are ids resolved through the registry at render time, so a
 *    renamed or unshipped tool drops out instead of producing a dead link.
 *  - Comparisons are factual descriptions of trade-offs, not verdicts on
 *    behalf of the reader.
 */

export interface GuideStep {
  title: string
  body: string
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface GuideSection {
  title: string
  body: string
}

export interface Guide {
  slug: string
  title: string
  /** Meta description for the page. */
  description: string
  intro: string
  /** Grouping used on the guides index. */
  group: 'PDF' | 'Images' | 'Data' | 'Calculators' | 'Security'
  steps: GuideStep[]
  /** Registry ids of the tools this guide is about. */
  toolIds: string[]
  faqs: GuideFaq[]
  /** Optional factual comparison sections, e.g. Merge vs Split. */
  sections?: GuideSection[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'merge-pdf-files',
    title: 'How to merge PDF files',
    description:
      'Combine several PDFs into one document, in order, entirely in your browser. Step-by-step instructions for the TOOLZEN Merge PDF tool.',
    intro:
      'Merging combines two or more PDFs into a single document, keeping every page in the order you choose. The TOOLZEN Merge PDF tool does this in your browser — the files are never uploaded.',
    group: 'PDF',
    steps: [
      {
        title: 'Open the Merge PDF tool',
        body: 'Go to Merge PDF in the PDF Tools category. The tool runs entirely in your browser tab.',
      },
      {
        title: 'Add your files',
        body: 'Drag and drop your PDFs onto the drop zone, or use the file picker. You can add up to ten files, 50 MB each.',
      },
      {
        title: 'Arrange the order',
        body: 'The files merge top to bottom. Use the arrows beside each entry to move a file up or down until the order is right.',
      },
      {
        title: 'Merge and download',
        body: 'Press Merge. The combined document is produced locally — check the result size shown, then download it.',
      },
    ],
    toolIds: ['merge-pdf', 'split-pdf', 'organize-pdf'],
    faqs: [
      {
        question: 'Is there a page limit for the merged document?',
        answer:
          'No hard page limit exists, but everything is processed in your browser tab, so available memory is the practical ceiling. Files up to 50 MB each are accepted.',
      },
      {
        question: 'Do bookmarks and form fields survive a merge?',
        answer:
          'Page content, text and images are preserved. Document-level extras such as bookmarks are not guaranteed to survive, because pages are being re-assembled into a new document.',
      },
      {
        question: 'Are my files uploaded anywhere?',
        answer:
          'No. The merge happens inside your browser using JavaScript, and the files never leave your device.',
      },
    ],
    sections: [
      {
        title: 'Merge PDF vs Split PDF',
        body: 'They are opposite operations. Merging takes several documents and produces one; splitting takes one document and produces several. If your problem is "I have too many files", merge. If it is "this file is too big and I only need part of it", split — or use Extract PDF Pages when you need a specific page range rather than fixed chunks.',
      },
      {
        title: 'Merge vs Organize Pages',
        body: 'Organize Pages works inside a single document: reorder, rotate or delete its pages. Merging always produces a new document from several inputs. If you are dragging pages between files, that is a merge followed by an organize.',
      },
    ],
  },
  {
    slug: 'compress-pdf-files',
    title: 'How to compress a PDF',
    description:
      'Reduce a PDF file size in your browser, with honest expectations about how much smaller it can get. Step-by-step instructions and what affects the result.',
    intro:
      'Compressing a PDF reduces its file size by rebuilding the document without redundant objects and recompressing what can be recompressed. How much smaller a file gets depends almost entirely on what is inside it — the guide below explains why.',
    group: 'PDF',
    steps: [
      {
        title: 'Open the Compress PDF tool',
        body: 'Go to Compress PDF in the PDF Tools category. The file is processed locally and never uploaded.',
      },
      {
        title: 'Drop in your PDF',
        body: 'Add the file you want to shrink. The original stays untouched on your disk — the tool writes a new file.',
      },
      {
        title: 'Compress and compare',
        body: 'Press Compress. The tool shows the original and resulting sizes so you can judge the outcome yourself before downloading.',
      },
      {
        title: 'Keep the better one',
        body: 'If the result is not meaningfully smaller, the original was already efficient — keep it. A compress operation that saves nothing should not be shipped.',
      },
    ],
    toolIds: ['compress-pdf', 'pdf-size-analyzer'],
    faqs: [
      {
        question: 'Why did my PDF barely shrink?',
        answer:
          'Scanned pages and photographs are stored as images, and if they are already efficiently encoded there is little to remove. The PDF Size Analyzer can show you where the bytes in a document actually go.',
      },
      {
        question: 'Will compression reduce image quality?',
        answer:
          'The TOOLZEN compressor rebuilds the document structure rather than re-encoding photographs, so image fidelity is preserved. Tools that re-encode images can shrink further but trade quality for size.',
      },
      {
        question: 'Is the result always smaller?',
        answer:
          'No, and the tool says so: it compares both sizes and lets you decide. Files that are already lean can end up the same size or marginally larger.',
      },
    ],
  },
  {
    slug: 'jpg-vs-png-vs-webp',
    title: 'JPG vs PNG vs WebP: which format to use',
    description:
      'A plain-language comparison of JPG, PNG and WebP: how each compresses, when transparency matters, and which TOOLZEN converter to use.',
    intro:
      'Image formats are trade-offs between size, quality and features. There is no universally best one — the right choice depends on what the image contains and where it will be used.',
    group: 'Images',
    steps: [
      {
        title: 'Start from what the image contains',
        body: 'Photographs compress well with lossy formats. Screenshots, logos and drawings with flat colours and sharp edges compress better losslessly.',
      },
      {
        title: 'Ask whether you need transparency',
        body: 'Only PNG and WebP support an alpha channel. A logo that must sit on an arbitrary background cannot be a JPG.',
      },
      {
        title: 'Match the format to the destination',
        body: 'JPG is universally supported and fine for photos. PNG is the safe choice for graphics that must stay pixel-sharp. WebP is usually smaller than both and is supported by every modern browser, but some older software still cannot read it.',
      },
      {
        title: 'Convert with the Image Format Converter',
        body: 'The TOOLZEN Image Format Converter re-encodes images between JPG, PNG and WebP in your browser, with a quality control for lossy formats. There are also dedicated JPG to PNG, PNG to JPG and WebP Converter pages.',
      },
    ],
    toolIds: ['image-format-converter', 'jpg-to-png', 'png-to-jpg', 'webp-converter'],
    faqs: [
      {
        question: 'Can converting a JPG to PNG make it look better?',
        answer:
          'No. Lossy compression has already discarded information; PNG will store the degraded result faithfully but cannot restore what was lost. Converting is about compatibility and features, not quality recovery.',
      },
      {
        question: 'Why is WebP usually smaller?',
        answer:
          'Its compression is simply more modern. A photograph re-encoded as WebP at equivalent visual quality is typically a quarter to a third smaller than the JPG original, though the exact ratio depends on the image.',
      },
      {
        question: 'Does the converter upload my images?',
        answer:
          'No. All TOOLZEN image tools run in your browser; the files never leave your device.',
      },
    ],
    sections: [
      {
        title: 'Image Compressor vs Image Resizer',
        body: 'The compressor keeps the pixel dimensions and reduces the bytes (for lossy formats, by lowering quality). The resizer keeps the visual content and changes the pixel dimensions. Shrinking a photo for a website usually wants both: resize to the display size first, then compress — resizing after compression throws away less information than the other way around.',
      },
      {
        title: 'Resizer vs Cropper',
        body: 'Resizing scales the whole image to new dimensions and preserves the aspect ratio unless you force otherwise. Cropping removes outer areas and changes the composition. They answer different problems: "too many pixels" versus "too much picture".',
      },
    ],
  },
  {
    slug: 'resize-images',
    title: 'How to resize images',
    description:
      'Change image dimensions without distorting them: aspect ratios, output formats and batch resizing, step by step.',
    intro:
      'Resizing changes the pixel dimensions of an image. Done right, it keeps the aspect ratio so nothing stretches, and produces exactly the size the destination needs — no larger.',
    group: 'Images',
    steps: [
      {
        title: 'Open the Image Resizer',
        body: 'Go to Image Resizer in the Image Tools category. Single images use the standard tool; batches use Multiple Image Resizer.',
      },
      {
        title: 'Set the target dimensions',
        body: 'Enter the width or height you need. With the aspect ratio locked, the other side is computed automatically so the image never distorts.',
      },
      {
        title: 'Choose the output format',
        body: 'Keep the original format, or switch — a resized photograph heading for the web is a good moment to pick WebP for the smaller file.',
      },
      {
        title: 'Resize and download',
        body: 'The tool shows the exact output dimensions and file size before you download. For batches, every file gets the same treatment.',
      },
    ],
    toolIds: ['image-resizer', 'multiple-image-resizer', 'image-cropper'],
    faqs: [
      {
        question: 'Does downscaling lose quality?',
        answer:
          'Downscaling discards pixels by definition, but done once it is visually harmless — the detail removed is smaller than the display can show. Repeatedly re-saving and re-scaling the same file compounds the loss, so keep the original.',
      },
      {
        question: 'Should I upscale a small image?',
        answer:
          'Generally no. Enlarging invents pixels that were never captured; the result is soft or blocky no matter which algorithm is used.',
      },
      {
        question: 'What is the largest file it accepts?',
        answer:
          'The drop zone accepts files up to 100 MB. Everything is processed in your browser, so available memory is the practical limit.',
      },
    ],
  },
  {
    slug: 'convert-csv-to-json',
    title: 'How to convert CSV to JSON',
    description:
      'Turn spreadsheet exports into structured JSON correctly: headers, quoted fields, commas inside values, and empty cells.',
    intro:
      'CSV looks simple and breaks easily — commas inside quoted values, embedded quotes, empty cells and encoding all trip up naive converters. TOOLZEN’s converter uses a real CSV parser, so the awkward rows survive.',
    group: 'Data',
    steps: [
      {
        title: 'Export or paste your CSV',
        body: 'Open CSV to JSON and either drop in a .csv file or paste the text. The first row is treated as the header row and becomes the object keys.',
      },
      {
        title: 'Check the parsed preview',
        body: 'The viewer shows how the CSV was interpreted — column names, row count and any cells with unusual content. If a column looks wrong here, the output will be wrong too.',
      },
      {
        title: 'Convert and inspect the JSON',
        body: 'Each row becomes one object whose keys are the header names. Quoted commas stay inside values; doubled quotes are unescaped; empty cells become empty strings.',
      },
      {
        title: 'Download or copy',
        body: 'Copy the JSON to the clipboard or download it as a file. If the JSON must be pretty-printed or minified, the JSON Formatter takes it from there.',
      },
    ],
    toolIds: ['csv-to-json', 'csv-viewer', 'json-formatter'],
    faqs: [
      {
        question: 'What if my CSV uses semicolons instead of commas?',
        answer:
          'Semicolon-separated exports (common from European spreadsheet software) are handled by the parser’s delimiter detection. If the preview splits columns incorrectly, the delimiter setting is the first thing to check.',
      },
      {
        question: 'What happens to duplicate header names?',
        answer:
          'Duplicate keys cannot coexist in a JSON object, so later columns with the same name overwrite earlier ones. Rename the headers in the CSV before converting if you see collisions in the preview.',
      },
      {
        question: 'Why not just split each line on commas?',
        answer:
          'Because quoted fields legitimately contain commas, escaped quotes and newlines. Splitting on commas corrupts exactly the rows that matter most — addresses, descriptions, free-text notes.',
      },
    ],
  },
  {
    slug: 'format-json',
    title: 'How to format and validate JSON',
    description:
      'Turn a minified JSON payload into readable, indented output — or find the exact character that broke it.',
    intro:
      'Most JSON pain is either unreadability (a single 10,000-character line) or a syntax error hiding somewhere in it. The TOOLZEN JSON Formatter does both jobs: it pretty-prints valid JSON and, for invalid input, reports what the parser objected to.',
    group: 'Data',
    steps: [
      {
        title: 'Paste the JSON',
        body: 'Open the JSON Formatter & Validator and paste your payload. Nothing is uploaded — parsing happens in your browser.',
      },
      {
        title: 'Read the verdict',
        body: 'Valid JSON is reformatted with your chosen indentation. Invalid JSON produces the parser’s error message, which names the position it gave up at — usually a missing comma, a trailing comma, or unquoted keys.',
      },
      {
        title: 'Choose the indentation',
        body: 'Two spaces is the common convention; four is easier to read for deeply nested data. Minify removes all whitespace when you need the smallest payload.',
      },
      {
        title: 'Copy or download the result',
        body: 'The formatted output can be copied or saved as a .json file.',
      },
    ],
    toolIds: ['json-formatter', 'json-to-typescript', 'json-to-csv'],
    faqs: [
      {
        question: 'Why is my JSON invalid even though it looks fine?',
        answer:
          'The usual suspects: single quotes instead of double quotes, unquoted or single-quoted keys, a trailing comma after the last item, or actual newlines inside a string instead of \\n escapes.',
      },
      {
        question: 'Does formatting change the data?',
        answer:
          'No. Indentation is whitespace outside the values, so the parsed data is identical. Minifying and pretty-printing are lossless round trips.',
      },
      {
        question: 'Can it handle large files?',
        answer:
          'Comfortably up to a few megabytes in a normal browser. Everything runs locally, so a slow result means your device is working, not a server.',
      },
    ],
  },
  {
    slug: 'verify-file-hashes',
    title: 'How to verify a file hash',
    description:
      'Check that a downloaded file is exactly what its publisher says it is, using SHA-256 checksums — step by step.',
    intro:
      'A hash is a fingerprint of a file’s exact bytes. Publishers publish checksums so you can prove your download arrived intact and unaltered. Verifying takes seconds and catches corrupted or tampered downloads.',
    group: 'Security',
    steps: [
      {
        title: 'Get the published checksum',
        body: 'Find the checksum the publisher published alongside the download — usually a SHA-256 line on the download page or in a .sha256 file. Note which algorithm it uses.',
      },
      {
        title: 'Open the File Hash Calculator',
        body: 'Go to File Hash Calculator in the Cybersecurity category and drop in the downloaded file. It is hashed locally; the file is never uploaded.',
      },
      {
        title: 'Compare the two values',
        body: 'Match the computed hash against the published one, character for character — hashes differ completely if even one byte changed. Case does not matter; spacing does.',
      },
      {
        title: 'A mismatch means stop',
        body: 'If the hashes differ, the file is not the one the checksum describes: re-download first, and if it still mismatches, do not run or open it. Contact the publisher.',
      },
    ],
    toolIds: ['sha256-file-hash', 'hash-generator', 'file-integrity-verification'],
    faqs: [
      {
        question: 'Which algorithm should I use?',
        answer:
          'SHA-256 is the current standard and what most publishers ship. MD5 and SHA-1 still appear in older documentation; they are fine for detecting accidental corruption but are no longer collision-resistant, so prefer SHA-256 when a choice exists.',
      },
      {
        question: 'Can two different files have the same hash?',
        answer:
          'In theory yes — a hash maps infinite inputs to finite outputs. Finding a SHA-256 collision on purpose is beyond practical capability, which is exactly why checksums are trustworthy evidence of integrity.',
      },
      {
        question: 'Does hashing upload my file?',
        answer:
          'No. The TOOLZEN hash tools compute everything in your browser using the Web Crypto API. The file’s bytes never leave your device.',
      },
    ],
  },
]

/** Unique slugs, checked once at module load. */
const slugs = new Set(GUIDES.map((guide) => guide.slug))
if (slugs.size !== GUIDES.length) {
  throw new Error('Duplicate guide slug in src/data/guides.ts')
}

/** Look up a guide by its URL slug. */
export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug)
}
