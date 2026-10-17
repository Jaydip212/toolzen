export type FileCategory =
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'archive'
  | 'code'
  | 'data'
  | 'font'
  | 'executable'
  | 'other'

export interface CategoryInfo {
  id: FileCategory
  label: string
  description: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'image', label: 'Image', description: 'Raster or vector graphics.' },
  { id: 'document', label: 'Document', description: 'Text documents, PDFs and office files.' },
  { id: 'audio', label: 'Audio', description: 'Sound recordings.' },
  { id: 'video', label: 'Video', description: 'Moving images.' },
  { id: 'archive', label: 'Archive', description: 'Compressed or bundled files.' },
  { id: 'code', label: 'Code', description: 'Source files a compiler or interpreter reads.' },
  { id: 'data', label: 'Data', description: 'Structured data and configuration.' },
  { id: 'font', label: 'Font', description: 'Typeface files.' },
  { id: 'executable', label: 'Executable', description: 'Programs and installers.' },
  { id: 'other', label: 'Other', description: 'Not a common extension.' },
]

export interface ExtensionInfo {
  mime: string
  category: FileCategory
  description: string
}

/**
 * A hand-maintained table of common extensions.
 *
 * Deliberately not exhaustive: it covers the formats a person is likely to
 * meet, and says "not in this table" rather than guessing for anything else.
 */
export const EXTENSION_MAP: Record<string, ExtensionInfo> = {
  /* images */
  jpg: { mime: 'image/jpeg', category: 'image', description: 'JPEG photo, lossy compression' },
  jpeg: { mime: 'image/jpeg', category: 'image', description: 'JPEG photo, lossy compression' },
  png: { mime: 'image/png', category: 'image', description: 'PNG image, lossless with transparency' },
  gif: { mime: 'image/gif', category: 'image', description: 'GIF image, up to 256 colours, can animate' },
  webp: { mime: 'image/webp', category: 'image', description: 'WebP image, lossy or lossless' },
  avif: { mime: 'image/avif', category: 'image', description: 'AVIF image based on AV1' },
  bmp: { mime: 'image/bmp', category: 'image', description: 'Bitmap image, uncompressed' },
  tif: { mime: 'image/tiff', category: 'image', description: 'TIFF image, common in scanning and print' },
  tiff: { mime: 'image/tiff', category: 'image', description: 'TIFF image, common in scanning and print' },
  svg: { mime: 'image/svg+xml', category: 'image', description: 'Scalable vector graphic, an XML document' },
  ico: { mime: 'image/x-icon', category: 'image', description: 'Windows icon' },
  heic: { mime: 'image/heic', category: 'image', description: 'HEIC photo from an Apple device' },

  /* documents */
  pdf: { mime: 'application/pdf', category: 'document', description: 'Portable Document Format' },
  doc: { mime: 'application/msword', category: 'document', description: 'Word document (legacy binary)' },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
    description: 'Word document (Office Open XML)',
  },
  xls: { mime: 'application/vnd.ms-excel', category: 'document', description: 'Excel spreadsheet (legacy binary)' },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'document',
    description: 'Excel spreadsheet (Office Open XML)',
  },
  ppt: { mime: 'application/vnd.ms-powerpoint', category: 'document', description: 'PowerPoint presentation (legacy)' },
  pptx: {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'document',
    description: 'PowerPoint presentation (Office Open XML)',
  },
  odt: { mime: 'application/vnd.oasis.opendocument.text', category: 'document', description: 'OpenDocument text' },
  ods: { mime: 'application/vnd.oasis.opendocument.spreadsheet', category: 'document', description: 'OpenDocument spreadsheet' },
  rtf: { mime: 'application/rtf', category: 'document', description: 'Rich Text Format' },
  txt: { mime: 'text/plain', category: 'document', description: 'Plain text' },
  md: { mime: 'text/markdown', category: 'document', description: 'Markdown' },
  epub: { mime: 'application/epub+zip', category: 'document', description: 'EPUB e-book' },

  /* audio */
  mp3: { mime: 'audio/mpeg', category: 'audio', description: 'MP3 audio, lossy' },
  wav: { mime: 'audio/wav', category: 'audio', description: 'WAV audio, uncompressed' },
  flac: { mime: 'audio/flac', category: 'audio', description: 'FLAC audio, lossless' },
  aac: { mime: 'audio/aac', category: 'audio', description: 'AAC audio' },
  ogg: { mime: 'audio/ogg', category: 'audio', description: 'Ogg audio, usually Vorbis or Opus' },
  m4a: { mime: 'audio/mp4', category: 'audio', description: 'AAC audio in an MP4 container' },

  /* video */
  mp4: { mime: 'video/mp4', category: 'video', description: 'MP4 video' },
  webm: { mime: 'video/webm', category: 'video', description: 'WebM video' },
  mkv: { mime: 'video/x-matroska', category: 'video', description: 'Matroska video container' },
  mov: { mime: 'video/quicktime', category: 'video', description: 'QuickTime video' },
  avi: { mime: 'video/x-msvideo', category: 'video', description: 'AVI video' },

  /* archives */
  zip: { mime: 'application/zip', category: 'archive', description: 'ZIP archive' },
  rar: { mime: 'application/vnd.rar', category: 'archive', description: 'RAR archive' },
  '7z': { mime: 'application/x-7z-compressed', category: 'archive', description: '7-Zip archive' },
  tar: { mime: 'application/x-tar', category: 'archive', description: 'TAR archive, uncompressed' },
  gz: { mime: 'application/gzip', category: 'archive', description: 'Gzip-compressed file' },
  bz2: { mime: 'application/x-bzip2', category: 'archive', description: 'Bzip2-compressed file' },
  xz: { mime: 'application/x-xz', category: 'archive', description: 'XZ-compressed file' },

  /* code */
  html: { mime: 'text/html', category: 'code', description: 'HTML document' },
  htm: { mime: 'text/html', category: 'code', description: 'HTML document' },
  css: { mime: 'text/css', category: 'code', description: 'Cascading Style Sheet' },
  js: { mime: 'text/javascript', category: 'code', description: 'JavaScript source' },
  mjs: { mime: 'text/javascript', category: 'code', description: 'JavaScript module' },
  ts: { mime: 'text/typescript', category: 'code', description: 'TypeScript source' },
  tsx: { mime: 'text/typescript', category: 'code', description: 'TypeScript with JSX' },
  jsx: { mime: 'text/javascript', category: 'code', description: 'JavaScript with JSX' },
  py: { mime: 'text/x-python', category: 'code', description: 'Python source' },
  java: { mime: 'text/x-java', category: 'code', description: 'Java source' },
  c: { mime: 'text/x-c', category: 'code', description: 'C source' },
  h: { mime: 'text/x-c', category: 'code', description: 'C or C++ header' },
  cpp: { mime: 'text/x-c++', category: 'code', description: 'C++ source' },
  rs: { mime: 'text/x-rust', category: 'code', description: 'Rust source' },
  go: { mime: 'text/x-go', category: 'code', description: 'Go source' },
  rb: { mime: 'text/x-ruby', category: 'code', description: 'Ruby source' },
  php: { mime: 'application/x-httpd-php', category: 'code', description: 'PHP source' },
  sh: { mime: 'application/x-sh', category: 'code', description: 'Shell script' },
  sql: { mime: 'application/sql', category: 'code', description: 'SQL script' },

  /* data */
  json: { mime: 'application/json', category: 'data', description: 'JSON data' },
  xml: { mime: 'application/xml', category: 'data', description: 'XML document' },
  csv: { mime: 'text/csv', category: 'data', description: 'Comma-separated values' },
  tsv: { mime: 'text/tab-separated-values', category: 'data', description: 'Tab-separated values' },
  yaml: { mime: 'application/yaml', category: 'data', description: 'YAML configuration' },
  yml: { mime: 'application/yaml', category: 'data', description: 'YAML configuration' },
  toml: { mime: 'application/toml', category: 'data', description: 'TOML configuration' },
  ini: { mime: 'text/plain', category: 'data', description: 'INI configuration' },
  log: { mime: 'text/plain', category: 'data', description: 'Log file' },
  parquet: { mime: 'application/vnd.apache.parquet', category: 'data', description: 'Apache Parquet columnar data' },
  sqlite: { mime: 'application/vnd.sqlite3', category: 'data', description: 'SQLite database' },

  /* fonts */
  woff: { mime: 'font/woff', category: 'font', description: 'Web Open Font Format' },
  woff2: { mime: 'font/woff2', category: 'font', description: 'Web Open Font Format 2, compressed' },
  ttf: { mime: 'font/ttf', category: 'font', description: 'TrueType font' },
  otf: { mime: 'font/otf', category: 'font', description: 'OpenType font' },

  /* executables */
  exe: { mime: 'application/vnd.microsoft.portable-executable', category: 'executable', description: 'Windows executable' },
  msi: { mime: 'application/x-msi', category: 'executable', description: 'Windows installer' },
  dmg: { mime: 'application/x-apple-diskimage', category: 'executable', description: 'macOS disk image' },
  pkg: { mime: 'application/x-newton-compatible-pkg', category: 'executable', description: 'macOS installer package' },
  deb: { mime: 'application/vnd.debian.binary-package', category: 'executable', description: 'Debian package' },
  rpm: { mime: 'application/x-rpm', category: 'executable', description: 'RPM package' },
  apk: { mime: 'application/vnd.android.package-archive', category: 'executable', description: 'Android app package' },
  iso: { mime: 'application/x-iso9660-image', category: 'executable', description: 'Disc image' },
}

/** The lowercased extension from a filename or a bare extension. */
export function extractExtension(input: string): string {
  let value = input.trim().toLowerCase()
  if (value === '') return ''

  // Strip a path and a query string.
  value = value.split(/[/\\]/).pop() ?? value
  value = value.split(/[?#]/)[0]

  // A bare extension such as ".png" or "png".
  if (value.startsWith('.')) value = value.slice(1)

  const dot = value.lastIndexOf('.')
  if (dot === -1) {
    // "png" is a bare extension; "README" is a filename with none. Extension
    // names are short and alphanumeric, so length is the honest discriminator.
    return /^[a-z0-9]{1,5}$/.test(value) ? value : ''
  }
  return value.slice(dot + 1)
}

/** The name part of a filename, without the extension. */
export function baseName(input: string): string {
  const value = (input.split(/[/\\]/).pop() ?? input).split(/[?#]/)[0]
  const dot = value.lastIndexOf('.')
  return dot <= 0 ? value : value.slice(0, dot)
}

export interface ExtensionReport {
  extension: string
  mime: string | null
  category: FileCategory
  description: string
  known: boolean
}

/** Look up an extension, reporting honestly when it is not in the table. */
export function describeExtension(input: string): ExtensionReport {
  const extension = extractExtension(input)
  const info = EXTENSION_MAP[extension]

  if (!info) {
    return {
      extension,
      mime: null,
      category: 'other',
      description:
        extension === ''
          ? 'No extension was found in that input.'
          : `“${extension}” is not in this table. That does not mean it is invalid — only that this tool has no recorded type for it.`,
      known: false,
    }
  }

  return {
    extension,
    mime: info.mime,
    category: info.category,
    description: info.description,
    known: true,
  }
}

/** Every extension for a category, sorted. */
export function extensionsInCategory(category: FileCategory): string[] {
  return Object.keys(EXTENSION_MAP)
    .filter((extension) => EXTENSION_MAP[extension].category === category)
    .sort()
}

/** Search the table by extension, description or MIME type. */
export function searchExtensions(query: string): Array<{ extension: string; info: ExtensionInfo }> {
  const needle = query.trim().toLowerCase()
  const entries = Object.entries(EXTENSION_MAP).map(([extension, info]) => ({ extension, info }))
  if (needle === '') return entries.sort((a, b) => a.extension.localeCompare(b.extension))

  return entries
    .filter(
      (entry) =>
        entry.extension.includes(needle) ||
        entry.info.description.toLowerCase().includes(needle) ||
        entry.info.mime.includes(needle) ||
        entry.info.category.includes(needle),
    )
    .sort((a, b) => a.extension.localeCompare(b.extension))
}

/** True for extensions that a browser will run or install. */
export function isRiskyExtension(extension: string): boolean {
  return ['exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'js', 'jar', 'apk', 'dmg', 'pkg', 'deb', 'rpm'].includes(
    extension.toLowerCase(),
  )
}
