import type { Tool } from '@/types/tool'

/**
 * The TOOLZEN tool registry.
 *
 * Honesty rules enforced here:
 *  - `status: 'live'` means the tool is implemented, tested and usable.
 *  - `status: 'planned'` means the tool is on the roadmap. Planned tools are
 *    rendered as clearly-labelled "Coming soon" entries and never as working
 *    controls.
 *  - No usage counts, ratings or popularity numbers are stored, because none
 *    are measured yet.
 *
 * Routes are derived from `id` below so a tool's URL can never drift from its
 * identifier.
 */
type ToolSeed = Omit<Tool, 'route'>

/**
 * Whether the AI backend is provisioned for this build.
 *
 * The seven AI tools are implemented, but they cannot run without a
 * server-side provider key. Shipping them as "live" on a deployment with no
 * key would make the homepage's "available today" count a lie, so their status
 * follows this flag: planned by default, live only when the deployer has set
 * both the key and this flag.
 *
 * `vite.config.ts` also imports this module, in plain Node, where Vite has not
 * populated `import.meta.env`. The optional chain keeps that import from
 * throwing; the config applies its own copy of the flag when it generates the
 * sitemap.
 */
export const AI_TOOL_IDS: ReadonlySet<string> = new Set([
  'ai-text-summarizer',
  'ai-writing-assistant',
  'ai-grammar-helper',
  'ai-email-drafting',
  'ai-document-assistant',
  'ai-translation',
  'ai-text-rewriter',
])

const AI_ENABLED = import.meta.env?.VITE_AI_ENABLED === 'true'

/** Apply the AI flag to a registry, so the config and the app agree. */
export function withAiStatus<T extends ToolSeed>(list: T[], aiEnabled: boolean): T[] {
  return list.map((tool) => (AI_TOOL_IDS.has(tool.id) ? { ...tool, status: aiEnabled ? 'live' : 'planned' } : tool))
}

const seeds: ToolSeed[] = [
  /* ------------------------------------------------------------------ */
  /* TEXT — live                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: 'word-counter',
    name: 'Word Counter',
    description:
      'Count words, characters, sentences and paragraphs as you type, with an estimated reading time.',
    categories: ['text', 'productivity'],
    keywords: ['word count', 'reading time', 'essay', 'writing', 'paragraphs', 'sentences'],
    icon: 'type',
    status: 'live',
    inputFormat: 'Typed or pasted text',
    outputFormat: 'Word, character, sentence and paragraph counts',
    processingMode: 'client',
    addedAt: '2026-10-17',
    featured: true,
    instructions: [
      'Paste or type your text into the editor.',
      'Counts update instantly as you write — there is nothing to submit.',
      'Use Copy summary to take the results with you, or Clear to start again.',
    ],
    faqs: [
      {
        question: 'How does TOOLZEN count words?',
        answer:
          'TOOLZEN counts a word as any run of non-whitespace characters, so hyphenated words such as "well-known" count as one word and numbers count as words too.',
      },
      {
        question: 'Is my text uploaded when I use the Word Counter?',
        answer:
          'No. The Word Counter runs entirely in your browser, so the text you paste never leaves your device and is never sent to a server.',
      },
      {
        question: 'How is reading time calculated?',
        answer:
          'Reading time is estimated at 200 words per minute, and speaking time at 130 words per minute. Both are approximations and are rounded to the nearest second.',
      },
      {
        question: 'Is the Word Counter free?',
        answer:
          'Yes. The Word Counter is completely free, requires no account and has no character or word limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text is never uploaded.',
  },
  {
    id: 'character-counter',
    name: 'Character Counter',
    description:
      'Count characters with and without spaces, plus letters, digits, punctuation and whitespace.',
    categories: ['text'],
    keywords: ['character count', 'letter count', 'sms', 'social post', 'limit', 'length'],
    icon: 'pilcrow',
    status: 'live',
    inputFormat: 'Typed or pasted text',
    outputFormat: 'Character breakdown',
    processingMode: 'client',
    addedAt: '2026-10-17',
    featured: true,
    instructions: [
      'Paste or type your text into the editor.',
      'Set a character limit to see how much room you have left.',
      'Every figure recalculates instantly as you edit.',
    ],
    faqs: [
      {
        question: 'Does the character count include spaces?',
        answer:
          'Both figures are shown: "Characters" includes every character, and "No spaces" excludes all whitespace. Most platforms with a character limit, such as social posts, count spaces.',
      },
      {
        question: 'How do emoji and accented letters count?',
        answer:
          'TOOLZEN counts Unicode code points, so an emoji such as 😀 counts as one character and an accented letter such as é counts as one character.',
      },
      {
        question: 'Can I check text against a character limit?',
        answer:
          'Yes. Enter a limit such as 280 and the tool shows a progress bar plus how many characters you have remaining, or how far over the limit you are.',
      },
      {
        question: 'Is the Character Counter free and private?',
        answer:
          'It is free with no account required, and it runs entirely in your browser so your text is never uploaded.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text is never uploaded.',
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    description:
      'Convert text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case or kebab-case.',
    categories: ['text'],
    keywords: ['uppercase', 'lowercase', 'title case', 'sentence case', 'camelcase', 'snake case', 'kebab case'],
    icon: 'align-left',
    status: 'live',
    inputFormat: 'Text',
    outputFormat: 'Converted text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    featured: true,
    instructions: [
      'Paste or type the text you want to convert.',
      'Choose a case style — the result updates immediately.',
      'Copy the converted text or use it to replace your input.',
    ],
    faqs: [
      {
        question: 'What is Title Case?',
        answer:
          'Title Case capitalises the first letter of every word, for example "the quick brown fox" becomes "The Quick Brown Fox". It is commonly used for headings and titles.',
      },
      {
        question: 'What is the difference between camelCase and PascalCase?',
        answer:
          'camelCase starts with a lowercase letter, such as "helloWorldExample", while PascalCase capitalises every word including the first, such as "HelloWorldExample".',
      },
      {
        question: 'Does the Case Converter handle acronyms correctly?',
        answer:
          'Yes. Word boundaries are detected in camelCase and acronym runs, so "myHTTPServer" is split into "my", "HTTP" and "Server" before conversion.',
      },
      {
        question: 'Is the Case Converter free to use?',
        answer:
          'Yes. It is free, needs no account and runs entirely in your browser, so the text you convert is never uploaded.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text is never uploaded.',
  },

  /* ------------------------------------------------------------------ */
  /* TEXT & DOCUMENT — live                                              */
  /* ------------------------------------------------------------------ */
  {
    id: 'text-formatter',
    name: 'Text Formatter',
    description: 'Tidy up text by normalising spacing, line breaks and repeated whitespace.',
    categories: ['text', 'document'],
    keywords: ['clean text', 'whitespace', 'trim', 'format'],
    icon: 'align-left',
    status: 'live',
    inputFormat: 'Text',
    outputFormat: 'Formatted text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the text you want to tidy into the editor.',
      'Tick the cleanup rules you want — the formatted result updates as you change them.',
      'Copy or download the result, or use “Replace input with result” to keep working on it.',
    ],
    faqs: [
      {
        question: 'What does the Text Formatter actually change?',
        answer:
          'Only the rules you tick: trimming each line, collapsing repeated spaces, converting tabs to spaces, removing or collapsing blank lines, and trimming the whole document. It never rewords, reorders or deletes your content.',
      },
      {
        question: 'In what order are the cleanup rules applied?',
        answer:
          'Line endings are normalised first, then tabs are converted to spaces, then each line is trimmed, then repeated spaces collapse, then blank lines are handled, and finally the whole document is trimmed. The order is fixed so the same input always produces the same output.',
      },
      {
        question: 'Is my text uploaded when I use the Text Formatter?',
        answer:
          'No. The Text Formatter runs entirely in your browser, so the text you paste never leaves your device and is never sent to a server.',
      },
      {
        question: 'Is the Text Formatter free?',
        answer:
          'Yes. It is completely free, needs no account, and has no limit on how much text you can clean up.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text is never uploaded.',
  },
  {
    id: 'text-comparison',
    name: 'Text Comparison',
    description: 'Compare two blocks of text and highlight exactly what changed.',
    categories: ['text', 'document'],
    keywords: ['diff', 'compare', 'changes', 'differences'],
    icon: 'diff',
    status: 'live',
    inputFormat: 'Two blocks of text',
    outputFormat: 'Highlighted differences',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the original text into the left editor.',
      'Paste the changed text into the right editor.',
      'Review the highlighted differences, or switch to Unified view for a copyable diff.',
    ],
    faqs: [
      {
        question: 'How does TOOLZEN compare the two texts?',
        answer:
          'Line by line, using a longest-common-subsequence comparison. That finds the smallest set of added and removed lines between the two versions, so the result is exact rather than an approximation.',
      },
      {
        question: 'What is the difference between side-by-side and unified view?',
        answer:
          'Side by side shows both versions in aligned columns, with removed lines on the left and added lines on the right. Unified shows a single standard diff where “−” marks removed lines and “+” marks added lines — the same format used by git and the diff command.',
      },
      {
        question: 'Can I ignore case or spacing differences?',
        answer:
          'Yes. Turn on “Ignore letter case” or “Ignore whitespace” and those differences are treated as matches. The original text is still displayed exactly as you typed it.',
      },
      {
        question: 'Is there a size limit for the comparison?',
        answer:
          'Each side is limited to 3,000 lines. The comparison is exact rather than heuristic, so the limit keeps it instant inside a browser tab. Split larger documents into parts and compare them one at a time.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Neither text is ever uploaded.',
  },
  {
    id: 'duplicate-line-remover',
    name: 'Duplicate Line Remover',
    description: 'Remove duplicate lines from a list while keeping the first occurrence.',
    categories: ['text', 'document'],
    keywords: ['deduplicate', 'unique lines', 'list cleanup'],
    icon: 'list',
    status: 'live',
    inputFormat: 'Multi-line text',
    outputFormat: 'Deduplicated text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your list into the editor, one item per line.',
      'Choose whether to keep the first or last copy, and how strict the matching should be.',
      'Copy or download the de-duplicated list.',
    ],
    faqs: [
      {
        question: 'How does TOOLZEN decide two lines are duplicates?',
        answer:
          'Each line is reduced to a comparison key and duplicates are found by exact key match. You control whether that key ignores letter case and surrounding spaces, so matching can be as strict or as loose as you need.',
      },
      {
        question: 'What does “keep last” do?',
        answer:
          'It keeps the final occurrence of each duplicated value and removes the earlier copies, leaving the surviving line in its original position in the list.',
      },
      {
        question: 'Are blank lines removed as duplicates?',
        answer:
          'Not by default. “Keep blank lines” is on, so empty lines are preserved and are never counted as duplicates. Turn it off if you want repeated blank lines collapsed to one.',
      },
      {
        question: 'Does the tool change the order of my list?',
        answer:
          'No. The Duplicate Line Remover only deletes lines — it never reorders them. Use the Line Sorter if you also want the list sorted.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your list is never uploaded.',
  },
  {
    id: 'line-sorter',
    name: 'Line Sorter',
    description: 'Sort lines alphabetically, numerically, by length or in reverse order.',
    categories: ['text', 'document'],
    keywords: ['sort lines', 'alphabetical', 'numerical', 'reverse'],
    icon: 'sort',
    status: 'live',
    inputFormat: 'Multi-line text',
    outputFormat: 'Sorted text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your list into the editor, one item per line.',
      'Pick the order — alphabetical, natural, numeric or by line length — and the direction.',
      'Copy or download the sorted list.',
    ],
    faqs: [
      {
        question: 'What is natural sort?',
        answer:
          'Natural sort compares numbers embedded in text by value, so item2 comes before item10. Plain alphabetical sort puts item10 first, because the character “1” sorts before “2”.',
      },
      {
        question: 'What happens to non-numeric lines in numeric mode?',
        answer:
          'They always sink to the bottom of the list in both ascending and descending order, so the numbers stay grouped together instead of being broken up by labels.',
      },
      {
        question: 'Does sorting ignore letter case?',
        answer:
          'Yes by default — “Apple” and “apple” are treated as equal for ordering. Turn on “Case sensitive” to order uppercase letters before lowercase ones.',
      },
      {
        question: 'Can I sort and remove duplicates in one pass?',
        answer:
          'Yes. Tick “Remove duplicates” and “Remove empty lines” to clean the list at the same time. The tool reports exactly how many lines each option removed.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your list is never uploaded.',
  },
  {
    id: 'markdown-previewer',
    name: 'Markdown Previewer',
    description: 'Preview Markdown as formatted output while you write.',
    categories: ['document', 'developer'],
    keywords: ['markdown', 'preview', 'readme'],
    icon: 'book-open',
    status: 'live',
    inputFormat: 'Markdown text',
    outputFormat: 'Rendered preview and HTML',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type or paste Markdown into the editor.',
      'Watch the rendered preview update beside it as you write.',
      'Copy the generated HTML, or download a complete HTML file with styling applied.',
    ],
    faqs: [
      {
        question: 'Is the Markdown preview safe to use?',
        answer:
          'Yes. Markdown can contain raw HTML, so the rendered output is passed through DOMPurify before it is displayed. Scripts, iframes, embedded objects and inline event handlers such as onerror are stripped rather than executed.',
      },
      {
        question: 'Which Markdown features are supported?',
        answer:
          'GitHub Flavored Markdown: tables, task lists, fenced code blocks, autolinks and strikethrough, plus the usual headings, lists, links, images and blockquotes.',
      },
      {
        question: 'Can I export the rendered result?',
        answer:
          'Yes. Copy the generated HTML to paste it anywhere, or download a complete HTML document that already includes basic styling so it looks right when opened in a browser.',
      },
      {
        question: 'Does the previewer upload my Markdown?',
        answer:
          'No. Everything is typed or pasted into the editor and rendered locally in your browser. Nothing is uploaded and no account is required.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your Markdown is never uploaded.',
  },
  {
    id: 'csv-viewer',
    name: 'CSV Viewer',
    description: 'Open a CSV file and inspect it in a readable, scrollable table.',
    categories: ['document'],
    keywords: ['csv', 'spreadsheet', 'table', 'view'],
    icon: 'table',
    status: 'live',
    inputFormat: 'CSV file',
    outputFormat: 'Tabular view',
    processingMode: 'client',
    maxFileSize: '20 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      "Drop a CSV or TSV file, or paste rows into the box.",
      "Pick a delimiter, or leave it on automatic detection.",
      "Turn off \"First row is a header\" if the file has no header.",
      "Click \"Download CSV\" to save a normalised copy with RFC 4180 quoting.",
    ],
    faqs: [
      {
        question: "How many rows can it show?",
        answer:
          "The table shows the first 200 rows so the page stays responsive. The download contains every row that was parsed.",
      },
      {
        question: "Does it handle quoted fields and embedded newlines?",
        answer:
          "Yes. Quoted fields, doubled quotes, embedded newlines, CRLF line endings and a UTF-8 BOM are all handled by the same RFC 4180 parser.",
      },
      {
        question: "Why do my numbers look like text?",
        answer:
          "CSV has no types, so every value is a string. The table right-aligns anything that looks numeric, but the value itself is never converted.",
      },
      {
        question: "Is the file uploaded?",
        answer:
          "No. The File API reads it locally and the parse happens in this tab.",
      },
    ],

  },
  {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    description: 'Convert CSV rows into a JSON array of objects.',
    categories: ['document', 'developer', 'conversion'],
    keywords: ['csv', 'json', 'convert', 'spreadsheet'],
    icon: 'braces',
    status: 'live',
    inputFormat: 'CSV file or text',
    outputFormat: 'JSON',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Drop a CSV file or paste rows.",
      "Choose Objects to use the first row as keys, or Arrays to keep every row as-is.",
      "Check or uncheck Pretty-print depending on where the JSON is going.",
      "Download the result, or copy it from the output box.",
    ],
    faqs: [
      {
        question: "What happens to duplicate column names?",
        answer:
          "They are renamed name, name_2, name_3 rather than overwriting each other. The tool lists every rename it made.",
      },
      {
        question: "Are numbers converted to JSON numbers?",
        answer:
          "No. Every value stays a string, because CSV carries no type information and guessing would silently corrupt values such as \"007\" or \"1,000\".",
      },
      {
        question: "What if a row has fewer columns than the header?",
        answer:
          "It is padded with empty strings so the object always has every key.",
      },
      {
        question: "Is my data uploaded?",
        answer:
          "No. Parsing and conversion happen entirely in your browser.",
      },
    ],

  },
  {
    id: 'json-to-csv',
    name: 'JSON to CSV',
    description: 'Convert a JSON array of objects into CSV rows.',
    categories: ['document', 'developer', 'conversion'],
    keywords: ['json', 'csv', 'convert', 'export'],
    icon: 'table',
    status: 'live',
    inputFormat: 'JSON array',
    outputFormat: 'CSV',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Paste a JSON array of objects, an array of arrays, or a single object.",
      "Pick a delimiter and choose whether to write a header row.",
      "Check the row and column counts before downloading.",
      "Download the CSV, or copy it from the output box.",
    ],
    faqs: [
      {
        question: "How are nested objects handled?",
        answer:
          "They are written as JSON inside the cell. Flattening would invent column names such as address.city that you did not choose, and would change shape whenever one record had an extra field.",
      },
      {
        question: "What if records have different keys?",
        answer:
          "The header is the union of every key, in first-seen order. A record missing a key gets an empty cell.",
      },
      {
        question: "Why CRLF line endings?",
        answer:
          "RFC 4180 specifies CRLF, and Excel expects it. Every spreadsheet application accepts it.",
      },
      {
        question: "Does it work with a single object?",
        answer:
          "Yes. A lone object is treated as a one-row table.",
      },
    ],

  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Format, validate and minify JSON, with clear error positions.',
    categories: ['developer', 'document'],
    keywords: ['json', 'pretty print', 'validate', 'minify', 'lint'],
    icon: 'braces',
    status: 'live',
    inputFormat: 'JSON text',
    outputFormat: 'Formatted or minified JSON',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Paste JSON into the editor.",
      "Choose an indent size, or switch to Minify.",
      "Turn on \"Sort keys alphabetically\" if you want a stable key order.",
      "Copy or download the result. Errors show the line and column.",
    ],
    faqs: [
      {
        question: "Does sorting keys change the data?",
        answer:
          "No. Object key order carries no meaning in JSON. Array order is preserved exactly, because there it does matter.",
      },
      {
        question: "How precise is the error location?",
        answer:
          "The position comes from the JSON parser itself, converted to a 1-based line and column. It points at the first character the parser could not accept.",
      },
      {
        question: "Does it accept JSON5 or comments?",
        answer:
          "No. It uses the browser's JSON.parse, which implements strict JSON. Comments, trailing commas and single quotes are all rejected — and the error says where.",
      },
      {
        question: "Is there a size limit?",
        answer:
          "There is no fixed limit, but very large documents are held in memory twice (input and output), so a file above a few megabytes may feel slow.",
      },
    ],

  },
  {
    id: 'xml-formatter',
    name: 'XML Formatter',
    description: 'Format and validate XML documents with consistent indentation.',
    categories: ['developer', 'document'],
    keywords: ['xml', 'pretty print', 'validate', 'indent'],
    icon: 'code',
    status: 'live',
    inputFormat: 'XML text',
    outputFormat: 'Formatted XML',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Paste XML into the editor.",
      "Leave well-formedness checking on to catch mismatched tags before formatting.",
      "Choose an indent size.",
      "Copy or download the formatted or minified result.",
    ],
    faqs: [
      {
        question: "What does the well-formedness check do?",
        answer:
          "It runs the document through the browser's own XML parser and reports the parser's message when it fails. Turn it off if you are formatting a fragment rather than a complete document.",
      },
      {
        question: "Why did my mixed content get split across lines?",
        answer:
          "An element whose entire content is text stays on one line. Mixed content such as <p>Hello <b>world</b></p> is broken across lines, which adds whitespace between the words. That is harmless for data XML but visible in XHTML, so the tool says so rather than pretending it did not happen.",
      },
      {
        question: "Is whitespace inside pre or script preserved?",
        answer:
          "Yes, during minification. Those four elements — pre, textarea, script and style — keep their whitespace exactly.",
      },
      {
        question: "Does it validate against a schema?",
        answer:
          "No. It checks well-formedness only. Schema or DTD validation is a different job and is not attempted here.",
      },
    ],

  },
  {
    id: 'base64-encoder-decoder',
    name: 'Base64 Encoder & Decoder',
    description: 'Encode text or files to Base64 and decode Base64 back to text or files.',
    categories: ['developer', 'document'],
    keywords: ['base64', 'encode', 'decode', 'data uri'],
    icon: 'code',
    status: 'live',
    inputFormat: 'Text or file',
    outputFormat: 'Base64 or decoded data',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Choose a mode: text to Base64, Base64 to text, file to Base64, or read a data URL.",
      "Paste your input, or drop a file in file mode.",
      "Read the byte counts and the overhead figure.",
      "Copy or download the result.",
    ],
    faqs: [
      {
        question: "Does it handle accented characters and emoji?",
        answer:
          "Yes. Text is converted to UTF-8 bytes with TextEncoder before encoding, and decoded with a strict UTF-8 decoder, so nothing is mangled.",
      },
      {
        question: "Why does Base64 decoding sometimes fail?",
        answer:
          "The tool refuses rather than guessing. Invalid characters, a length that is not a multiple of four, padding in the middle, or bytes that are not valid UTF-8 each produce a specific message.",
      },
      {
        question: "Is Base64 encryption?",
        answer:
          "No. It is a reversible encoding that anyone can undo. Never use it to hide a password or a key.",
      },
      {
        question: "Why is the output about a third larger?",
        answer:
          "Base64 represents three bytes as four characters, so the encoded form is about 33% longer than the original.",
      },
    ],

  },
  {
    id: 'url-encoder-decoder',
    name: 'URL Encoder & Decoder',
    description: 'Percent-encode and decode URLs, query strings and form values.',
    categories: ['developer', 'document', 'security'],
    keywords: ['url encode', 'percent encoding', 'querystring', 'uri'],
    icon: 'link',
    status: 'live',
    inputFormat: 'Text or URL',
    outputFormat: 'Encoded or decoded text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Choose Component for a single value, Full URL to keep the URL structure, or Query to read parameters.",
      "Switch between Encode and Decode.",
      "In Query mode, read the parameter table and the rebuilt query string.",
      "Copy the result you need.",
    ],
    faqs: [
      {
        question: "Component or full URL?",
        answer:
          "Component escapes everything that is not unreserved, which is what you want for one value going into a query string. Full URL leaves the scheme, slashes, question mark and ampersand intact so the URL stays usable.",
      },
      {
        question: "Why does a plus sign become a space?",
        answer:
          "In query strings, + is the historical encoding for a space. The query parser applies that rule; the Component mode does not, because + is a literal character outside a query string.",
      },
      {
        question: "What happens with a malformed escape such as %ZZ?",
        answer:
          "You get a specific error naming the fragment, rather than a crash or a silently wrong result.",
      },
      {
        question: "How are repeated keys shown?",
        answer:
          "As separate rows in the table, and as an array in the JSON view. Note that servers differ — some keep the first value, some the last.",
      },
    ],

  },
  {
    id: 'file-extension-checker',
    name: 'File Extension Checker',
    description: 'Look up what a file extension means, its type and which application opens it.',
    categories: ['document'],
    keywords: ['extension', 'file type', 'mime', 'lookup'],
    icon: 'file',
    status: 'live',
    inputFormat: 'File extension',
    outputFormat: 'File type information',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Paste a filename, a full path, or just the extension.",
      "Read the extension, category and best-guess MIME type.",
      "Search the table below by extension, description or MIME type.",
      "Click any row or chip to load it into the checker.",
    ],
    faqs: [
      {
        question: "Is the MIME type authoritative?",
        answer:
          "No. It is a best guess from a hand-maintained table. Servers can send any type they like, and the real type is determined by the file's contents, not its name.",
      },
      {
        question: "What does \"not in this table\" mean?",
        answer:
          "Only that this tool has no recorded type for that extension. It does not mean the extension is invalid or the file is suspicious.",
      },
      {
        question: "Why are some extensions flagged as risky?",
        answer:
          "Executables and scripts are the formats that run code or install software. A .pdf that is really an .exe is a common trick, and Windows hides extensions by default.",
      },
      {
        question: "Can it tell me what application opens a file?",
        answer:
          "Indirectly. The category and MIME type tell you the family. The exact application depends on your system, so the tool does not claim to know it.",
      },
    ],

  },
  {
    id: 'file-size-converter',
    name: 'File Size Converter',
    description: 'Convert between bytes, kilobytes, megabytes, gigabytes and terabytes.',
    categories: ['document', 'conversion'],
    keywords: ['bytes', 'kb', 'mb', 'gb', 'storage units'],
    icon: 'database',
    status: 'live',
    inputFormat: 'Size value and unit',
    outputFormat: 'Converted size',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Enter a value and pick its unit.",
      "Read every conversion at once, split into decimal and binary families.",
      "Copy any single value with its button.",
      "Check the explanation if a \"500 GB\" drive looks smaller than expected.",
    ],
    faqs: [
      {
        question: "What is the difference between KB and KiB?",
        answer:
          "A kilobyte is 1,000 bytes and a kibibyte is 1,024. They are different units, not two spellings of the same one. Drive makers use decimal; most operating systems report binary.",
      },
      {
        question: "Why does a 500 GB drive show as about 465 GiB?",
        answer:
          "Because 500,000,000,000 bytes is 500 GB in decimal but about 465 GiB in binary. Nothing is missing — only the unit changed.",
      },
      {
        question: "Can it handle very large values?",
        answer:
          "Yes, up to terabytes in both families. The arithmetic is done in JavaScript numbers, which are exact for integers up to about 9 × 10¹⁵ bytes — far beyond any realistic file size.",
      },
      {
        question: "Does it accept negative sizes?",
        answer:
          "No. A negative size is rejected with an explanation rather than converted into nonsense.",
      },
    ],

  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate random version 4 UUIDs, one at a time or in bulk.',
    categories: ['developer', 'document', 'productivity'],
    keywords: ['uuid', 'guid', 'unique id', 'v4'],
    icon: 'hash',
    status: 'live',
    inputFormat: 'Options',
    outputFormat: 'UUID strings',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Choose how many UUIDs you need, from 1 to 1000.",
      "Toggle uppercase, braces and hyphens to match the format your system expects.",
      "Copy one value, copy them all, or download a text file.",
      "Paste an existing UUID into the inspector to read its version and variant.",
    ],
    faqs: [
      {
        question: "How random are these UUIDs?",
        answer:
          "They come from crypto.getRandomValues, the browser's cryptographic random source. Version 4 carries 122 random bits.",
      },
      {
        question: "Can two generated UUIDs collide?",
        answer:
          "In principle, yes; in practice, you would need about 2.7 × 10¹⁸ of them before a 50% chance of any collision. There is no registry and no coordination between machines.",
      },
      {
        question: "Should I use a UUID as a database primary key?",
        answer:
          "Version 4 is random, so it does not sort by insertion order and can fragment an index. Version 7 exists for exactly that reason — it is time-ordered.",
      },
      {
        question: "What is the nil UUID?",
        answer:
          "00000000-0000-0000-0000-000000000000. It is a reserved value meaning \"no UUID\", not a valid identifier, and the inspector recognises it.",
      },
    ],

  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and back, across time zones.',
    categories: ['developer', 'document'],
    keywords: ['unix timestamp', 'epoch', 'date', 'timezone', 'iso 8601'],
    icon: 'clock',
    status: 'live',
    inputFormat: 'Timestamp or date',
    outputFormat: 'Converted date or timestamp',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      "Paste a Unix timestamp, an ISO 8601 string or a plain date.",
      "Read the detected unit and every representation at once.",
      "Copy the form the receiving system wants.",
      "The \"Right now\" panel updates every second from your device clock.",
    ],
    faqs: [
      {
        question: "How does it know seconds from milliseconds?",
        answer:
          "By magnitude. A value below 100,000,000,000 is read as seconds and anything above as milliseconds. That boundary sits comfortably between any realistic value of either — 10¹¹ seconds is the year 5138.",
      },
      {
        question: "Which time zone are the results in?",
        answer:
          "Every representation is shown: ISO 8601 and UTC are zone-free, and the local row uses your device's own zone, with the name and offset shown alongside.",
      },
      {
        question: "Why is a date-only string treated as UTC?",
        answer:
          "That is what the ECMAScript specification requires for a date without a time. A datetime-local value, which has no zone either, is treated as local time — matching what the browser control means.",
      },
      {
        question: "Does Unix time include leap seconds?",
        answer:
          "No. Unix time counts seconds since 1970-01-01T00:00:00Z and ignores leap seconds, so it can drift from UTC by a second or so over decades.",
      },
    ],

  },

  /* ------------------------------------------------------------------ */
  /* PDF — live                                                       */
  /* ------------------------------------------------------------------ */
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine several PDF files into one document, in the order you arrange them.',
    categories: ['pdf'],
    keywords: ['merge', 'combine', 'join', 'concatenate'],
    icon: 'layers',
    status: 'live',
    inputFormat: 'Two or more PDF files',
    outputFormat: 'Single merged PDF',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose two or more PDFs. They are listed in the order you add them.',
      'Arrange them with the arrow buttons, or remove a mistake. The order shown is the order of the pages in the result.',
      'Check the summary line for the file count and the total pages.',
      'Press Merge and download the single PDF. Your original files are never modified.',
    ],
    faqs: [
      {
        question: 'What happens to bookmarks and form fields?',
        answer:
          'Page content, text, images and on-page annotations come across. Bookmarks and fillable form fields do not: a bookmark lives in the document’s index, and a form field only works when the document registers it. Merge with a PDF editor if you need those.',
      },
      {
        question: 'How many files can I merge at once?',
        answer:
          'Twenty-five. Every file has to be held open in memory at once, and past that point a browser tab starts to struggle. Split the work into batches rather than losing the tab.',
      },
      {
        question: 'Is there a size limit?',
        answer:
          'Fifty megabytes per file is the practical limit, not a hard one. The merge happens in this tab, so the ceiling is your device’s memory rather than a server rule.',
      },
      {
        question: 'Does merging change the quality of my pages?',
        answer:
          'No. Pages are copied as they are — no re-encoding, no recompression of images. The only change is that they now live in one document.',
      },
    ],

  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Split a PDF into separate documents by page range or into single pages.',
    categories: ['pdf'],
    keywords: ['split', 'separate', 'pages', 'ranges'],
    icon: 'scissors',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'One or more PDF files',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to split.',
      'Pick a mode: by ranges you write, or every page separately.',
      'In range mode, type the groups separated by commas, for example 1-3, 4-6, 7. Each group becomes one file.',
      'Check the list of output files, then press Split. Several files download as a single ZIP.',
    ],
    faqs: [
      {
        question: 'How do the ranges work?',
        answer:
          'Each comma-separated group becomes one output file, in the order you wrote them. A single page is just its number, 7- means from page 7 to the end, and -3 means the first three pages. Anything invalid is named before you press the button.',
      },
      {
        question: 'What does splitting into every page do?',
        answer:
          'It produces one file per page, numbered from one, ignoring the ranges box entirely. A document of forty pages becomes forty single-page PDFs.',
      },
      {
        question: 'Why do I get a ZIP instead of many downloads?',
        answer:
          'Because a browser that fires forty downloads at once usually blocks most of them. The ZIP keeps the files separate inside one download you can open anywhere.',
      },
      {
        question: 'Are my original pages changed?',
        answer:
          'No. Splitting copies pages into new documents; the file you chose is never written to, and nothing leaves this tab.',
      },
    ],

  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size by optimising embedded images and fonts.',
    categories: ['pdf'],
    keywords: ['compress', 'reduce size', 'optimise', 'shrink'],
    icon: 'gauge',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Smaller PDF',
    processingMode: 'server',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to compress. Read the scope note before pressing the button.',
      'Press Compress. The document is saved twice — once as it is, once with its objects packed — and the smaller file is kept.',
      'Download the result, with both sizes shown so you can see exactly what changed.',
    ],
    faqs: [
      {
        question: 'Why did my PDF barely get smaller?',
        answer:
          'Because most of its bytes are almost certainly images, and this tool does not re-compress those. Packing objects into compressed streams helps documents made of thousands of small objects. A PDF made of photographs barely moves, and the tool says so before you press the button.',
      },
      {
        question: 'How is this different from other compressors?',
        answer:
          'It measures both ways instead of promising a saving. The file is saved twice, the sizes are compared, and the smaller one is used — including keeping the original when packing makes the file larger. The number on the page is what happened, not a claim.',
      },
      {
        question: 'Does compressing change anything visible?',
        answer:
          'No. The pages, text and images are identical. Only the way the document stores its objects changes, which is invisible to a reader.',
      },
      {
        question: 'Can it make a file bigger?',
        answer:
          'In principle yes, which is why both saves are measured and the smaller one is kept. When that happens the tool says the packing made it larger and returns the original rather than quietly handing you a bigger file.',
      },
    ],

  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate all pages, or only the pages you select, by 90, 180 or 270 degrees.',
    categories: ['pdf'],
    keywords: ['rotate', 'turn', 'orientation', 'landscape', 'portrait'],
    icon: 'rotate-cw',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Rotated PDF',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to turn.',
      'Pick a turn: 90° left, 90° right, or 180°.',
      'Choose whether every page turns, or only the pages you list.',
      'Press Rotate and download. The page content is never re-drawn, so no quality is lost.',
    ],
    faqs: [
      {
        question: 'Does rotating reduce the quality of my pages?',
        answer:
          'No. A PDF page stores a rectangle plus an angle, so rotation only changes the angle. Nothing is re-rendered, recompressed or resampled.',
      },
      {
        question: 'Why do the page dimensions swap?',
        answer:
          'A viewer shows the stored rectangle turned by the angle, so a page that ends at 90° or 270° displays with its width and height the other way round. A portrait page reads as landscape afterwards.',
      },
      {
        question: 'What happens to a page that was already rotated?',
        answer:
          'The turn adds to whatever angle the page already has. A page that arrived sideways keeps its existing rotation and turns further from there.',
      },
      {
        question: 'Can I rotate just one page?',
        answer:
          'Yes. Choose “Pages I choose” and list the page numbers, with ranges such as 2 or 4-6. Everything outside the list stays exactly as it was.',
      },
    ],

  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF Pages',
    description: 'Rearrange, rotate and remove pages from a PDF using a visual page grid.',
    categories: ['pdf'],
    keywords: ['organise', 'organize', 'rearrange', 'page manager'],
    icon: 'grid',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Reorganised PDF',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF whose pages you want to arrange. The pages are drawn as thumbnails.',
      'Move a page with the arrow buttons to change the order.',
      'Turn a page with the rotate buttons, or remove it with the bin.',
      'Press Build the document and download. The grid shows the result before anything is written.',
    ],
    faqs: [
      {
        question: 'What does this tool do that the others do not?',
        answer:
          'It combines reorder, rotate and remove in one grid, with each page drawn as it will appear. The other tools do one job each; this one is for when you want to do all three and see the result.',
      },
      {
        question: 'Are the thumbnails the real pages?',
        answer:
          'Yes. They are rendered from your file in this tab, so what you see is what the document contains, not a placeholder image.',
      },
      {
        question: 'What happens to the pages I remove?',
        answer:
          'They are left out of the new document. They are still in the file on your device, which is never written to.',
      },
      {
        question: 'Does turning a page here lose quality, like rotating an image would?',
        answer:
          'No. Page rotation is stored as an angle in the PDF, so the content is never re-drawn. Turning a page here is the same operation the rotate tool performs.',
      },
    ],

  },
  {
    id: 'delete-pdf-pages',
    name: 'Delete PDF Pages',
    description: 'Remove unwanted pages from a PDF and download the cleaned-up document.',
    categories: ['pdf'],
    keywords: ['delete', 'remove', 'pages'],
    icon: 'trash',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'PDF without selected pages',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to trim.',
      'List the pages to remove: single pages, ranges, or both, separated by commas.',
      'Check the summary, which names the pages going and the pages staying.',
      'Press Remove pages and download the cleaned document.',
    ],
    faqs: [
      {
        question: 'What happens to the pages I keep?',
        answer:
          'They stay in their original order and are copied as they are. Only the listed pages are left out of the new document.',
      },
      {
        question: 'Can I delete every page by mistake?',
        answer:
          'No. A selection that would empty the document is refused with a message saying so, because a PDF with no pages is not a document anyone can open.',
      },
      {
        question: 'Is my original file modified?',
        answer:
          'Never. The tool builds a new document from the pages you keep, and the file on your device is not written to.',
      },
      {
        question: 'Is the removed page gone from the file?',
        answer:
          'It is gone from the output document. The original file still has it — save the original if you might need those pages later.',
      },
    ],

  },
  {
    id: 'extract-pdf-pages',
    name: 'Extract PDF Pages',
    description: 'Save the pages you select into a brand new PDF file.',
    categories: ['pdf'],
    keywords: ['extract', 'select pages', 'subset'],
    icon: 'scan',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'New PDF containing selected pages',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF to take pages from.',
      'List the pages you want: single pages, ranges, or both.',
      'Check the summary naming the pages and their order.',
      'Press Extract and download the new document. The original is left untouched.',
    ],
    faqs: [
      {
        question: 'How is this different from deleting pages?',
        answer:
          'It is the same operation seen from the other side: extraction keeps the pages you list and builds a new file from them. Deleting removes the pages you list and keeps the rest.',
      },
      {
        question: 'In what order do the pages come out?',
        answer:
          'Ascending page order, always. A range written backwards, such as 9-3, is rejected with that reason rather than silently reversed.',
      },
      {
        question: 'What is the file called?',
        answer:
          'The original name with the page numbers appended, such as report-p1-3-8.pdf, so you can tell two extractions of the same document apart.',
      },
      {
        question: 'Does extraction lose anything?',
        answer:
          'Pages are copied whole, including their annotations and images. What does not come across is the document’s bookmarks, because the new file has its own index.',
      },
    ],

  },
  {
    id: 'reorder-pdf-pages',
    name: 'Reorder PDF Pages',
    description: 'Change the order of pages in a PDF without touching their content.',
    categories: ['pdf'],
    keywords: ['reorder', 'rearrange', 'sort pages'],
    icon: 'sort',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'PDF with reordered pages',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF whose pages you want to move.',
      'Move pages with the arrow buttons, or type the whole new order in the field, one page number per comma.',
      'The list shows the position each page will take.',
      'Press Apply the new order and download. Page content is not touched.',
    ],
    faqs: [
      {
        question: 'Why do I have to list every page?',
        answer:
          'Because a partial order does not say where the missing pages go. A list that skips one is refused and names it, rather than guessing at a position.',
      },
      {
        question: 'Can a page appear twice?',
        answer:
          'Not in this tool. Duplicating a page would mean adding content, which is a different job. A repeated page is reported with how many times it appears.',
      },
      {
        question: 'How do I move a page to the front quickly?',
        answer:
          'Type the whole order in the field, for example 5, 1, 2, 3, 4, and the list updates as soon as the order is complete and valid.',
      },
      {
        question: 'Is the page content affected?',
        answer:
          'No. Only the order of the pages changes; what is on each page is copied exactly as it was.',
      },
    ],

  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Render each page of a PDF as a JPG image you can download.',
    categories: ['pdf', 'conversion'],
    keywords: ['pdf to jpg', 'export images', 'render pages'],
    icon: 'image',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'JPG images',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF whose pages you want as images.',
      'Pick the resolution: 72 DPI for screen use, 150 DPI to print, 300 DPI for print quality.',
      'Set the JPEG quality, then press Render. Every page becomes a JPG, downloaded together as a ZIP.',
    ],
    faqs: [
      {
        question: 'Which resolution should I choose?',
        answer:
          '72 DPI is about screen resolution and makes small files. 150 DPI prints acceptably. 300 DPI is what a print shop expects, and makes the largest files. The numbers are the width in pixels the page is drawn at, so the file size scales with them.',
      },
      {
        question: 'Why do I get a ZIP?',
        answer:
          'Because a browser blocks most of the downloads when a page fires twenty of them at once. The ZIP keeps each page as its own file inside one download, and the files are named with the page number padded so they sort correctly.',
      },
      {
        question: 'What happens to the transparent parts of a page?',
        answer:
          'They are painted white, because JPEG has no way to store transparency. A page with a see-through background prints as white anyway, so this matches what comes off the printer.',
      },
      {
        question: 'Does rendering lose quality?',
        answer:
          'The page is drawn at the width you chose, so anything above that resolution is resampled. Text and line art stay crisp at 150 DPI and above; a page rendered at 72 DPI and then printed will look soft.',
      },
    ],

  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Combine JPG images into a single, neatly ordered PDF document.',
    categories: ['pdf', 'image', 'conversion'],
    keywords: ['jpg to pdf', 'images to pdf', 'combine images'],
    icon: 'file-text',
    status: 'live',
    inputFormat: 'JPG images',
    outputFormat: 'PDF',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the JPG files you want in the document. Each becomes one page, in the order you add them.',
      'Pick the page size and the margin in millimetres. Zero prints to the edge.',
      'Press Build PDF and download. The order you added the images in is the page order.',
    ],
    faqs: [
      {
        question: 'Does the PDF keep the JPG quality?',
        answer:
          'Almost. Images are embedded as JPEG at 92% quality, which is visually identical to the original for nearly every photograph, but it is a re-encode rather than a copy of your exact bytes. A pixel-identical archive is a job for a ZIP file, not a PDF.',
      },
      {
        question: 'Can I mix JPGs and PNGs in one document?',
        answer:
          'Not in this tool — it takes JPGs only, so the promise on the box is clear. The general Image to PDF tool accepts any image type, and the PNG-specific tool takes PNGs.',
      },
      {
        question: 'What happens to the image dimensions?',
        answer:
          'Each image is scaled to fit inside the page and centred, so the aspect ratio is never changed and nothing is cropped. A landscape photo on a portrait page is letterboxed, not stretched.',
      },
      {
        question: 'Where do my files go?',
        answer:
          'Nowhere. The images are read and the PDF is built in this browser tab, so nothing is uploaded and no copy of your photographs exists anywhere else.',
      },
    ],

  },
  {
    id: 'png-to-pdf',
    name: 'PNG to PDF',
    description: 'Combine PNG images into a single PDF document.',
    categories: ['pdf', 'image', 'conversion'],
    keywords: ['png to pdf', 'images to pdf'],
    icon: 'file-text',
    status: 'live',
    inputFormat: 'PNG images',
    outputFormat: 'PDF',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PNG files you want in the document. Each becomes one page, in the order you add them.',
      'Pick the page size and the margin in millimetres. Zero prints to the edge.',
      'Press Build PDF and download.',
    ],
    faqs: [
      {
        question: 'What happens to the transparency in my PNGs?',
        answer:
          'It is flattened onto white. A PDF page has no way to show see-through areas over the paper background, so leaving transparency in would make those parts render as black. Flattening is what a printer would do anyway.',
      },
      {
        question: 'Is the result lossless like the PNG I uploaded?',
        answer:
          'No. The pages are embedded as JPEG at 92% quality to keep the file small, which is a re-encode rather than a copy of your exact bytes. For a pixel-perfect archive, use a ZIP file rather than a PDF.',
      },
      {
        question: 'Can I put several PNGs on one page?',
        answer:
          'Not here. Each image becomes its own page, which is what a document of scans or screenshots usually wants. Combining images onto a shared page is a layout job, not a conversion job.',
      },
      {
        question: 'Where do my files go?',
        answer:
          'Nowhere. The conversion runs in this browser tab, so your images are never uploaded and no copy is kept.',
      },
    ],

  },
  {
    id: 'add-page-numbers',
    name: 'Add Page Numbers',
    description: 'Insert page numbers into a PDF with control over position, start value and format.',
    categories: ['pdf'],
    keywords: ['page numbers', 'pagination', 'numbering'],
    icon: 'hash',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Numbered PDF',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to number.',
      'Pick the format — a bare number, “Page 3”, “Page 3 of 12”, or “3 / 12”.',
      'Pick the position, and set the starting number. Leave it at 1 for an ordinary document.',
      'Press Add page numbers and download. The original file is not modified.',
    ],
    faqs: [
      {
        question: 'Where exactly does the number go?',
        answer:
          'One of five positions: bottom centre, bottom right, bottom left, top centre, or top right. The number is drawn on top of the page in grey and sized to the page, so it reads as furniture rather than as content.',
      },
      {
        question: 'Can I skip the first page?',
        answer:
          'Yes, indirectly: set the starting number to 1 and the numbering still covers every page. What this tool does not do is leave chosen pages unnumbered, because a gap in a numbering scheme usually means the numbering is wrong.',
      },
      {
        question: 'What does the total in “Page 3 of 12” mean?',
        answer:
          'The number of pages in the document. That stays true even when numbering starts elsewhere, so the count reads consistently from the first page to the last.',
      },
      {
        question: 'Does stamping a number change my pages?',
        answer:
          'It adds ink, not edits. The number is drawn over the existing content, so it sits on top of whatever is already there — including anything printed in that corner.',
      },
    ],

  },
  {
    id: 'add-watermark',
    name: 'Add Watermark',
    description: 'Stamp a text or image watermark across the pages of a PDF.',
    categories: ['pdf'],
    keywords: ['watermark', 'stamp', 'branding'],
    icon: 'droplet',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Watermarked PDF',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to stamp.',
      'Type the text, up to sixty characters, and set its size in points.',
      'Pick a placement: diagonal across the page, dead centre, tiled, or the bottom right corner.',
      'Set the strength and press Add the watermark. The tool warns when the strength is high enough to cover the page.',
    ],
    faqs: [
      {
        question: 'How strong should a watermark be?',
        answer:
          'Around 10 to 30%. At 60% or above the stamp covers the page it is meant to label, and below 10% it disappears on a dark or busy page. Both ends are reported rather than applied silently.',
      },
      {
        question: 'Can I use an image or logo instead of text?',
        answer:
          'Not in this tool. It stamps text, which covers the common case of marking a document confidential, draft or a sample. For a logo, use the image watermark tool on the pictures first and rebuild the PDF, or a desktop editor.',
      },
      {
        question: 'Does the watermark survive someone copying the PDF?',
        answer:
          'The stamp is drawn into the page content, so it travels with the file and is not a comment someone can toggle off. It does not encrypt anything, so it is a marking tool and not a protection tool — protecting a PDF needs a password, which is a different job entirely.',
      },
      {
        question: 'What does “tiled” do?',
        answer:
          'It repeats the text across the whole page on a diagonal grid, spaced by its own size. That is the hardest placement to crop out, and also the most intrusive.',
      },
    ],

  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    description:
      'Remove a password from a PDF you are authorised to access. Still on the roadmap: the PDF library this site uses in the browser can read and write documents but has no RC4 or AES decryption, so an encrypted file cannot be opened here at all — not without sending it to a server, which TOOLZEN does not do.',
    categories: ['pdf'],
    keywords: ['unlock', 'remove password', 'decrypt'],
    icon: 'unlock',
    status: 'planned',
    inputFormat: 'Password-protected PDF',
    outputFormat: 'Unprotected PDF',
    processingMode: 'server',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description:
      'Add password protection and set permissions for printing and copying. Still on the roadmap: the PDF library this site uses in the browser can write documents but has no encryption support, so it cannot add a password. Doing this properly needs a server, which would mean your file leaving your device.',
    categories: ['pdf'],
    keywords: ['protect', 'password', 'encrypt', 'permissions'],
    icon: 'lock',
    status: 'planned',
    inputFormat: 'PDF file',
    outputFormat: 'Encrypted PDF',
    processingMode: 'server',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
  },
  {
    id: 'pdf-metadata-viewer',
    name: 'PDF Metadata Viewer',
    description: 'Inspect the title, author, producer, creation date and other properties of a PDF.',
    categories: ['pdf'],
    keywords: ['metadata', 'properties', 'author', 'producer', 'info'],
    icon: 'info',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Metadata report',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF whose properties you want to inspect.',
      'The report lists every field the document states, and marks the ones it does not.',
      'Nothing is changed and nothing is uploaded.',
    ],
    faqs: [
      {
        question: 'Why does it say “not stated in the document” for most fields?',
        answer:
          'Because the file genuinely does not say. Plenty of PDF generators write the pages and never set a title or an author. The report shows what the document states about itself rather than filling the gaps with guesses.',
      },
      {
        question: 'What is XMP, and why is it not decoded here?',
        answer:
          'XMP is a second, richer metadata packet that some tools write alongside the standard one. This tool reports whether the packet is present but does not read it, and says so on the page rather than presenting a partial answer as complete.',
      },
      {
        question: 'Can I edit the metadata with this tool?',
        answer:
          'No. It is read-only, deliberately: a viewer that could change a document’s title and author would need to re-save the file, and a tool that reads properties should not quietly rewrite them.',
      },
      {
        question: 'Are the permission flags reliable?',
        answer:
          'They are advisory. A PDF can state that printing is not allowed, and a viewer may still respect or ignore that. The report shows the flags without claiming they control anything.',
      },
    ],

  },
  {
    id: 'pdf-page-preview',
    name: 'PDF Page Preview',
    description: 'Preview the pages of a PDF in your browser before you process the file.',
    categories: ['pdf'],
    keywords: ['preview', 'view pages', 'thumbnail'],
    icon: 'eye',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Page previews',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want to look at.',
      'The pages are drawn as thumbnails, in order, with the size each one prints at.',
      'Nothing is written and nothing is uploaded. Close the tab when you are done looking.',
    ],
    faqs: [
      {
        question: 'Why would I preview a PDF here rather than open it?',
        answer:
          'Because the alternative is handing a file you have not seen to another tool. This draws every page first, so you can check the page count, spot a landscape page in a portrait document, or find the blank page at the end before you process anything.',
      },
      {
        question: 'Are the thumbnails the real pages?',
        answer:
          'Yes. They are rendered from your file in this tab, at a width of 180 pixels. That is enough to judge layout and orientation, but not enough to read fine print.',
      },
      {
        question: 'Why does the size shown differ from the size I exported at?',
        answer:
          'The size shown is what a reader sees after the page’s stored rotation is applied. A portrait page stored sideways reports as landscape, because that is how it prints and displays.',
      },
      {
        question: 'Is my document uploaded to be shown?',
        answer:
          'No. The rendering happens entirely in this tab, which is why the tool works offline and why closing the tab discards everything it drew.',
      },
    ],

  },
  {
    id: 'pdf-size-analyzer',
    name: 'PDF File Size Analyzer',
    description: 'Break down what is taking up space inside a PDF, such as images, fonts and content.',
    categories: ['pdf'],
    keywords: ['file size', 'analyse', 'optimise', 'breakdown'],
    icon: 'bar-chart',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Size breakdown report',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF you want measured.',
      'The breakdown adds up the binary streams inside the file: images, fonts and page content.',
      'Read the advice, which says what the breakdown means for shrinking the file.',
    ],
    faqs: [
      {
        question: 'What does the breakdown actually measure?',
        answer:
          'The decoded size of every stream in the document — the images, the fonts, and the page content along with form objects. Percentages are of the whole file, so they add up to roughly the file’s size rather than exceeding it.',
      },
      {
        question: 'It says images are most of the file. What can I do?',
        answer:
          'Shrink the images before they go into the PDF, or use a tool that re-compresses them. This website does not re-encode images inside a PDF in the browser, because that means decoding and re-encoding every embedded image one at a time.',
      },
      {
        question: 'Why is the total less than the file size?',
        answer:
          'Because the file also holds its own structure: the objects, the page tree, the cross-reference table. Those are small, but they are not counted as streams.',
      },
      {
        question: 'Does this tool compress anything?',
        answer:
          'No. It measures and reports, and it does not write a file. The compression tool is a separate one, and it explains the difference between a structural re-save and an image re-compress.',
      },
    ],

  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract the selectable text from a PDF into a plain text file.',
    categories: ['pdf', 'conversion'],
    keywords: ['extract text', 'pdf to txt', 'copy text'],
    icon: 'file-text',
    status: 'live',
    inputFormat: 'PDF file',
    outputFormat: 'Plain text',
    processingMode: 'client',
    maxFileSize: '50 MB per file',
    addedAt: '2026-10-17',
    instructions: [
      'Choose the PDF whose text you want to extract.',
      'Press Extract the text. The text layer of every page is read in order.',
      'Read the result, switch the page markers on or off, and download it as a plain text file.',
    ],
    faqs: [
      {
        question: 'Why did a page come back empty?',
        answer:
          'Almost always because it is a scan: a photograph of writing, where the words exist only as pixels. This tool does not run optical character recognition, because that needs a server-side model and your file stays in this tab. The number of empty pages is reported so the gap is visible.',
      },
      {
        question: 'Is the layout preserved?',
        answer:
          'Line breaks are kept where the document had them, so a heading stays on its own line. Columns, tables and indentation are not preserved, because the extracted text is a stream of words in reading order, not a layout.',
      },
      {
        question: 'What are the [Page n] markers?',
        answer:
          'Optional separators the tool can insert between pages, so you can tell where one page ends and the next begins. Turn them off if you want an unbroken stream of text to paste somewhere else.',
      },
      {
        question: 'Does extraction work on any PDF?',
        answer:
          'It works on any PDF with a text layer, which is nearly every document produced by a word processor. A scanned document, a photographed document, or an image exported as a PDF has no text layer to read.',
      },
    ],

  },
  {
    id: 'text-to-pdf',
    name: 'Text to PDF',
    description: 'Turn plain text into a neatly formatted PDF document.',
    categories: ['pdf', 'conversion'],
    keywords: ['text to pdf', 'txt to pdf', 'create pdf'],
    icon: 'file-text',
    status: 'live',
    inputFormat: 'Plain text',
    outputFormat: 'PDF',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type or paste the text you want in the document. Blank lines start a new paragraph.',
      'Pick the page size, A4 or US Letter.',
      'Check the page count the tool predicts, then press Build the PDF and download.',
    ],
    faqs: [
      {
        question: 'Does it keep bold, italics or headings?',
        answer:
          'No. The output is one font, one size, with no styling, because this tool does not claim to read markdown or rich text. If you need formatting, write the document in a word processor and export a PDF there.',
      },
      {
        question: 'How does it decide where a line breaks?',
        answer:
          'By character count, not by measuring each glyph. That means a line of wide capitals may wrap earlier than expected, while a line of thin punctuation wraps later. The margin is fixed, so text never runs off the page either way.',
      },
      {
        question: 'Does it handle non-Latin scripts or emoji?',
        answer:
          'No, and it says so before building rather than failing halfway. The PDF fonts used here cover Latin text plus the Windows extras such as the euro sign and curly quotes. A Cyrillic letter, a Chinese character, an emoji or a tab is listed by name and code point, and the document is not built until those characters are replaced. The tool does not fall back to a system font it cannot see.',
      },
      {
        question: 'Where does my text go?',
        answer:
          'Nowhere. The document is built in this browser tab from the standard font set, so nothing is uploaded and nothing is stored after you close the tab.',
      },
    ],

  },

  /* ------------------------------------------------------------------ */
  /* IMAGE — live                                                     */
  /* ------------------------------------------------------------------ */
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce image file size while keeping the visual quality you choose.',
    categories: ['image'],
    keywords: ['compress', 'optimise', 'reduce size', 'quality'],
    icon: 'gauge',
    status: 'live',
    inputFormat: 'JPEG, PNG or WebP image',
    outputFormat: 'Compressed image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose an image. It stays in this browser tab; nothing is uploaded.',
      'Pick a size: set the longest side in pixels, choose a percentage, or fit inside a preset such as Full HD.',
      'Pick a quality preset. High is around 88 and is visually lossless for most photographs; Small at 60 is fine for thumbnails.',
      'Choose the output format. WebP is the smallest lossy option, PNG is lossless but larger, JPEG has the widest compatibility.',
      'Press Compress. The tool reports the new size and the percentage saved, and it says so plainly if the file grew instead.',
    ],
    faqs:     [
      {
        question: 'Why did my file get bigger?',
        answer:
          'A JPEG is already compressed, so re-encoding it at a high quality can add data rather than remove it. The tool reports the real number instead of hiding it. Converting to WebP, or lowering the quality, usually fixes it.',
      },
      {
        question: 'Should I lower the size or the quality first?',
        answer:
          'Lower the size. Halving the side lengths removes three quarters of the pixels, which saves far more than any quality setting. The tool warns you when the size is doing the work so you do not spend detail on both.',
      },
      {
        question: 'Is the quality number a promise?',
        answer:
          'No. The saving estimate the tool shows before you press the button is a guess based on the quality alone. The real number is measured after encoding, and that is the one reported as the result.',
      },
      {
        question: 'Does PNG compression lose anything?',
        answer:
          'No. PNG is lossless, so the picture is exactly what you put in. It is also the larger file for anything photographic, which is the trade-off the tool states on the quality panel.',
      },
    ],
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize an image to exact pixel dimensions or by percentage.',
    categories: ['image'],
    keywords: ['resize', 'scale', 'dimensions', 'pixels'],
    icon: 'ruler',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Resized image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to resize.',
      'Pick a target mode: Long edge sets one number and derives the other from the aspect ratio, Percent scales both sides, Preset fits inside a box, and Exact takes both numbers from you.',
      'Check the target size the tool reports. It also says in plain words when the shape changes.',
      'Press Resize and download the result.',
    ],
    faqs:     [
      {
        question: 'What is the difference between an exact resize and a preset?',
        answer:
          'An exact resize stretches the image to the two numbers you type, even if that distorts it. A preset fits the image inside a box while keeping its shape, so a landscape photo on a square preset is letterboxed rather than squashed.',
      },
      {
        question: 'Can I make a small image bigger?',
        answer:
          'You can, but the tool warns you first. Scaling up cannot add detail that was never captured, so the result looks soft. If you need a bigger file for print, it is better to re-export the original.',
      },
      {
        question: 'Why does the output come out as WebP?',
        answer:
          'WebP is the smallest of the formats the tool can write and every current browser reads it. You can switch to PNG or JPEG in the output format list if you need those instead.',
      },
      {
        question: 'My file says .png but the tool says it is a JPEG. Which is right?',
        answer:
          'The bytes are right, and the tool trusts them. People rename files and some tools write the wrong extension. The tool tells you when the name and the format disagree rather than silently mislabelling the output.',
      },
    ],
  },
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    description: 'Crop an image to a chosen area or a preset aspect ratio.',
    categories: ['image'],
    keywords: ['crop', 'trim', 'aspect ratio'],
    icon: 'crop',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Cropped image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to crop.',
      'Pick an aspect ratio, or leave it on Free to draw any box you like.',
      'Drag a box over the image. The tool shows the selection size in pixels and the percentage of the area it keeps.',
      'Press Crop and download the result as a PNG.',
    ],
    faqs:     [
      {
        question: 'What happens if I drag outside the image?',
        answer:
          'The selection is trimmed to the edge and the tool tells you it did, along with the real size of the crop. It never silently exports a rectangle that extends past the picture.',
      },
      {
        question: 'Does cropping reduce the file size?',
        answer:
          'Usually, because there are fewer pixels, but the tool re-encodes as a lossless PNG, so a heavily-compressed JPEG cropped to PNG can end up larger. If that matters to you, follow the crop with the compressor.',
      },
      {
        question: 'Can I crop to an exact pixel size?',
        answer:
          'Not from this page. The box is drawn as a percentage of the image and the result is whatever pixels that covers. For exact dimensions, use the resizer with the Exact mode.',
      },
      {
        question: 'Why is the whole image reported as covering 100 percent?',
        answer:
          'A box drawn around everything leaves nothing to crop, so the tool says so rather than exporting an identical copy. Drag a smaller box to actually cut something away.',
      },
    ],
  },
  {
    id: 'image-format-converter',
    name: 'Image Format Converter',
    description: 'Convert images between JPEG, PNG, WebP and other supported formats.',
    categories: ['image', 'conversion'],
    keywords: ['convert', 'format', 'jpeg', 'png', 'webp'],
    icon: 'repeat',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Image in the selected format',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to convert.',
      'Pick the target format from PNG, JPEG and WebP.',
      'For a lossy target, set the quality. The tool explains what the setting costs before you press the button.',
      'Press Convert and download the result. The tool reports the new size and the change against the original.',
    ],
    faqs:     [
      {
        question: 'Which format should I choose?',
        answer:
          'WebP for modern websites, because it is smaller than a JPEG at the same visible quality and can hold transparency. PNG for screenshots, logos and anything you will edit again. JPEG only when you need compatibility with older software.',
      },
      {
        question: 'What happens to the transparency in my PNG if I convert to JPEG?',
        answer:
          'It becomes black, because JPEG has no alpha channel. The tool warns you before you convert, and offers WebP or PNG as formats that keep the see-through areas.',
      },
      {
        question: 'Why is the converted file sometimes larger?',
        answer:
          'Re-encoding an already-compressed image can add data, particularly at a high quality setting. The tool reports the number it measured and does not describe a growth as a saving.',
      },
      {
        question: 'Does the tool read the extension on the file name?',
        answer:
          'No, it reads the bytes. A JPEG renamed to .png is still a JPEG, and the tool says so rather than producing a file with a misleading extension.',
      },
    ],
  },
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    description: 'Convert JPG images to PNG, preserving detail and adding transparency support.',
    categories: ['image', 'conversion'],
    keywords: ['jpg to png', 'convert', 'transparency'],
    icon: 'image',
    status: 'live',
    inputFormat: 'JPG image',
    outputFormat: 'PNG image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the JPEG you want to convert.',
      'The target is already set to PNG, because that is what this page is for.',
      'Press Convert to PNG and download the result.',
    ],
    faqs:     [
      {
        question: 'Why convert a JPEG to PNG?',
        answer:
          'It stops the quality loss from any further edits. A JPEG loses a little detail every time it is re-saved; a PNG does not. The file will be larger, which is the trade.',
      },
      {
        question: 'Will converting fix a blurry photo?',
        answer:
          'No. The detail that JPEG compression already threw away is gone. Converting to PNG protects what is left from further damage, but it cannot add anything back.',
      },
      {
        question: 'Is this page doing something the general converter is not?',
        answer:
          'No. It is the same converter with the target already chosen, so the two cannot disagree and you do not have to pick a format you already decided on.',
      },
      {
        question: 'Does JPEG have transparency?',
        answer:
          'No. If your JPEG already looks like it has a see-through area, that is really black or white. Converting to PNG will make that obvious rather than fix it.',
      },
    ],
  },
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    description: 'Convert PNG images to JPG with a background colour for transparent areas.',
    categories: ['image', 'conversion'],
    keywords: ['png to jpg', 'convert', 'flatten'],
    icon: 'image',
    status: 'live',
    inputFormat: 'PNG image',
    outputFormat: 'JPG image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the PNG you want to convert.',
      'The target is already set to JPEG. Set the quality if you want a different balance of size against detail.',
      'Press Convert to JPEG and download the result.',
    ],
    faqs:     [
      {
        question: 'Why convert a PNG to JPEG?',
        answer:
          'For photographs, a JPEG is many times smaller than a PNG at a quality most people cannot tell apart. The cost is that it is lossy, so every further save loses a little more.',
      },
      {
        question: 'What happens to the transparency?',
        answer:
          'It turns black, because JPEG has no alpha channel. The tool warns you before you convert. If you need to keep see-through areas, choose WebP or stay on PNG.',
      },
      {
        question: 'What quality should I use?',
        answer:
          '85 is the tool\'s suggestion and is a good default. 90 and above costs a lot of file size for very little visible gain; below 60 the loss starts to show on detailed images.',
      },
      {
        question: 'Is a JPEG or a PNG better for a screenshot?',
        answer:
          'A PNG. Screenshots are mostly flat colour and text, and JPEG smears sharp edges. Converting a screenshot to JPEG is the one case where the file usually gets bigger and looks worse.',
      },
    ],
  },
  {
    id: 'webp-converter',
    name: 'WebP Converter',
    description: 'Convert WebP images to JPEG or PNG, and convert other formats to WebP.',
    categories: ['image', 'conversion'],
    keywords: ['webp', 'convert', 'google'],
    icon: 'repeat',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'WebP, JPEG or PNG image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to convert.',
      'The target is already set to WebP.',
      'Set the quality if you want to. WebP needs a lower number than JPEG to look the same, which is the tool\'s whole suggestion.',
      'Press Convert to WebP and download the result.',
    ],
    faqs:     [
      {
        question: 'Will WebP work everywhere?',
        answer:
          'In every current browser, yes. Older software and some social platforms still do not accept it, which is the tool\'s stated trade-off. Keep a JPEG or PNG copy if you are uploading somewhere you cannot check.',
      },
      {
        question: 'Why is the suggested quality lower than for JPEG?',
        answer:
          'Because it needs to be. WebP at 82 looks about as good as a JPEG at 85, and it is smaller. Giving it the same number would waste exactly the advantage you converted for.',
      },
      {
        question: 'Can WebP hold transparency?',
        answer:
          'Yes, both the lossy and the lossless variants. That makes it the natural choice when you need a small file that also keeps see-through areas.',
      },
      {
        question: 'Is this page different from the general converter?',
        answer:
          'No, it is the same converter with the target pre-selected. They share one implementation so the two pages can never produce different results.',
      },
    ],
  },
  {
    id: 'image-rotator',
    name: 'Image Rotator',
    description: 'Rotate an image by 90, 180 or 270 degrees, or by a fine angle.',
    categories: ['image'],
    keywords: ['rotate', 'turn', 'straighten'],
    icon: 'rotate-cw',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Rotated image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to rotate.',
      'Press Rotate left, Rotate right or Turn upside down. Each press is a quarter turn.',
      'Watch the output size change: a quarter turn swaps the width and the height.',
      'Press Apply and export to download a PNG of the result.',
    ],
    faqs:     [
      {
        question: 'Is the rotation lossless?',
        answer:
          'No. The tool re-draws the image on a canvas, which re-encodes it. A true lossless JPEG rotation only works when the sides are exact multiples of the encoder\'s block size, and this tool would rather re-encode and say so than claim a saving that silently fails.',
      },
      {
        question: 'My photo from a phone looks sideways. Why?',
        answer:
          'The camera writes an orientation tag instead of rotating the pixels, and not every program reads it. Rotating the image here bakes the correct orientation into the file so it displays the same way everywhere.',
      },
      {
        question: 'Why is the export always a PNG?',
        answer:
          'Because PNG is lossless, so rotating a PNG costs nothing, and a rotated JPEG would already have lost data. If you need a JPEG, re-run the downloaded PNG through the compressor.',
      },
      {
        question: 'Can I rotate by an arbitrary angle such as 30 degrees?',
        answer:
          'Not on this page. A rotation by anything other than a quarter turn leaves triangular gaps at the corners that have to be filled in with something, and this tool does not invent pixels. Use a design tool for that.',
      },
    ],
  },
  {
    id: 'image-flipper',
    name: 'Image Flipper',
    description: 'Flip an image horizontally or vertically to create a mirror image.',
    categories: ['image'],
    keywords: ['flip', 'mirror', 'reflect'],
    icon: 'flip',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Flipped image',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose the image you want to mirror.',
      'Press Flip horizontally to mirror it left to right, or Flip vertically to mirror it top to bottom.',
      'The rotation buttons work too, and combine with the flips.',
      'Press Apply and export to download a PNG.',
    ],
    faqs:     [
      {
        question: 'What is the difference between flipping and rotating?',
        answer:
          'Rotating turns the whole image. Flipping mirrors it, the way text appears when you hold a page up to a lamp. Flipping horizontally is what corrects a mirrored selfie or a front-facing camera.',
      },
      {
        question: 'Will the image get bigger?',
        answer:
          'No. A flip on its own does not change the dimensions, so the output size stays the same. Only a quarter turn swaps the width and height.',
      },
      {
        question: 'Why is the export a PNG and not the format I put in?',
        answer:
          'Because a flip forces a re-encode, and this tool uses the lossless format for that so the mirror itself costs nothing. Convert the result with the compressor if you need a smaller file.',
      },
      {
        question: 'Can I flip an image without losing any quality at all?',
        answer:
          'Not through this tool, which redraws the picture. A mirror also cannot be stored as a metadata tag the way an orientation can, so every flipper has to re-encode.',
      },
    ],
  },
  {
    id: 'image-metadata-viewer',
    name: 'Image Metadata Viewer',
    description: 'View EXIF and other metadata stored inside an image, including camera settings.',
    categories: ['image'],
    keywords: ['exif', 'metadata', 'camera', 'gps', 'properties'],
    icon: 'info',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Metadata report',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose a JPEG, PNG or WebP file. The tool reads it in this tab and nothing is uploaded.',
      'Read the tags. JPEG carries the most, because that is where cameras write EXIF.',
      'Check the orientation note, which explains how the file says it should be displayed.',
      'If you want to share the file, press Export a copy without EXIF to strip the tags.',
    ],
    faqs:     [
      {
        question: 'Why does my photo have no tags at all?',
        answer:
          'Because something already removed them. Screenshots, images from design tools, and anything that has been through a social network are all stripped. WhatsApp, Instagram and X all strip EXIF on upload.',
      },
      {
        question: 'What is in EXIF that I should care about?',
        answer:
          'The camera make and model, the exact date and time, the settings used, and sometimes GPS coordinates. Publishing the original file publishes all of that, which is why the tool offers a cleaned copy.',
      },
      {
        question: 'Why is the date shown without a time zone?',
        answer:
          'Because EXIF does not record one. The camera stores its own local time, and the tool reports that as written rather than guessing an offset that would be wrong by hours.',
      },
      {
        question: 'Does the cleaned copy lose quality?',
        answer:
          'Some, because it has to be re-encoded to drop the tags, and the tool uses JPEG at 92 percent. That is a real cost and the tool states it rather than claiming a free clean.',
      },
    ],
  },
  {
    id: 'image-dimensions-checker',
    name: 'Image Dimensions Checker',
    description: 'Check the pixel dimensions, aspect ratio and orientation of an image.',
    categories: ['image'],
    keywords: ['dimensions', 'resolution', 'aspect ratio', 'size'],
    icon: 'ruler',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Dimension details',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose an image. Its pixel size is read from the file header when possible and by decoding it otherwise.',
      'Type what the image is for, for example website hero, thumbnail, print poster or 4k screen.',
      'Read the verdict, which says whether the size is enough for that job.',
      'Set a DPI if you are printing, to see the physical size the pixels work out to.',
    ],
    faqs:     [
      {
        question: 'Where does the tool get the size from?',
        answer:
          'For a PNG, GIF or BMP the size sits at a fixed place in the header, so it can be read without decoding. For a JPEG the tool walks the segment table. The panel says which method was used, so you know how much to trust it.',
      },
      {
        question: 'What if I type something the tool does not recognise?',
        answer:
          'It says so and reports the raw numbers rather than inventing a verdict. The benchmark list is short on purpose, because a confident answer about a job it knows nothing about would be a guess.',
      },
      {
        question: 'Does a bigger pixel count always mean a better image?',
        answer:
          'No, and that is why the tool only compares against a job. A 6000-pixel banner for a 600-pixel slot is worse than a sharp 1200-pixel one, because it carries no extra information and takes longer to load.',
      },
      {
        question: 'What DPI should I use for print?',
        answer:
          '300 for a printed page, which is what the tool defaults to. 150 is acceptable for large posters viewed at a distance. Screen use has no DPI setting at all, which is why the field matters only for print.',
      },
    ],
  },
  {
    id: 'image-color-picker',
    name: 'Image Color Picker',
    description: 'Pick colours from anywhere in an image and copy their HEX, RGB or HSL values.',
    categories: ['image', 'color'],
    keywords: ['colour picker', 'eyedropper', 'hex', 'rgb', 'palette'],
    icon: 'palette',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Colour values',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose an image, or paste a colour as a hex value or an rgb() string.',
      'Click anywhere on the image to pick that pixel\'s colour.',
      'Read the palette below the image for the dominant colours, with the share of pixels each one covers.',
      'Compare against a second colour to see the WCAG contrast ratio and whether the pair is safe for body text.',
    ],
    faqs:     [
      {
        question: 'How is the palette decided?',
        answer:
          'Colours within sixteen of each other in every channel are merged into one swatch, so a photograph\'s hundreds of near-identical greens do not drown the colours that matter. Transparent pixels are skipped entirely, so a transparent PNG reports only its visible colours.',
      },
      {
        question: 'What do the contrast numbers mean?',
        answer:
          'They are WCAG contrast ratios. 4.5 to 1 is the bar for body text, 3 to 1 is allowed for large text and icons, and 7 to 1 is the strict AAA level. The tool reports the level in plain words rather than just the letters.',
      },
      {
        question: 'Why does my huge image load quickly?',
        answer:
          'The picker works on a copy capped at 1600 pixels wide, so clicking is measured against the whole image without decoding every pixel of a panorama. The palette is sampled the same way.',
      },
      {
        question: 'Why does the tool reject an hsl() colour I paste in?',
        answer:
          'Because an hsl() string has to be resolved by a browser, and this tool does not depend on one to parse a colour. It reads hex and rgb(), and says so rather than returning a wrong answer.',
      },
    ],
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine images into a single PDF with control over page size and orientation.',
    categories: ['image', 'pdf', 'conversion'],
    keywords: ['images to pdf', 'convert', 'combine'],
    icon: 'file-text',
    status: 'live',
    inputFormat: 'Image files',
    outputFormat: 'PDF',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose one or more images. Each becomes one page, in the order you add them.',
      'Pick the page size, A4 or US Letter in either orientation.',
      'Set the margin in millimetres. Zero prints to the edge.',
      'Press Build PDF and download the result.',
    ],
    faqs:     [
      {
        question: 'Will my image fill the whole page?',
        answer:
          'Only if the shape matches. The image is scaled to fit inside the page and centred, so the aspect ratio is never changed. A landscape photo on a portrait page ends up with bands above and below, which is the honest result.',
      },
      {
        question: 'What happens to a transparent PNG?',
        answer:
          'It is flattened onto white, because a PDF page has no way to show through. Without that step the transparent areas would come out black, which the tool avoids rather than describing as a feature.',
      },
      {
        question: 'Are the images embedded at full quality?',
        answer:
          'No, they are embedded as JPEG at 92 percent. That keeps the file small, and it means the PDF is not a pixel-identical copy of your originals. The tool states this rather than implying a lossless archive.',
      },
      {
        question: 'Can I reorder the pages afterwards?',
        answer:
          'Not from this tool. Add the images in the order you want them, because the pages follow that order. To change it, rebuild with the files added differently.',
      },
    ],
  },
  {
    id: 'multiple-image-resizer',
    name: 'Multiple Image Resizer',
    description: 'Resize a batch of images at once using shared settings.',
    categories: ['image', 'productivity'],
    keywords: ['batch resize', 'bulk', 'many images'],
    icon: 'layers',
    status: 'live',
    inputFormat: 'Multiple image files',
    outputFormat: 'Resized images',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Choose up to fifty images at once.',
      'Pick a target. Long edge keeps each image\'s own shape and sets its longest side to the number you give.',
      'Press Resize. The tool reports progress as each image finishes.',
      'Download the files one at a time, or all together as a zip.',
    ],
    faqs:     [
      {
        question: 'Why do the images end up different sizes?',
        answer:
          'Because a mixed batch cannot all be the same number of pixels and keep their shape. Long edge mode sets the longest side to the same number, so a landscape and a portrait both get a 1600-pixel long edge and different short edges.',
      },
      {
        question: 'What does the exact square mode do?',
        answer:
          'It forces every image to the same width and height. Images whose shape does not match are stretched, which the tool warns about, because a batch sharing one pair of numbers cannot do otherwise.',
      },
      {
        question: 'Why is there a limit of fifty files?',
        answer:
          'Because everything runs in this browser tab. A very large batch would have to hold every decoded image in memory at once and exhaust the tab\'s allowance, so the limit is stated rather than reached.',
      },
      {
        question: 'How are the output files named?',
        answer:
          'The original name, then a hyphen and a number padded to the width of the batch, so a batch of twelve sorts correctly in any file manager. The tool keeps the numbering consistent rather than starting over.',
      },
    ],
  },
  {
    id: 'image-background-utilities',
    name: 'Image Background Utilities',
    description:
      'Remove or replace a plain image background where the image supports it, and set a solid colour behind transparent areas.',
    categories: ['image'],
    keywords: ['background', 'remove background', 'transparent'],
    icon: 'droplet',
    status: 'live',
    inputFormat: 'Image file',
    outputFormat: 'Image with modified background',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-17',
    instructions:     [
      'Read what this tool is for. It adds borders, fills a backdrop and sets up a transparent canvas; it does not cut a subject out of its background.',
      'Choose a PNG or WebP, the two formats that keep transparency.',
      'Pick a job: a padding border, a solid-colour backdrop, an outline, or an empty transparent canvas.',
      'Set the amount as a percentage of the shorter side, then apply and download as PNG.',
    ],
    faqs:     [
      {
        question: 'Why does this tool not remove backgrounds?',
        answer:
          'Because doing that needs a segmentation model that decides which pixels are the subject and which are the background, and a tool that guessed would produce a bad cut-out without telling you. What it does instead are the jobs that get mistaken for removal, and it says plainly which is which.',
      },
      {
        question: 'What is the difference between a padding border and an outline?',
        answer:
          'A padding border grows the canvas and centres the image inside it, leaving a gap of the background. An outline is drawn immediately along the image edge and leaves the canvas size unchanged.',
      },
      {
        question: 'Why is everything saved as PNG?',
        answer:
          'Because PNG is the format here that keeps a transparent canvas see-through. A JPEG would fill the transparency with black, which the tool warns about rather than letting you discover it after downloading.',
      },
      {
        question: 'What is the percentage measured against?',
        answer:
          'The shorter side of the image. That means the same number produces the same visual proportion on a wide banner as on a tall portrait, instead of being tied to whichever axis happens to be longest.',
      },
    ],
  },
  {
    id: 'image-watermark',
    name: 'Image Watermark',
    description: 'Stamp a logo or signature across an image, with control over position, size and strength.',
    categories: ['image'],
    keywords: ['watermark', 'logo', 'stamp', 'copyright', 'brand', 'tiled'],
    icon: 'droplet',
    status: 'live',
    inputFormat: 'An image plus a PNG watermark',
    outputFormat: 'PNG with the watermark applied',
    processingMode: 'client',
    maxFileSize: '20 MB per image',
    addedAt: '2026-10-18',
    instructions: [
      'Choose the image you are protecting, then the watermark itself. A PNG with a transparent background is the right mark; a solid rectangle simply covers the picture.',
      'Pick one of six placements: a corner, dead centre, or tiled across the whole image.',
      'Set the mark width as a percentage of the image, and the opacity. The tool warns when the strength is high enough to cover the picture or low enough to vanish on a busy photo.',
      'Press Apply watermark and download the PNG. The image keeps its own pixel dimensions; only the watermark is added.',
    ],
    faqs: [
      {
        question: 'Does the watermark change the size of my image?',
        answer:
          'No. The exported PNG has exactly the width and height of the image you uploaded. The watermark is drawn on top at the size you set, measured as a percentage of the image width, so the same settings give the same result whatever the resolution.',
      },
      {
        question: 'Which placement should I choose?',
        answer:
          'A corner is the conventional choice: it proves authorship without covering the picture. Tiled repeats the mark across the whole image and is the hardest to crop out, but it is also the most intrusive. A centred mark sits over the subject, which looks deliberate but is easy to remove with a patch tool.',
      },
      {
        question: 'What does the opacity warning mean?',
        answer:
          'At 75% or above the mark covers the picture it is meant to label, and below about 8% it disappears against a busy photo. Both ranges are reported rather than silently applied. Roughly 20 to 40% is enough to see without spoiling the image.',
      },
      {
        question: 'Can I watermark with text instead of a logo?',
        answer:
          'Not in this tool. It stamps an image you supply, so the mark is exactly the artwork you drew rather than a font this site picked for you. Render your signature or logo to a transparent PNG first, then stamp it here.',
      },
    ],
  },
  {
    id: 'base64-to-image',
    name: 'Base64 to Image',
    description: 'Turn a pasted Base64 string back into an image file you can preview and download.',
    categories: ['conversion', 'image'],
    keywords: ['base64', 'decode', 'data url', 'image', 'restore'],
    icon: 'image',
    status: 'live',
    inputFormat: 'Base64 text, with or without a data: URL prefix',
    outputFormat: 'The decoded image file',
    processingMode: 'client',
    addedAt: '2026-10-18',
    instructions: [
      'Paste the Base64 text. A whole data: URL, including the “base64,” part, is accepted too.',
      'Press Decode. The tool reads the first bytes to work out which image format the data holds.',
      'Preview the result, check the byte count, and download it with the suggested file name.',
    ],
    faqs: [
      {
        question: 'How does the tool know which format to save as?',
        answer:
          'By reading the first bytes of the decoded data. PNG, JPEG, GIF and WebP are recognised from their signatures, and the suggested file name uses the matching extension. If the bytes are not one of those, the download is named .bin and the tool says so rather than inventing an extension.',
      },
      {
        question: 'What if I paste a whole data URL by mistake?',
        answer:
          'Nothing goes wrong. The tool strips the “data:image/png;base64,” prefix and decodes the payload. It reports the URL’s own MIME type separately when one is present, so a data URL claiming the wrong type is visible as such.',
      },
      {
        question: 'Is the decoded image uploaded anywhere?',
        answer:
          'No. Decoding happens in this browser tab, and the preview is a local blob URL. Nothing you paste is sent to a server, and closing the tab discards it.',
      },
      {
        question: 'Why is the decoded file smaller than the text I pasted?',
        answer:
          'Because Base64 spends four characters on every three bytes of data. The tool reports the decoded byte count so you can see the real size, and a round trip through this tool and its encoder reproduces the identical bytes.',
      },
    ],
  },
  {
    id: 'favicon-generator',
    name: 'Favicon Generator',
    description: 'Generate every favicon size a site needs from one image, plus the HTML tags and manifest.',
    categories: ['image', 'document'],
    keywords: ['favicon', 'icon', 'apple touch icon', 'manifest', 'pwa'],
    icon: 'sparkles',
    status: 'live',
    inputFormat: 'One square image, ideally 512 × 512 or larger',
    outputFormat: 'ZIP of PNG icons, the link tags and a web manifest',
    processingMode: 'client',
    maxFileSize: '20 MB',
    addedAt: '2026-10-18',
    instructions: [
      'Choose a square source image. A PNG, JPEG, WebP or SVG at 512 × 512 or larger gives the sharpest result.',
      'Enter the site name for the web app manifest, which is what a phone shows when the site is installed.',
      'Press Generate all icons and download the ZIP. It holds the icons, the HTML link tags, and the manifest.',
    ],
    faqs: [
      {
        question: 'Which sizes come out of the tool?',
        answer:
          '16, 32, 180, 192 and 512 pixels, all as PNG because every browser accepts it. The 180-pixel icon is the Apple touch icon, and 192 and 512 are the manifest sizes for installed phones.',
      },
      {
        question: 'Why does the tool refuse a small image?',
        answer:
          'Because upscaling produces a blurry icon, and a 128-pixel source stretched to 512 is worse than a missing icon. The tool says the source is too small and asks for a larger one rather than quietly generating five soft files.',
      },
      {
        question: 'Why is the Apple icon a solid square?',
        answer:
          'iOS masks the icon with its own rounded corners over a black background, so a transparent icon shows that black through. The tool fills the Apple icon with white and leaves the browser icons transparent, matching what each platform expects.',
      },
      {
        question: 'What do I do with the HTML snippet?',
        answer:
          'Paste the link tags from site.html-snippet.txt into the head of your pages, and upload the manifest and icons to your site root. The snippet already points at the filenames in the ZIP, so the paths line up if you keep that layout.',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* DEVELOPER — live                                                    */
  /* ------------------------------------------------------------------ */
  {
    id: 'html-formatter',
    name: 'HTML Formatter',
    description: 'Format and indent HTML markup so it is easy to read.',
    categories: ['developer'],
    keywords: ['html', 'beautify', 'indent', 'pretty print'],
    icon: 'code',
    status: 'live',
    inputFormat: 'HTML markup',
    outputFormat: 'Formatted or minified HTML',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your HTML markup into the input box.',
      'Choose Format to indent it, or Minify to strip the whitespace between tags.',
      'Copy or download the result; the stats show how the size changed.',
    ],
    faqs: [
      {
        question: 'Does minifying HTML break my <pre> or <script> blocks?',
        answer:
          'No. The minifier lifts <pre>, <textarea>, <script> and <style> blocks out before collapsing whitespace, then puts them back untouched. Text inside those elements keeps every space and line break.',
      },
      {
        question: 'Can the HTML Formatter fix invalid markup?',
        answer:
          'No. It only reformats the markup you give it — it does not validate, repair or restructure it. A tag that is not closed stays not closed; only the indentation and spacing change.',
      },
      {
        question: 'Is my HTML uploaded when I use this tool?',
        answer:
          'No. The HTML Formatter runs entirely in your browser, so the markup you paste never leaves your device.',
      },
      {
        question: 'Is the HTML Formatter free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your markup is never uploaded.',
  },
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    description: 'Format, beautify and minify CSS stylesheets.',
    categories: ['developer'],
    keywords: ['css', 'beautify', 'minify', 'indent'],
    icon: 'code',
    status: 'live',
    inputFormat: 'CSS',
    outputFormat: 'Formatted or minified CSS',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your CSS into the input box.',
      'Switch between Format and Minify — the output updates immediately.',
      'Copy or download the result, and check the size-change stat to see what minifying saved.',
    ],
    faqs: [
      {
        question: 'Does minifying CSS damage strings or content values?',
        answer:
          'No. The minifier tracks quoted strings and only collapses whitespace outside them, so a value like content: "a   b" keeps its inner spaces.',
      },
      {
        question: 'Does it understand nested CSS or preprocessor syntax?',
        answer:
          'It formats standard CSS, including nested rules, custom properties and at-rules. It does not compile Sass, Less or Stylus — paste plain CSS.',
      },
      {
        question: 'Is my CSS uploaded anywhere?',
        answer: 'No. Everything runs in your browser; your stylesheet never leaves your device.',
      },
      {
        question: 'Is the CSS Formatter free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your CSS is never uploaded.',
  },
  {
    id: 'javascript-formatter',
    name: 'JavaScript Formatter',
    description: 'Format and beautify JavaScript source code.',
    categories: ['developer'],
    keywords: ['javascript', 'beautify', 'format', 'js'],
    icon: 'code',
    status: 'live',
    inputFormat: 'JavaScript source',
    outputFormat: 'Formatted JavaScript',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your JavaScript into the input box.',
      'Choose Format to re-indent it, or Minify to strip comments and unnecessary whitespace.',
      'Copy or download the result.',
    ],
    faqs: [
      {
        question: 'Does the minifier rename my variables?',
        answer:
          'No. It only removes comments and collapses whitespace — it never renames variables, reorders code or changes behaviour. That is deliberately conservative so the output always does the same thing as the input.',
      },
      {
        question: 'Will it choke on a // inside a string or URL?',
        answer:
          'No. The comment stripper tracks string literals, template literals and regular-expression literals, so a // inside "https://example.com" is left alone.',
      },
      {
        question: 'Is my code uploaded when I use this tool?',
        answer:
          'No. The JavaScript Formatter runs entirely in your browser, so your source never leaves your device.',
      },
      {
        question: 'Is the JavaScript Formatter free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your code is never uploaded.',
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    description: 'Format SQL queries with consistent keywords, indentation and line breaks.',
    categories: ['developer'],
    keywords: ['sql', 'query', 'format', 'beautify'],
    icon: 'database',
    status: 'live',
    inputFormat: 'SQL query',
    outputFormat: 'Formatted SQL',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste your SQL query into the input box.',
      'Pick the SQL dialect that matches your database, then Format or Minify.',
      'Copy or download the result.',
    ],
    faqs: [
      {
        question: 'Which SQL dialects are supported?',
        answer:
          'The formatter supports standard SQL plus MySQL, MariaDB, PostgreSQL, SQLite, Transact-SQL, PL/SQL, BigQuery, Hive, Redshift, Spark and Snowflake. Pick the closest match to your database.',
      },
      {
        question: 'Does minifying SQL touch quoted identifiers or string values?',
        answer:
          'No. Quoted strings and quoted identifiers (like "my  column") are lifted out before whitespace is collapsed, so their inner spacing is preserved exactly.',
      },
      {
        question: 'Is my query uploaded anywhere?',
        answer: 'No. Everything runs in your browser, so your query never leaves your device.',
      },
      {
        question: 'Is the SQL Formatter free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your query is never uploaded.',
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions against sample text and inspect every match and group.',
    categories: ['developer'],
    keywords: ['regex', 'regular expression', 'match', 'pattern'],
    icon: 'search',
    status: 'live',
    inputFormat: 'Pattern and sample text',
    outputFormat: 'Matches and captured groups',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type your pattern and tick the flags you need (g, i, m, s, u, y).',
      'Paste the sample text to test against — matches are highlighted as you type.',
      'Open the match list to see each match, its index and its captured groups.',
    ],
    faqs: [
      {
        question: 'Which regex engine does this use?',
        answer:
          'It uses your browser’s native JavaScript RegExp engine, so the results are exactly what JavaScript will do at runtime — including the same syntax and the same limits.',
      },
      {
        question: 'Why does my pattern stop matching after a while?',
        answer:
          'To keep the page responsive, matching stops after 5,000 matches. If your pattern can match an empty string it is also capped so the loop cannot run forever.',
      },
      {
        question: 'Is my pattern or text sent anywhere?',
        answer:
          'No. The Regex Tester runs entirely in your browser, so your pattern and sample text never leave your device.',
      },
      {
        question: 'Is the Regex Tester free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your pattern and text are never uploaded.',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: "Decode a JSON Web Token's header and payload to inspect its claims and expiry.",
    categories: ['developer', 'security'],
    keywords: ['jwt', 'token', 'claims', 'decode', 'bearer'],
    icon: 'key',
    status: 'live',
    inputFormat: 'JSON Web Token',
    outputFormat: 'Decoded header and payload',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste a JSON Web Token into the input box.',
      'Read the decoded header and payload, with each standard claim explained in plain English.',
      'Check the expiry panel to see whether the token is still valid.',
    ],
    faqs: [
      {
        question: 'Does decoding a JWT verify that it is genuine?',
        answer:
          'No — and this is important. Decoding only reads the header and payload, which are base64url-encoded and not secret. It does not check the signature, so a decoded token is not proof that the token is valid or untampered. Always verify the signature on your server.',
      },
      {
        question: 'Can this tool be fooled by an "alg: none" token?',
        answer:
          'The tool displays whatever the header says, including alg: none, and flags it. That is exactly why you must never trust a client-side decode — signature verification is a server responsibility.',
      },
      {
        question: 'Is my token sent to a server?',
        answer:
          'No. Decoding happens entirely in your browser. That said, treat any token you paste into any web page with care — this tool never transmits it, but tokens are sensitive credentials.',
      },
      {
        question: 'Is the JWT Decoder free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote:
      'Runs entirely in your browser. Your token is never uploaded — but it is still a secret, so handle it carefully.',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes of text or files.',
    categories: ['developer', 'security'],
    keywords: ['hash', 'sha256', 'md5', 'sha1', 'checksum'],
    icon: 'hash',
    status: 'live',
    inputFormat: 'Text or a file',
    outputFormat: 'Hash values',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type or paste text, or drop in a file.',
      'Every supported hash (MD5, SHA-1, SHA-256, SHA-512) is calculated at once.',
      'Copy any value, or paste a checksum to compare it against the calculated hash.',
    ],
    faqs: [
      {
        question: 'How is MD5 calculated if the browser has no MD5 support?',
        answer:
          'MD5 is implemented from scratch following RFC 1321, so it works in every browser. SHA-1, SHA-256 and SHA-512 use the browser’s built-in Web Crypto API.',
      },
      {
        question: 'Should I use MD5 or SHA-1 to protect passwords?',
        answer:
          'No. MD5 and SHA-1 are cryptographically broken and far too fast for password storage. Use them only for checksums and integrity checks. For passwords, use a slow, salted algorithm such as bcrypt, scrypt or Argon2.',
      },
      {
        question: 'Is my text or file uploaded to hash it?',
        answer:
          'No. Hashing runs entirely in your browser, so your text or file never leaves your device — even large files are read locally.',
      },
      {
        question: 'Is the Hash Generator free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text and files are never uploaded.',
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colours between HEX, RGB, HSL and other common colour formats.',
    categories: ['developer', 'color'],
    keywords: ['hex', 'rgb', 'hsl', 'colour converter'],
    icon: 'palette',
    status: 'live',
    inputFormat: 'Colour value',
    outputFormat: 'Converted colour values',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter a colour as HEX, RGB, RGBA, HSL, HSLA or a CSS colour name.',
      'Every other format is calculated at once, with a live swatch.',
      'Copy the value you need, or check the contrast panel to see the ratio against white and black.',
    ],
    faqs: [
      {
        question: 'Which colour formats are accepted?',
        answer:
          'HEX (3, 4, 6 and 8 digits), rgb(), rgba(), hsl(), hsla() and the standard CSS colour names such as rebeccapurple or tomato.',
      },
      {
        question: 'What does the contrast ratio mean?',
        answer:
          'It is the WCAG contrast ratio between your colour and a background. A ratio of 4.5:1 or higher passes WCAG AA for normal text, and 7:1 passes AAA. The tool tells you which threshold your colour clears.',
      },
      {
        question: 'Is anything sent to a server?',
        answer: 'No. All colour maths runs in your browser.',
      },
      {
        question: 'Is the Color Converter free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser.',
  },
  {
    id: 'cron-expression-helper',
    name: 'Cron Expression Helper',
    description: 'Translate a cron expression into plain English and preview its next run times.',
    categories: ['developer'],
    keywords: ['cron', 'schedule', 'expression', 'crontab'],
    icon: 'clock',
    status: 'live',
    inputFormat: 'Cron expression',
    outputFormat: 'Explanation and next run times',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type a cron expression, or start from one of the common presets.',
      'Read the plain-English description and the per-field breakdown.',
      'Check the next-run list to confirm the schedule fires when you expect.',
    ],
    faqs: [
      {
        question: 'Does the cron syntax use 5 fields or 6?',
        answer:
          'Both are accepted. A standard expression has five fields (minute, hour, day of month, month, day of week); an optional sixth leading field adds seconds.',
      },
      {
        question: 'Which timezone are the next-run times in?',
        answer:
          'Times are calculated in your browser’s local timezone. The list shows the local date and time, so what you see is what your own machine would do.',
      },
      {
        question: 'Is my expression sent anywhere?',
        answer: 'No. Parsing and the next-run calculation both run in your browser.',
      },
      {
        question: 'Is the Cron Expression Helper free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser.',
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    description: 'Compare two texts side by side and highlight every addition and removal.',
    categories: ['developer', 'text'],
    keywords: ['diff', 'compare', 'merge', 'changes'],
    icon: 'diff',
    status: 'live',
    inputFormat: 'Two blocks of text',
    outputFormat: 'Highlighted differences',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the original text on the left and the changed text on the right, or drop in two files.',
      'Choose a view — side by side, unified or inline — and toggle whether whitespace matters.',
      'Download the result as a .diff file if you need to share it.',
    ],
    faqs: [
      {
        question: 'How large a comparison can it handle?',
        answer:
          'It compares up to 3,000 lines per side. Above that the tool says so rather than freezing your browser, because the line-diff algorithm gets slow on very large inputs.',
      },
      {
        question: 'How does it decide what changed?',
        answer:
          'It runs a line-by-line longest-common-subsequence diff, which finds the smallest set of added and removed lines that turns one text into the other — the same idea as git diff.',
      },
      {
        question: 'Is my text uploaded?',
        answer: 'No. The comparison runs entirely in your browser, so neither text leaves your device.',
      },
      {
        question: 'Is the Diff Checker free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Both texts stay on your device.',
  },
  {
    id: 'html-entity-encoder',
    name: 'HTML Entity Encoder & Decoder',
    description: 'Encode special characters as HTML entities and decode entities back to text.',
    categories: ['developer'],
    keywords: ['html entities', 'escape', 'unescape', 'ampersand'],
    icon: 'code',
    status: 'live',
    inputFormat: 'Text or HTML entities',
    outputFormat: 'Encoded or decoded text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste text to encode, or paste HTML entities to decode.',
      'Pick the encoding level — minimal, named, numeric or encode-everything.',
      'Copy the result; the stats show how many characters were converted.',
    ],
    faqs: [
      {
        question: 'What is the difference between the encoding levels?',
        answer:
          'Minimal encodes only the characters that are unsafe in HTML (&, <, >, " and \'). Named uses friendly entities like &copy; where one exists. Numeric uses &#NNN; everywhere. Encode-everything turns every character into a numeric entity.',
      },
      {
        question: 'Does decoding handle both &#169; and &#xA9;?',
        answer:
          'Yes. Decoding understands named entities, decimal numeric entities and hexadecimal numeric entities in both upper and lower case.',
      },
      {
        question: 'Is my text sent to a server?',
        answer: 'No. Encoding and decoding both run in your browser.',
      },
      {
        question: 'Is the HTML Entity Encoder free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your text is never uploaded.',
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder Lorem Ipsum text by words, sentences or paragraphs.',
    categories: ['developer', 'text'],
    keywords: ['lorem ipsum', 'placeholder', 'dummy text', 'filler'],
    icon: 'pilcrow',
    status: 'live',
    inputFormat: 'Options',
    outputFormat: 'Placeholder text',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Choose whether you want words, sentences or paragraphs.',
      'Set how many you need and whether to start with the classic "Lorem ipsum dolor sit amet…" opening.',
      'Copy or download the generated text.',
    ],
    faqs: [
      {
        question: 'Is the output real Latin?',
        answer:
          'It is the traditional Lorem Ipsum placeholder text, which is scrambled Latin and deliberately meaningless. It is meant to fill space, not to be read.',
      },
      {
        question: 'Will I get the same text every time?',
        answer:
          'No. Each generation is randomised, so pressing Generate again gives you different placeholder text at the same length.',
      },
      {
        question: 'Is the generator doing anything online?',
        answer: 'No. The words are generated locally in your browser.',
      },
      {
        question: 'Is the Lorem Ipsum Generator free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser.',
  },
  {
    id: 'api-request-tester',
    name: 'API Request Tester',
    description: 'Send an HTTP request from your browser and inspect the status, headers and response body.',
    categories: ['developer'],
    keywords: ['api', 'http', 'request', 'rest', 'client'],
    icon: 'globe',
    status: 'live',
    inputFormat: 'Request URL, method, headers and body',
    outputFormat: 'HTTP response',
    processingMode: 'network',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the request URL and choose an HTTP method.',
      'Add any headers and a body, then press Send.',
      'Read the status, timing, size, headers and response body in the result panel.',
    ],
    faqs: [
      {
        question: 'Why does a request fail with a CORS error?',
        answer:
          'Because the request is made by your browser, the target server must send an Access-Control-Allow-Origin header for this page. If it does not, the browser blocks the response and there is no way around it from a website. TOOLZEN does not proxy requests, so the tool reports this honestly instead of pretending to succeed.',
      },
      {
        question: 'Does this tool send my cookies or log me in?',
        answer:
          'No. Requests are sent with credentials set to "omit", so your cookies are never attached and the tool never acts as you.',
      },
      {
        question: 'Can I test a private or localhost address?',
        answer:
          'Requests go directly from your browser to the URL you enter. A private or internal address will usually fail the same way a CORS block does, and the tool explains that when it happens.',
      },
      {
        question: 'Is the API Request Tester free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote:
      'Requests go directly from your browser to the URL you enter — there is no TOOLZEN server in between, and cookies are never sent.',
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor',
    description: 'Write Markdown with a live preview and export the result.',
    categories: ['developer', 'document'],
    keywords: ['markdown', 'editor', 'preview', 'export'],
    icon: 'book-open',
    status: 'live',
    inputFormat: 'Markdown text',
    outputFormat: 'Rendered preview and exported file',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Write Markdown in the editor, or use the toolbar for bold, lists, links and tables.',
      'Switch between Split, Editor and Preview views.',
      'Export the result as a .md or .html file when you are done.',
    ],
    faqs: [
      {
        question: 'Is the preview safe to render?',
        answer:
          'Yes. The rendered HTML is passed through DOMPurify, which strips scripts and other dangerous markup, so a pasted snippet cannot run code in the page.',
      },
      {
        question: 'Which Markdown features are supported?',
        answer:
          'It supports standard Markdown plus tables, fenced code blocks, task lists and blockquotes — the same feature set used by GitHub-flavoured Markdown.',
      },
      {
        question: 'Is my document uploaded?',
        answer: 'No. Writing, previewing and exporting all happen in your browser.',
      },
      {
        question: 'Is the Markdown Editor free?',
        answer: 'Yes. It is completely free, needs no account, and has no usage limit.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Your document is never uploaded.',
  },

  /* ------------------------------------------------------------------ */
  /* CYBERSECURITY — live                                                */
  /* ------------------------------------------------------------------ */
  {
    id: 'password-strength-estimator',
    name: 'Password Strength Estimator',
    description:
      'Estimate how long a password would take to crack and get concrete advice on making it stronger.',
    categories: ['security'],
    keywords: ['password strength', 'entropy', 'crack time', 'passphrase'],
    icon: 'gauge',
    status: 'live',
    inputFormat: 'Password',
    outputFormat: 'Strength estimate and advice',
    processingMode: 'client',
    addedAt: '2026-10-17',
    privacyNote: 'Evaluated entirely in your browser. The password is never transmitted or stored.',
    instructions: [
      'Type or paste the password you want to test. It never leaves the page.',
      'Read the entropy figure, then the crack-time estimates for each attack scenario.',
      'Work through the suggestions — length matters more than symbol substitution.',
      'For a long passphrase, switch the mode to passphrase and compare the entropy.',
    ],
    faqs: [
      {
        question: 'Is it safe to type my real password here?',
        answer:
          'The password is analysed in this tab and is never sent to a server, written to storage or logged. That said, the safest habit is to test a password with the same pattern as your real one, not the real one itself.',
      },
      {
        question: 'How is the crack time calculated?',
        answer:
          'The tool estimates the size of the character set in use, raises it to the length to get the number of possible passwords, then divides by a guesses-per-second figure for each scenario — an online form with rate limiting, a fast offline attack on a slow hash, and a GPU attack on a fast hash. These are order-of-magnitude estimates, not measurements.',
      },
      {
        question: 'Why is a long passphrase stronger than a short complex password?',
        answer:
          'Because length multiplies the search space, while symbol substitution only adds a small constant per character — and humans substitute predictably. A four-word passphrase from a large list usually beats eight random characters with symbols.',
      },
      {
        question: 'Does a common password get flagged even with digits on the end?',
        answer:
          'Yes. The checker strips trailing digits and symbols before comparing against a list of the most common passwords, so "password123!" is still recognised as a weak base.',
      },
    ],
  },
  {
    id: 'secure-password-generator',
    name: 'Secure Password Generator',
    description: 'Generate strong random passwords using the character rules you choose.',
    categories: ['security'],
    keywords: ['password generator', 'random', 'strong password', 'passphrase'],
    icon: 'key',
    status: 'live',
    inputFormat: 'Options',
    outputFormat: 'Generated passwords',
    processingMode: 'client',
    addedAt: '2026-10-17',
    privacyNote: 'Generated locally using the browser cryptography API. Nothing is sent anywhere.',
    instructions: [
      'Choose a length. Sixteen characters is a sensible default; longer is always better.',
      'Toggle the character sets you need. If a site rejects symbols, turn them off rather than shortening the password.',
      'Press Generate. Every result comes from crypto.getRandomValues, not Math.random.',
      'For something you have to type by hand, switch to passphrase mode and pick a word count.',
    ],
    faqs: [
      {
        question: 'How random are these passwords?',
        answer:
          "They come from crypto.getRandomValues, the browser's cryptographically secure random number generator. There is no seeded pseudo-random fallback and no pattern reused between generations.",
      },
      {
        question: 'Are the passwords stored or transmitted?',
        answer:
          'No. Generation happens in this tab. Nothing is written to local storage, sent to a server or included in a URL.',
      },
      {
        question: 'What is passphrase mode?',
        answer:
          'It builds a password from randomly chosen words from a fixed list, joined by a separator. A five-word passphrase is easier to remember than a random string of the same strength, which makes it practical for the one password you type often.',
      },
      {
        question: 'Which mode should I use?',
        answer:
          'Use random characters for anything a password manager will fill in. Use a passphrase for the master password of the manager itself, or for a device login you have to type by hand.',
      },
    ],
  },
  {
    id: 'sha256-file-hash',
    name: 'File Hash Calculator',
    description: 'Compute SHA-256 and other hashes of a file so you can verify its integrity.',
    categories: ['security'],
    keywords: ['sha256', 'file hash', 'checksum', 'integrity', 'verify'],
    icon: 'hash',
    status: 'live',
    inputFormat: 'Any file',
    outputFormat: 'Hash values',
    processingMode: 'client',
    maxFileSize: '200 MB per file',
    addedAt: '2026-10-17',
    privacyNote: 'The file is read in your browser and never uploaded.',
    instructions: [
      'Drop a file onto the panel, or click to browse.',
      'Every supported digest is computed at once: MD5, SHA-1, SHA-256, SHA-384 and SHA-512.',
      'Copy the value you need with the button next to it.',
      'Paste a published checksum into the compare box to see whether it matches.',
    ],
    faqs: [
      {
        question: 'Is the file uploaded anywhere?',
        answer:
          'No. The browser reads the file locally and computes the digest in memory. Nothing is transmitted, and closing the tab discards everything.',
      },
      {
        question: 'Which hash should I use?',
        answer:
          'SHA-256 for almost everything. MD5 and SHA-1 are offered because download pages still publish them, but both are broken for security purposes — treat them as checksums against accidental corruption only, never as proof that a file is authentic.',
      },
      {
        question: 'How large a file can it handle?',
        answer:
          'Up to about 200 MB comfortably. Beyond that the browser has to hold the whole file in memory, which can stall a tab. Very large files are better hashed with a command-line tool such as sha256sum.',
      },
      {
        question: 'Why do two hashes of the same file sometimes differ?',
        answer:
          'If the files differ by even one byte — including line endings or metadata that a download changed — the digest is completely different. That is the point of a hash.',
      },
    ],
  },
  {
    id: 'file-integrity-verification',
    name: 'File Integrity Verification',
    description: "Compare a downloaded file's hash with a published value to confirm it is unchanged.",
    categories: ['security'],
    keywords: ['integrity', 'verify download', 'checksum', 'tamper'],
    icon: 'shield',
    status: 'live',
    inputFormat: 'File and expected hash',
    processingMode: 'client',
    outputFormat: 'Match or mismatch result',
    maxFileSize: '200 MB per file',
    addedAt: '2026-10-17',
    privacyNote: 'The file is read in your browser and never uploaded.',
    instructions: [
      'Paste the published checksum — a bare hash, or a whole sha256sum listing with filenames.',
      'Drop the downloaded file onto the panel.',
      'The tool guesses the algorithm from the hash length and computes only that digest.',
      'A green match means the bytes are identical. A mismatch means the file is not the one that checksum describes.',
    ],
    faqs: [
      {
        question: 'What does a mismatch actually mean?',
        answer:
          'The file you have is not byte-for-byte the file the checksum was published for. That could be a corrupted download, a different version, or a tampered file. Re-download from the official source before assuming the worst — but do not install it until the hashes agree.',
      },
      {
        question: 'Does a match prove the file is safe?',
        answer:
          'No. It proves the file matches the checksum. If an attacker controlled both the download and the checksum page, both would agree. A match only means something when you trust the source of the checksum independently — for example, a signature you verified, or a page served over HTTPS from the vendor.',
      },
      {
        question: 'Which algorithms are recognised?',
        answer:
          'MD5 (32 hex characters), SHA-1 (40), SHA-256 (64), SHA-384 (96) and SHA-512 (128). The length decides which one runs, so a pasted hash is never silently compared against the wrong digest.',
      },
      {
        question: 'Can it check several files at once?',
        answer:
          'The parser reads a whole checksum listing, but verification runs one file at a time — the panel shows the expected checksum for each line so you can match them up.',
      },
    ],
  },
  {
    id: 'security-headers-checker',
    name: 'Security Headers Checker',
    description:
      'Check which HTTP security headers a website returns and what each one protects against.',
    categories: ['security'],
    keywords: ['security headers', 'csp', 'hsts', 'x-frame-options'],
    icon: 'shield',
    status: 'live',
    inputFormat: 'Pasted headers, or a URL',
    outputFormat: 'Header report and recommendations',
    processingMode: 'network',
    addedAt: '2026-10-17',
    privacyNote:
      'Nothing is proxied. Pasted headers stay in your browser; a live check is a direct request from your browser to the site you name.',
    instructions: [
      "Run curl -sSI https://example.com in a terminal, or copy the response headers from your browser's Network panel.",
      'Paste them into the Headers box. The audit runs as you type.',
      'Read the findings in order — missing and failing headers come first, each with the value that was found and a specific fix.',
      'Copy the Markdown report into a ticket or a pull request.',
    ],
    faqs: [
      {
        question: 'Why does the live check show almost no headers?',
        answer:
          'Cross-origin JavaScript only sees a short safelist of response headers unless the server sends Access-Control-Expose-Headers. HSTS and Content-Security-Policy are never exposed, so a live check cannot audit them. The Paste tab reads the complete set, which is why it is the primary mode.',
      },
      {
        question: 'How is the score calculated?',
        answer:
          'Each graded header carries a weight. A correct value earns full weight, a present-but-weak value earns half, and a missing header earns nothing. The score is the share of available weight earned, out of 100. X-XSS-Protection is informational and carries no weight because the browser feature it controlled has been removed.',
      },
      {
        question: 'Does a good score mean the site is secure?',
        answer:
          'No. Headers are one layer. A site can send a perfect CSP and still have an authentication bug. The report says this explicitly rather than presenting a number as a verdict.',
      },
      {
        question: 'Why does the tool recommend removing X-XSS-Protection?',
        answer:
          'Modern browsers removed their XSS auditor because it introduced its own vulnerabilities. Setting the header to 1 re-enables a removed feature in older browsers; the recommended value is 0, or no header at all.',
      },
    ],
  },
  {
    id: 'ssl-certificate-info',
    name: 'SSL Certificate Information',
    description: "Inspect a site's TLS certificate: issuer, validity dates, subject and chain.",
    categories: ['security'],
    keywords: ['ssl', 'tls', 'certificate', 'https', 'expiry'],
    icon: 'lock',
    status: 'live',
    inputFormat: 'Domain name',
    outputFormat: 'Certificate details',
    processingMode: 'network',
    addedAt: '2026-10-17',
    privacyNote:
      'The lookup goes from your browser straight to crt.sh, a public Certificate Transparency search service. TOOLZEN does not proxy it.',
    instructions: [
      'Enter a domain and press Search certificates.',
      'Leave "Include subdomains" on unless the domain has thousands of names — the exact-name query is much faster.',
      'Read the issuer, validity window and status for each certificate, newest expiry first.',
      'Copy the CSV or the list of covered names if you need them elsewhere.',
    ],
    faqs: [
      {
        question: 'Is this the certificate the site is serving right now?',
        answer:
          "Not necessarily. crt.sh reports certificates that a public CA has logged as issued, which includes certificates that were never deployed and ones since revoked. For the live chain, use your browser's padlock panel or openssl s_client.",
      },
      {
        question: 'Why are there so many certificates for one domain?',
        answer:
          'Certificate lifetimes are now short, and services like Cloudflare reissue automatically, so a busy domain accumulates dozens of entries per year. The tool deduplicates entries that appear in several logs.',
      },
      {
        question: 'Why does the lookup sometimes time out?',
        answer:
          'crt.sh is a free public service and can be slow for domains with large subdomain trees. Turn off subdomain matching, or try again in a moment.',
      },
      {
        question: 'Can it see certificates from an internal CA?',
        answer:
          'No. Certificate Transparency only records certificates from CAs that participate in public logs. A private or internal CA will not appear.',
      },
    ],
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup',
    description: 'Look up A, AAAA, MX, TXT, CNAME and NS records for a domain.',
    categories: ['security'],
    keywords: ['dns', 'records', 'mx', 'txt', 'nameserver', 'lookup'],
    icon: 'globe',
    status: 'live',
    inputFormat: 'Domain name',
    outputFormat: 'DNS records',
    processingMode: 'network',
    addedAt: '2026-10-17',
    privacyNote:
      'Queries go from your browser directly to a public DNS-over-HTTPS resolver (Google or Cloudflare) that you choose. Nothing passes through TOOLZEN.',
    instructions: [
      'Enter a domain name. A pasted URL is reduced to its hostname automatically.',
      'Pick a record type, or press "Look up all common records" to fetch A, AAAA, CNAME, MX, TXT, NS and CAA at once.',
      'TXT records are labelled when they are SPF, DMARC, DKIM or a known site-verification record.',
      'Copy the results as zone-file lines or as raw JSON.',
    ],
    faqs: [
      {
        question: 'Which resolver answers the query?',
        answer:
          "Whichever you select — Google Public DNS or Cloudflare 1.1.1.1. Both publish a JSON API with CORS enabled, which is what makes a browser-only lookup possible. Their privacy policies apply to the query, not TOOLZEN's.",
      },
      {
        question: 'Why is a record I just changed still showing the old value?',
        answer:
          "Resolvers cache answers for the record's TTL. A change is not visible everywhere until that TTL expires, which can be anywhere from a minute to a day.",
      },
      {
        question: 'Why does it refuse private addresses?',
        answer:
          'Loopback, link-local and RFC 1918 addresses are rejected. A public resolver has no useful answer for them, and refusing keeps the tool from being used to probe internal networks.',
      },
      {
        question: 'Does this show what my own network resolves?',
        answer:
          'No. It shows what the chosen public resolver returns. Your ISP, a corporate DNS filter or a hosts file can give a different answer for the same name.',
      },
    ],
  },
  {
    id: 'http-header-viewer',
    name: 'HTTP Header Viewer',
    description: 'View the HTTP response headers and status a URL returns.',
    categories: ['security'],
    keywords: ['http headers', 'response', 'status code', 'redirect'],
    icon: 'activity',
    status: 'live',
    inputFormat: 'Website URL or pasted headers',
    outputFormat: 'HTTP response headers',
    processingMode: 'network',
    addedAt: '2026-10-17',
    privacyNote:
      'The request is made by your browser, with credentials omitted. Nothing is relayed through a TOOLZEN server.',
    instructions: [
      'Enter a URL and press Fetch headers, or switch to Paste and drop in curl -sSI output.',
      'Read the status, round-trip time and whether the request was redirected.',
      'Group headers by purpose, or switch to Raw or JSON for the exact bytes.',
      'Copy the result as JSON, or as a curl command that reproduces the request.',
    ],
    faqs: [
      {
        question: 'Why are most headers missing on some sites?',
        answer:
          'CORS. A browser only exposes a short safelist of response headers to cross-origin JavaScript unless the server sends Access-Control-Expose-Headers. Sites that do not opt in will show only content-type, content-length, cache-control and a few others. The Paste tab avoids this entirely.',
      },
      {
        question: 'Does it send my cookies?',
        answer:
          'No. Requests use credentials: "omit", so no cookies or HTTP authentication are attached. You are never signed in as yourself to the target site.',
      },
      {
        question: 'What does a HEAD request change?',
        answer:
          'HEAD asks for the headers without the body, which is faster and cannot trigger a download. Some servers reject HEAD with 405, in which case the tool retries with GET and discards the body.',
      },
      {
        question: 'Can I see request headers?',
        answer:
          'No. A browser does not expose the request headers it sent, and many are set by the browser itself. Use your developer tools Network panel for those.',
      },
    ],
  },
  {
    id: 'cybersecurity-checklist-generator',
    name: 'Cybersecurity Checklist Generator',
    description:
      'Build a tailored security checklist for a project, team or personal setup and export it.',
    categories: ['security'],
    keywords: ['checklist', 'hardening', 'best practices', 'audit'],
    icon: 'check-square',
    status: 'live',
    inputFormat: 'Options',
    outputFormat: 'Security checklist',
    processingMode: 'client',
    addedAt: '2026-10-17',
    privacyNote: 'Runs entirely in your browser. Your selections and ticks are never sent anywhere.',
    instructions: [
      'Pick the context that fits: personal, small business or developer.',
      'Turn priority bands on or off. Start with Essential if you are new to this.',
      'Tick items as you complete them — the progress bar is local to this page.',
      'Copy the result as Markdown for a wiki, or CSV for a spreadsheet.',
    ],
    faqs: [
      {
        question: 'Where does the advice come from?',
        answer:
          'The items are hand-written, drawing on widely published baseline guidance from CISA, the NCSC and OWASP. Each item states what it protects against, so you can judge whether it applies to you rather than taking it on faith.',
      },
      {
        question: 'Are my ticks saved?',
        answer:
          'No. Nothing is stored, so reloading the page clears the checkboxes. Copy the Markdown or CSV before you leave if you want to keep the state.',
      },
      {
        question: 'Is this a compliance certification?',
        answer:
          'No. It is general guidance, not an audit against any standard. It cannot know your threat model, your regulatory obligations or your existing controls.',
      },
      {
        question: 'Why are some items missing for my context?',
        answer:
          'Items are filtered to the context you choose — a personal checklist does not include breach-notification duties, and the developer checklist adds application-security items a home user does not need.',
      },
    ],
  },
  {
    id: 'security-awareness-resources',
    name: 'Security Awareness Resources',
    description: 'Curated, plain-language guidance on staying safe online, with links to official sources.',
    categories: ['security'],
    keywords: ['awareness', 'phishing', 'training', 'guidance', 'learn'],
    icon: 'book-open',
    status: 'live',
    inputFormat: 'None',
    outputFormat: 'Reference material',
    processingMode: 'client',
    addedAt: '2026-10-17',
    privacyNote: 'A static reading list. Nothing is tracked, and no link is an affiliate link.',
    instructions: [
      'Filter the reading list by topic or audience, or search for a keyword.',
      "Every link opens the publisher's own site in a new tab.",
      'Work through the six-message phishing exercise and decide which are genuine.',
      'Reveal the explanations to see the specific tells in each message.',
    ],
    faqs: [
      {
        question: 'Who chose these links?',
        answer:
          'They are a hand-picked set from government and non-profit publishers — CISA, the NCSC, the FTC, NIST, OWASP, the EFF and a few well-known community projects. There are no sponsored links and no trackers.',
      },
      {
        question: 'Is the phishing quiz realistic?',
        answer:
          'The messages are written for training, with the tells deliberately visible so they can be discussed. Real phishing is often cleaner — the point is to practise the habit of checking the sender domain and the link destination, not to memorise these examples.',
      },
      {
        question: 'Why is one of the examples genuine?',
        answer:
          'Because a quiz where everything is phishing teaches you to flag everything. Recognising an ordinary message is part of the skill, and the genuine example still comes with a note on what to check anyway.',
      },
      {
        question: 'Can I use this for staff training?',
        answer:
          "Yes — copy the Markdown or print the page. It is general awareness material, not a substitute for training specific to your organisation's systems and procedures.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* CALCULATORS — live                                               */
  /* ------------------------------------------------------------------ */
  {
    id: 'percentage-calculator',
    name: 'Percentage Calculator',
    description: 'Work out percentages, percentage change and "what percent of" in either direction.',
    categories: ['calculator'],
    keywords: ['percentage', 'percent', 'increase', 'decrease'],
    icon: 'percent',
    status: 'live',
    inputFormat: 'Numbers',
    outputFormat: 'Calculated result',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Pick which of the three questions you are asking: X% of Y, X is what percent of Y, or the change from X to Y.',
      'Type the two numbers. Decimals and negative values are both accepted.',
      'Read the answer, the sentence in words, and the formula — all three are shown so you can check the working.',
      'Division by zero is refused rather than answered with infinity, and a percentage change from zero is explained as undefined.',
    ],
    faqs: [
      {
        question: 'Why does a percentage change from a negative number use its magnitude?',
        answer:
          'Going from −200 to −100 is a rise, not a fall, even though the second number is larger in absolute terms. Dividing by the magnitude of the starting value keeps the sign of the answer pointing the right way: +50%.',
      },
      {
        question: 'Is 20% then 10% the same as 30% off?',
        answer:
          'No — that is 28% off, because the second discount applies to the already-reduced price. Use the Discount Calculator if you need to stack offers.',
      },
      {
        question: 'How many decimal places are shown?',
        answer:
          'Results are rounded to four decimal places for display. No rounding happens before the division, so the answer is as accurate as the inputs allow.',
      },
      {
        question: 'Does the tool send my numbers anywhere?',
        answer:
          'No. The arithmetic runs in your browser and nothing is uploaded, logged or stored. You can disconnect from the internet and it will still work.',
      },
    ],
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate exact age in years, months, weeks and days from a date of birth.',
    categories: ['calculator'],
    keywords: ['age', 'date of birth', 'birthday', 'years old'],
    icon: 'calendar',
    status: 'live',
    inputFormat: 'Date of birth',
    outputFormat: 'Age breakdown',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the date of birth. The default reference date is today, but you can change it to any date.',
      'Read the age in years, months and days — counted on the calendar, not by dividing days by 30.',
      'Check the totals: whole days lived, whole weeks, whole hours and whole months.',
      'The next-birthday panel counts down the days. A 29 February birthday falls on 28 February in a non-leap year.',
    ],
    faqs: [
      {
        question: 'Why is 31 January to 1 March reported as 1 month and 1 day?',
        answer:
          'Because months have different lengths. The leftover days are measured from the clamped month anniversary — 31 January plus one month is 28 February, and one more day takes you to 1 March.',
      },
      {
        question: 'I was born on 29 February. When is my birthday?',
        answer:
          'In a non-leap year it falls on 28 February, which is the convention most legal systems use. In a leap year it is the real 29 February.',
      },
      {
        question: 'Does the time of day matter?',
        answer:
          'No. Dates are read in your own timezone and the time of day is ignored, so the count never shifts by a day because of the clock.',
      },
      {
        question: 'Can I work out the age of something other than a person?',
        answer:
          'Yes. Any two dates work — a company, a building, a warranty. Nothing here is specific to people.',
      },
    ],
  },
  {
    id: 'date-difference-calculator',
    name: 'Date Difference Calculator',
    description: 'Find the number of days, weeks, months and years between two dates.',
    categories: ['calculator'],
    keywords: ['date difference', 'days between', 'duration'],
    icon: 'calendar',
    status: 'live',
    inputFormat: 'Two dates',
    outputFormat: 'Difference between dates',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the start and end date. The end date is counted and the start date is not — the convention used by payment terms and delivery estimates.',
      'Read the calendar breakdown in years, months and days, and the exact total in days and whole weeks.',
      'Check the weekday count: Monday to Friday days and weekend days, which add up to the total.',
      'Use the weekday panel to add or subtract working days from the start date, skipping Saturdays and Sundays.',
    ],
    faqs: [
      {
        question: 'Why is the count one day less than I expected?',
        answer:
          'The start date is excluded. From Monday to the following Monday is 7 days, not 8 — the same way a 30-day notice period starting on the 1st ends on the 31st.',
      },
      {
        question: 'Are public holidays taken out of the weekday count?',
        answer:
          'No. Only Saturdays and Sundays are excluded, because public holidays differ by country, state and year. Check those against your own calendar.',
      },
      {
        question: 'Why does the tool say months and years are approximate?',
        answer:
          'Converting days to months needs an average — 30.436875 days — and a 30-day answer is not the same as one month. The calendar breakdown above the conversion is exact.',
      },
      {
        question: 'What if the second date is earlier than the first?',
        answer:
          'The tool swaps them, reports the size of the gap, and says plainly that the range was reversed rather than showing a negative number of days.',
      },
    ],
  },
  {
    id: 'time-duration-calculator',
    name: 'Time Duration Calculator',
    description: 'Add or subtract hours and minutes, and find the duration between two times.',
    categories: ['calculator'],
    keywords: ['time duration', 'hours', 'minutes', 'timesheet'],
    icon: 'clock',
    status: 'live',
    inputFormat: 'Two times or a duration',
    outputFormat: 'Calculated duration',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Type a duration the way you would say it: 2h 30m, 90m, 1.5h, 1 hour 30 minutes or 02:30:45.',
      'Read the same duration in seconds, minutes, hours, days and weeks.',
      'Enter a start time to see when the duration ends, including the day roll when it crosses midnight.',
      'Enter how many items fit in the duration to get a per-item, per-hour and per-minute rate.',
    ],
    faqs: [
      {
        question: 'Why is a bare number like 90 refused?',
        answer:
          'Because 90 could mean 90 seconds, 90 minutes or 90 hours. Guessing would silently give you the wrong answer, so the tool asks you to add a unit instead.',
      },
      {
        question: 'Why is 1:30 refused too?',
        answer:
          'It could be 1 hour 30 minutes or 1 minute 30 seconds. Write 1h 30m, or use the full 01:30:00 form, and there is no ambiguity.',
      },
      {
        question: 'What happens when the end time crosses midnight?',
        answer:
          'The clock time is shown with the number of days rolled, such as 00:00 (+1 day). Seconds are kept in the label when the shift is not a whole number of minutes.',
      },
      {
        question: 'Can I subtract a duration as well as add it?',
        answer:
          'Yes. The same panel shows the start time with the duration taken off, which is useful for working out when something began.',
      },
    ],
  },
  {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    description: 'Calculate body mass index from height and weight, with the standard category ranges.',
    categories: ['calculator'],
    keywords: ['bmi', 'body mass index', 'health', 'weight'],
    icon: 'heart',
    status: 'live',
    inputFormat: 'Height and weight',
    outputFormat: 'BMI value and category',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Choose centimetres and kilograms, or feet, inches and pounds.',
      'Enter your weight and height. The BMI is weight in kilograms divided by height in metres squared.',
      'Read the band, the healthy weight range for your height, and where you sit on the scale.',
      'Add your age, sex and activity level for resting metabolism and daily calorie targets — or use lean body mass instead.',
    ],
    faqs: [
      {
        question: 'Is BMI accurate?',
        answer:
          'It is a screening measure, not a diagnosis. It takes no account of muscle mass, frame size, age, pregnancy or where fat sits on the body, so an athlete can score as overweight while carrying very little fat.',
      },
      {
        question: 'Which calorie figures should I use?',
        answer:
          'The maintenance figure is BMR multiplied by your activity level. The targets either side of it use the 7,700 kcal-per-kilogram rule of thumb for weekly change, which is an average and not a promise.',
      },
      {
        question: 'Do the BMI cut-offs apply to everyone?',
        answer:
          'No. UK NICE guidance sets lower thresholds for adults of Black African, African-Caribbean, South Asian, Chinese and other Asian descent: 23 for overweight and 27.5 for obesity. The page says so.',
      },
      {
        question: 'Where does the metabolic rate formula come from?',
        answer:
          'Mifflin–St Jeor, the equation most guidelines now prefer, or Katch–McArdle if you know your lean body mass. Both are shown with the working.',
      },
    ],
  },
  {
    id: 'emi-calculator',
    name: 'EMI Calculator',
    description: 'Estimate the monthly instalment, total interest and total payment for a loan.',
    categories: ['calculator'],
    keywords: ['emi', 'loan', 'instalment', 'mortgage', 'interest'],
    icon: 'banknote',
    status: 'live',
    inputFormat: 'Loan amount, rate and tenure',
    outputFormat: 'Estimated repayment figures',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the loan amount, the annual interest rate and the term in months. Term presets are provided.',
      'Read the monthly instalment, the total interest and the total payable over the whole term.',
      'Look at the first twelve months of the amortisation table, where every row adds up to the instalment.',
      'Enter an extra monthly payment to see how much sooner the loan clears and how much interest it saves.',
    ],
    faqs: [
      {
        question: 'Why is the total interest so much more than the loan?',
        answer:
          'On a long loan at a high rate, most of the early instalments are interest rather than principal. The amortisation table shows exactly how that shifts month by month.',
      },
      {
        question: 'Does this include the fees my lender charges?',
        answer:
          'No. Processing fees, insurance, prepayment charges and GST are all outside this calculation. Your lender\'s APR — the figure that includes fees — will be higher than the rate you enter here.',
      },
      {
        question: 'What if the interest rate is zero?',
        answer:
          'The instalment becomes the amount divided by the number of months, and the schedule shows every payment as pure principal. The tool flags this rather than dividing by zero.',
      },
      {
        question: 'How is the extra payment saving worked out?',
        answer:
          'The schedule is re-run from the start with the higher payment, so the answer reflects the order interest is actually charged in rather than a shortcut formula.',
      },
    ],
  },
  {
    id: 'gst-calculator',
    name: 'GST Calculator',
    description: 'Add or remove Goods and Services Tax at any rate and see the tax component.',
    categories: ['calculator'],
    keywords: ['gst', 'tax', 'vat', 'inclusive', 'exclusive'],
    icon: 'percent',
    status: 'live',
    inputFormat: 'Amount and tax rate',
    outputFormat: 'Tax and net or gross amount',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Choose whether you are adding GST to a tax-exclusive amount or removing it from a tax-inclusive one.',
      'Enter the amount and pick the rate slab — 0%, 5%, 12%, 18% and 28% are all offered, plus the less common ones.',
      'Choose the supply type: same state splits the tax into CGST and SGST, different states charge IGST at the full rate.',
      'Copy the one-line invoice summary, or read the table showing every slab side by side.',
    ],
    faqs: [
      {
        question: 'Why is removing GST not just the rate times the amount?',
        answer:
          'Because the rate applies to the net, not the gross. Taking 18% of a tax-inclusive ₹11,800 gives ₹2,124, which overstates the tax — the correct figure is ₹1,800, from gross × 100 ÷ 118.',
      },
      {
        question: 'Does this tell me the rate for my product?',
        answer:
          'No. It applies the slab you choose. The correct rate depends on the HSN or SAC code and on notifications that change, so check the item before filing.',
      },
      {
        question: 'When is IGST charged instead of CGST and SGST?',
        answer:
          'When the supplier and the place of supply are in different states or union territories. Within one state the tax splits into two equal halves.',
      },
      {
        question: 'Is this advice for filing a return?',
        answer:
          'No. It is arithmetic on the figures you enter. Input tax credit, reverse charge, exemptions and composition schemes are not modelled.',
      },
    ],
  },
  {
    id: 'discount-calculator',
    name: 'Discount Calculator',
    description: 'Work out the sale price and the amount saved from a discount percentage.',
    categories: ['calculator'],
    keywords: ['discount', 'sale price', 'savings', 'off'],
    icon: 'percent',
    status: 'live',
    inputFormat: 'Original price and discount',
    outputFormat: 'Final price and savings',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the price and the first discount percentage. Add a second percentage to stack discounts.',
      'Compare the stacked result against what the two percentages would give if they simply added up — the tool shows both.',
      'Read the effective single percentage, which is what the stacked discounts actually come to.',
      'Add pack sizes and prices to the comparison table to see which is cheapest per unit.',
    ],
    faqs: [
      {
        question: 'Why is 20% then 10% not 30% off?',
        answer:
          'Because the second discount is calculated on the price that is left, not on the original. 20% then 10% is 28% off. The tool shows the flat total beside it so the gap is visible.',
      },
      {
        question: 'Is the retailer misleading me with stacked discounts?',
        answer:
          'Not usually — the arithmetic simply is not additive. The useful question is what the final price is, and that is the number the tool leads with.',
      },
      {
        question: 'What if I know the sale price but not the original?',
        answer:
          'Enter the discounted price and the discount percentage, and the tool works the original back out.',
      },
      {
        question: 'How does the pack comparison handle different units?',
        answer:
          'It divides price by size and labels the result per unit, whatever that unit is. A pack with a missing or zero size is skipped rather than given an invented price.',
      },
    ],
  },
  {
    id: 'profit-margin-calculator',
    name: 'Profit Margin Calculator',
    description: 'Calculate gross profit, margin and markup from cost and selling price.',
    categories: ['calculator'],
    keywords: ['profit', 'margin', 'markup', 'cost', 'revenue'],
    icon: 'trending-up',
    status: 'live',
    inputFormat: 'Cost and selling price',
    outputFormat: 'Profit, margin and markup',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Pick which pair of numbers you have: revenue and cost, a target margin, a target markup, or a per-unit price and cost.',
      'Read the margin, the markup and the cost as a share of revenue — all three, side by side.',
      'Check the bar showing how each rupee of revenue splits between cost and profit.',
      'Enter fixed costs, selling price and variable cost to get the break-even volume and the contribution per unit.',
    ],
    faqs: [
      {
        question: 'What is the difference between margin and markup?',
        answer:
          'Margin is profit as a share of the selling price; markup is profit as a share of the cost. A 50% markup is a 33.3% margin — the same money, a different denominator. Confusing the two is the most common pricing mistake.',
      },
      {
        question: 'Why does the tool refuse to show a margin when cost is above revenue?',
        answer:
          'Because there is no margin to report — that is a loss. Showing a negative margin would suggest a number that does not exist, so the tool says so instead.',
      },
      {
        question: 'What is contribution?',
        answer:
          'The selling price minus the variable cost. It is what each sale contributes towards fixed costs, and only the contribution above break-even becomes profit.',
      },
      {
        question: 'Can I use fractional quantities?',
        answer:
          'Yes. 2.5 kg of stock is a real quantity, so the tool reports the figure as given rather than flooring it to a whole unit.',
      },
    ],
  },
  {
    id: 'compound-interest-calculator',
    name: 'Compound Interest Calculator',
    description: 'Project how an investment or savings balance grows with compound interest.',
    categories: ['calculator'],
    keywords: ['compound interest', 'investment', 'savings', 'growth'],
    icon: 'banknote',
    status: 'live',
    inputFormat: 'Principal, rate, term and compounding',
    outputFormat: 'Projected growth figures',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Enter the starting amount, the annual interest rate and the number of years.',
      'Choose how often interest compounds: annually, half-yearly, quarterly, monthly or daily.',
      'Add a monthly deposit if you are investing regularly. Deposits are applied at the end of each month.',
      'Read the final amount, the interest earned, the effective annual rate and what the total is worth after inflation.',
    ],
    faqs: [
      {
        question: 'Why is the effective rate higher than the rate I entered?',
        answer:
          'Because each period\'s interest starts earning its own interest. ₹1,00,000 at 12% compounded monthly grows by 12.68% in a year, not 12%.',
      },
      {
        question: 'Are deposits at the start or the end of the month?',
        answer:
          'The end, which is the conservative assumption. A deposit at the start of the month would earn a little more, and the tool does not claim otherwise.',
      },
      {
        question: 'What does the purchasing power figure mean?',
        answer:
          'It is what the final amount would buy at today\'s prices, if inflation ran at the rate you enter for the whole term. It is usually a much smaller number than the balance.',
      },
      {
        question: 'Does this account for tax on the interest?',
        answer:
          'No. Tax, charges and any change in the rate over the term are all outside this calculation, so treat the result as an illustration rather than a forecast.',
      },
    ],
  },
  {
    id: 'reading-time-calculator',
    name: 'Reading Time Calculator',
    description: 'Estimate how long a piece of text takes to read and to speak aloud.',
    categories: ['calculator', 'productivity'],
    keywords: ['reading time', 'speaking time', 'words per minute'],
    icon: 'clock',
    status: 'live',
    inputFormat: 'Text',
    outputFormat: 'Estimated reading and speaking time',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the text you want timed. A sample is provided if you just want to see it work.',
      'Choose the reading rate: silent reading, reading aloud, technical text, or proof-reading.',
      'Read the estimated time in words, and the speaking time at 150 words per minute.',
      'Check the counts — words, characters, sentences, paragraphs, syllables — and the readability score.',
    ],
    faqs: [
      {
        question: 'Where do the words-per-minute figures come from?',
        answer:
          'The 238 figure for silent reading is an average from a 2019 meta-analysis of reading research; 183 is a typical adult reading aloud. Real rates vary by a factor of three or more between people and between texts.',
      },
      {
        question: 'Is the readability score reliable?',
        answer:
          'It is an estimate. Syllables are counted by a vowel-group rule rather than a dictionary, so unusual words and names can shift the score a little. Treat it as a signal, not a measurement.',
      },
      {
        question: 'How is a word counted?',
        answer:
          'A run of letters and numbers counts as one word, so a hyphenated or apostrophised word is not counted twice. Numbers are counted as words.',
      },
      {
        question: 'Is my text uploaded anywhere?',
        answer:
          'No. The counting happens in your browser. Nothing is sent to a server, so you can paste confidential drafts without any of it leaving the page.',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* QR & BARCODE — live                                                 */
  /* ------------------------------------------------------------------ */
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Create QR codes for links, text, contact details and Wi-Fi settings, ready to download.',
    categories: ['qr', 'productivity'],
    keywords: ['qr code', 'generator', 'link', 'vcard', 'wifi'],
    icon: 'qr',
    status: 'live',
    inputFormat: 'Text, link, Wi-Fi details or contact card',
    outputFormat: 'QR code as PNG or SVG',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Choose what the code should hold: text or a link, Wi-Fi settings, or a contact card.',
      'Type the details. The tool shows how many characters you have used against the limit for the recovery level you pick.',
      'Pick a recovery level, a pixel size and PNG or SVG output, then draw the code.',
      'Scan it with your own phone before you print it — that is the only test that matters.',
    ],
    faqs: [
      {
        question: 'Which QR error correction level should I use?',
        answer:
          'Level M (15%) is the right choice for almost everything a phone scans close up. A higher level survives more damage, but every module then carries data, so the code gets denser and harder to read from a distance. Only go to H when the code will sit on something that gets scratched or creased.',
      },
      {
        question: 'How much data fits in a QR code?',
        answer:
          'A version 40 QR code, the largest there is, holds 2,953 bytes at level M and 1,273 at level H. Digits pack far denser than letters: the same code holds 7,089 digits at level L. The tool shows your position against that ceiling as you type, rather than failing when you submit.',
      },
      {
        question: 'Do Wi-Fi QR codes really work on any phone?',
        answer:
          'Yes, on both iPhone and Android, without installing anything. The code holds the network name and password in the standard WIFI: format that the built-in cameras recognise. Special characters inside the name or password are escaped so a network called "Cafe; Guest" does not break the code.',
      },
      {
        question: 'Is my data uploaded when I generate a QR code?',
        answer:
          'No. The code is drawn in your browser and nothing is sent anywhere, which is why this is safe for Wi-Fi passwords and private contact details.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Nothing you encode is uploaded.',
  },
  {
    id: 'barcode-generator',
    name: 'Barcode Generator',
    description: 'Generate common 1D barcodes such as Code 128 and EAN-13 for printing.',
    categories: ['qr', 'productivity'],
    keywords: ['barcode', 'code 128', 'ean', 'upc', 'generator'],
    icon: 'barcode',
    status: 'live',
    inputFormat: 'Text or number, in the format of your choice',
    outputFormat: 'Barcode as an SVG image',
    processingMode: 'client',
    addedAt: '2026-10-17',
    instructions: [
      'Pick the format. CODE 128 takes any printable characters, while EAN-13, EAN-8 and ITF-14 take digits only.',
      'Type the data. Leave off the final check digit and the tool works it out for you.',
      'Adjust the bar width and height with the sliders, and choose whether to print the digits underneath.',
      'Download the SVG. Print it and scan it before you rely on it.',
    ],
    faqs: [
      {
        question: 'What is a check digit, and why does the tool add one?',
        answer:
          'A check digit is a final digit calculated from the digits before it, so a scanner can tell whether it read the code correctly. If you type 12 digits for an EAN-13, the 13th is computed for you. If you type all 13 and the last one is wrong, the tool says what the correct digit is rather than drawing a barcode that will not scan.',
      },
      {
        question: 'Which barcode format should I choose?',
        answer:
          'Use EAN-13 for retail products, EAN-8 for small packaging, ITF-14 for cartons, CODE 128 when you need to encode letters and symbols, and CODE 39 when an older system requires that specific format. CODE 39 only accepts uppercase letters, digits, and - . $ / + % and space.',
      },
      {
        question: 'Why is the download an SVG rather than a PNG?',
        answer:
          'A barcode is read from the edges of its bars, and a pixel image softens those edges as it scales. An SVG stays sharp at any print size, so the bars a scanner sees are exactly the bars that were encoded.',
      },
      {
        question: 'Is my data uploaded when I generate a barcode?',
        answer:
          'No. The barcode is drawn in your browser and nothing is sent to a server.',
      },
    ],
    privacyNote: 'Runs entirely in your browser. Nothing you encode is uploaded.',
  },

  /* ------------------------------------------------------------------ */
  /* AI — live only when the backend is provisioned                      */
  /* ------------------------------------------------------------------ */
  {
    id: 'ai-text-summarizer',
    name: 'AI Text Summarizer',
    description: 'Condense a long piece of text into a short summary you can adjust.',
    categories: ['ai'],
    keywords: ['summarise', 'summarize', 'tl;dr', 'shorten'],
    icon: 'sparkles',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Text',
    outputFormat: 'Summary',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the article, report or notes you want shortened.',
      'Choose whether you want about three sentences, one paragraph, or several paragraphs.',
      'Press Summarise. The text goes to TOOLZEN’s server and then to the AI provider.',
      'Read the result before you rely on it — a summary can drop a caveat that mattered.',
    ],
    faqs: [
      {
        question: 'Is my text private when I use an AI tool?',
        answer:
          'No, and this is the one category where that is true. The text is sent to TOOLZEN’s server, which forwards it to the AI provider to produce the summary. Every other tool on TOOLZEN runs entirely in your browser; these seven cannot, because producing new text needs a language model and a key that ships to a browser is a key anyone can take.',
      },
      {
        question: 'How much text can I summarise at once?',
        answer:
          'Up to 20,000 characters, which is roughly 3,000 words. The limit exists because the model has a finite context and because an endpoint that accepts unlimited text can be made expensive by a single request. The tool counts the characters as you paste.',
      },
      {
        question: 'Will the summary invent things that were not in the source?',
        answer:
          'The instruction given to the model is to use only facts from the source and to say so if the text is too short to summarise. That reduces invention but does not eliminate it. Treat the summary as a draft and check anything you intend to publish.',
      },
      {
        question: 'Does it cost me anything?',
        answer:
          'No. There is no charge and no account. TOOLZEN pays for the model call, which is why there is a per-visitor request limit rather than unlimited use.',
      },
    ],
    privacyNote:
      'Text is sent to TOOLZEN’s server and on to the AI provider to produce the result. This is the only tool category that leaves your browser.',
  },
  {
    id: 'ai-writing-assistant',
    name: 'AI Writing Assistant',
    description: 'Get help drafting and improving text for a purpose and tone you choose.',
    categories: ['ai'],
    keywords: ['writing', 'assistant', 'draft', 'tone'],
    icon: 'wand',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Brief',
    outputFormat: 'Draft text',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Describe what you need written: the topic, the audience, and the points to cover.',
      'Pick a tone and whether you want paragraphs or bullets.',
      'Press Write. Your brief goes to TOOLZEN’s server and then to the AI provider.',
      'Edit the draft. It is a starting point, not a finished piece.',
    ],
    faqs: [
      {
        question: 'What makes a good brief?',
        answer:
          'Say who it is for, what it needs to achieve, and any facts that must appear. The model is told not to add claims your brief does not support, so detail you leave out is detail the draft will not contain.',
      },
      {
        question: 'Is my brief private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider. Do not paste confidential material into any AI tool here.',
      },
      {
        question: 'Can it match a specific writing style?',
        answer:
          'It can follow a tone — neutral, friendly, formal or persuasive — and a shape, paragraphs or bullets. It does not clone a named author’s style, and asking it to would produce an imitation rather than the real thing.',
      },
      {
        question: 'Is the draft ready to publish?',
        answer:
          'No. Read it, check every factual claim, and adjust the voice. The tool produces text, not verified fact.',
      },
    ],
    privacyNote: 'Your brief is sent to TOOLZEN’s server and on to the AI provider.',
  },
  {
    id: 'ai-grammar-helper',
    name: 'AI Grammar Helper',
    description: 'Find grammar, spelling and punctuation issues and apply the suggested fixes.',
    categories: ['ai'],
    keywords: ['grammar', 'spelling', 'punctuation', 'proofread'],
    icon: 'circle-check',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Text',
    outputFormat: 'Corrected text and a list of changes',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the text you want checked.',
      'Choose how strict the check should be — clear errors only, errors and awkward phrasing, or a full tighten.',
      'Press Proofread. The text goes to TOOLZEN’s server and then to the AI provider.',
      'Compare the corrected text with the original, and read the list of changes underneath.',
    ],
    faqs: [
      {
        question: 'Will it rewrite my voice?',
        answer:
          'The instruction is to fix errors without changing your meaning or voice, and the strictness setting controls how much rephrasing is allowed. On the loosest setting it only fixes definite errors. On the strictest it may also tighten wordy phrasing, which is a matter of taste — read the changes list before accepting them.',
      },
      {
        question: 'How do I know what it changed?',
        answer:
          'The reply is split into the corrected text and a list of changes with the reason for each. If the model returns no marker, the tool shows the whole reply as corrected text rather than guessing where the boundary was.',
      },
      {
        question: 'Is my text private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider. If the text is confidential, do not paste it.',
      },
      {
        question: 'Does it catch everything?',
        answer:
          'No proofreader does. It is good at spelling, agreement and punctuation, and less reliable on meaning — a sentence can be grammatically perfect and still say the wrong thing. Read the result.',
      },
    ],
    privacyNote: 'Your text is sent to TOOLZEN’s server and on to the AI provider.',
  },
  {
    id: 'ai-email-drafting',
    name: 'AI Email Drafting',
    description: 'Draft a clear email from a short brief, with the tone and length you need.',
    categories: ['ai'],
    keywords: ['email', 'draft', 'compose', 'reply'],
    icon: 'mail',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Brief',
    outputFormat: 'Email draft with a subject line',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Describe what the email needs to say, in plain words.',
      'Pick a tone — professional, friendly, firm or apologetic — and a length.',
      'Press Draft an email. The brief goes to TOOLZEN’s server and then to the AI provider.',
      'Fill in any square-bracket placeholders before you send it.',
    ],
    faqs: [
      {
        question: 'Why are there square brackets in the draft?',
        answer:
          'The model is told never to invent dates, prices or names. When something is genuinely needed and your brief did not supply it, it leaves a clear placeholder such as [date] rather than guessing a plausible-looking value. That is deliberate.',
      },
      {
        question: 'Does it write a subject line?',
        answer:
          'Yes. The draft starts with a subject line on its own line, then the body.',
      },
      {
        question: 'Is my brief private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider. Do not describe anything confidential.',
      },
      {
        question: 'Should I send the draft as it is?',
        answer:
          'Read it first, and check the facts, the names and the placeholders. An email that reads well but states the wrong date is worse than one that reads badly.',
      },
    ],
    privacyNote: 'Your brief is sent to TOOLZEN’s server and on to the AI provider.',
  },
  {
    id: 'ai-document-assistant',
    name: 'AI Document Assistant',
    description: 'Ask questions about a document and get answers grounded in its contents.',
    categories: ['ai'],
    keywords: ['document', 'questions', 'assistant', 'q&a'],
    icon: 'file-text',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Pasted document and a question',
    outputFormat: 'Answer grounded in the document',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the document you want to ask about.',
      'Type the question underneath it.',
      'Press Answer from a document. Both go to TOOLZEN’s server and then to the AI provider.',
      'If the answer is not in the document, the tool says so instead of guessing.',
    ],
    faqs: [
      {
        question: 'What happens if the answer is not in the document?',
        answer:
          'The tool is instructed to reply "The document does not say" and stop, rather than filling the gap with general knowledge. That is the whole point of a grounded question: an answer you can trace back to a sentence you pasted.',
      },
      {
        question: 'Can I upload a PDF?',
        answer:
          'Not directly. This tool takes pasted text, so open the PDF, select the text and paste it in. A scanned PDF has no text layer to select — the PDF to Text tool explains why, and it will not run optical character recognition.',
      },
      {
        question: 'How long can the document be?',
        answer:
          'Up to 20,000 characters, roughly 3,000 words. Longer documents need to be split, because the model has a finite context and because a huge paste is expensive to process.',
      },
      {
        question: 'Is my document private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider. This is the most sensitive of the seven tools for that reason — do not paste contracts, medical records or anything confidential.',
      },
    ],
    privacyNote: 'Your document is sent to TOOLZEN’s server and on to the AI provider.',
  },
  {
    id: 'ai-translation',
    name: 'AI Translation',
    description: 'Translate text between languages while keeping the original meaning and tone.',
    categories: ['ai'],
    keywords: ['translate', 'language', 'translation'],
    icon: 'languages',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Text and target language',
    outputFormat: 'Translated text',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the text you want translated.',
      'Choose the language to translate into.',
      'Press Translate. The text goes to TOOLZEN’s server and then to the AI provider.',
      'Have a speaker check anything important before you publish it.',
    ],
    faqs: [
      {
        question: 'Which languages are supported?',
        answer:
          'Spanish, French, German, Portuguese, Hindi, Gujarati, Arabic, Chinese (Simplified), Japanese and Russian. The list is fixed rather than free text so a language name cannot carry an instruction into the prompt.',
      },
      {
        question: 'Does it keep the paragraph breaks?',
        answer:
          'Yes, the instruction is to preserve paragraph breaks and lists exactly. In practice a long document can still drift, so check the shape of the output as well as the words.',
      },
      {
        question: 'Can I trust it for a legal or medical document?',
        answer:
          'No. Machine translation can be confidently wrong on exactly the terms that matter most in those documents. Use a qualified human translator for anything with consequences.',
      },
      {
        question: 'Is my text private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider.',
      },
    ],
    privacyNote: 'Your text is sent to TOOLZEN’s server and on to the AI provider.',
  },
  {
    id: 'ai-text-rewriter',
    name: 'AI Text Rewriter',
    description: 'Rewrite text to be shorter, clearer, more formal or more casual.',
    categories: ['ai'],
    keywords: ['rewrite', 'paraphrase', 'reword', 'tone'],
    icon: 'refresh',
    status: AI_ENABLED ? 'live' : 'planned',
    inputFormat: 'Text and style',
    outputFormat: 'Rewritten text',
    processingMode: 'ai',
    addedAt: '2026-10-17',
    instructions: [
      'Paste the text you want rewritten.',
      'Choose the style: simpler, shorter, more formal, or more engaging.',
      'Press Rewrite. The text goes to TOOLZEN’s server and then to the AI provider.',
      'Check that no fact changed while the wording did.',
    ],
    faqs: [
      {
        question: 'How is this different from the Grammar Helper?',
        answer:
          'The Grammar Helper fixes errors and leaves the wording as close to yours as it can. The Rewriter changes the wording on purpose — simpler, shorter, more formal or more engaging — while keeping the meaning and the facts.',
      },
      {
        question: 'Will it drop detail when I choose Shorter?',
        answer:
          'It is instructed to cut only what does not carry meaning. That is an instruction, not a guarantee: compare the two texts before you use the shorter one, especially if it contains figures or conditions.',
      },
      {
        question: 'Can it make text pass a plagiarism checker?',
        answer:
          'That is not what it is for, and it would not be honest to claim it. Rewriting someone else’s work to disguise its origin is plagiarism whatever the wording. Use it on your own text, to say the same thing better.',
      },
      {
        question: 'Is my text private?',
        answer:
          'No. It is sent to TOOLZEN’s server and forwarded to the AI provider.',
      },
    ],
    privacyNote: 'Your text is sent to TOOLZEN’s server and on to the AI provider.',
  },
]

/** Full registry with routes derived from each tool's id. */
export const tools: Tool[] = withAiStatus(seeds, AI_ENABLED).map((tool) => ({
  ...tool,
  route: `/tools/${tool.id}`,
}))

export default tools
