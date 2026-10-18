import type { Category, CategoryAccent, ToolCategoryId } from '@/types/tool'

/** Accent palettes used by category cards. Literal classes keep Tailwind's JIT happy. */
export const categoryAccents = {
  indigo: {
    chip: 'bg-indigo-500/10',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  violet: {
    chip: 'bg-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  sky: {
    chip: 'bg-sky-500/10',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  emerald: {
    chip: 'bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    chip: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    chip: 'bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    chip: 'bg-cyan-500/10',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  teal: {
    chip: 'bg-teal-500/10',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  fuchsia: {
    chip: 'bg-fuchsia-500/10',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  orange: {
    chip: 'bg-orange-500/10',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  blue: {
    chip: 'bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  lime: {
    chip: 'bg-lime-500/10',
    icon: 'text-lime-600 dark:text-lime-400',
  },
} as const satisfies Record<string, CategoryAccent>

export const categories: Category[] = [
  {
    id: 'pdf',
    name: 'PDF Tools',
    shortName: 'PDF',
    tagline: 'Merge, split, compress and convert PDF documents.',
    description:
      'Work with PDF files without installing desktop software. Merge, split, rotate, compress and convert documents, and inspect page structure and metadata.',
    icon: 'file-text',
    accent: categoryAccents.rose,
  },
  {
    id: 'image',
    name: 'Image Tools',
    shortName: 'Image',
    tagline: 'Compress, resize, crop and convert images.',
    description:
      'Prepare images for the web, print or messaging apps. Resize, crop, compress and convert between common formats, and inspect image details.',
    icon: 'image',
    accent: categoryAccents.violet,
  },
  {
    id: 'document',
    name: 'Document Tools',
    shortName: 'Document',
    tagline: 'Inspect, convert and tidy up document data.',
    description:
      'Utilities for the files you work with every day: spreadsheets, structured data, plain text and document metadata.',
    icon: 'file',
    accent: categoryAccents.blue,
  },
  {
    id: 'conversion',
    name: 'File Conversion',
    shortName: 'Conversion',
    tagline: 'Convert files between formats.',
    description:
      'Move data between formats without renaming extensions or installing converters. Every conversion runs through a real conversion engine.',
    icon: 'repeat',
    accent: categoryAccents.orange,
  },
  {
    id: 'text',
    name: 'Text Tools',
    shortName: 'Text',
    tagline: 'Count, clean and transform text.',
    description:
      'Everyday writing utilities: count words and characters, change letter case, clean up duplicated lines, compare drafts and preview Markdown.',
    icon: 'type',
    accent: categoryAccents.emerald,
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    shortName: 'Developer',
    tagline: 'Format, validate and inspect code and data.',
    description:
      'A focused toolbox for developers: formatters and validators, encoders and decoders, hash and UUID generators, diffing and API request testing.',
    icon: 'code',
    accent: categoryAccents.cyan,
  },
  {
    id: 'security',
    name: 'Cybersecurity Tools',
    shortName: 'Security',
    tagline: 'Defensive checks and security awareness.',
    description:
      'Defensive and educational security utilities: password strength and generation, file hashing and integrity checks, plus public DNS, TLS and HTTP header inspection.',
    icon: 'shield',
    accent: categoryAccents.teal,
  },
  {
    id: 'calculator',
    name: 'Calculators',
    shortName: 'Calculator',
    tagline: 'Everyday maths, dates, finance and health.',
    description:
      'Straightforward calculators for percentages, dates and durations, loans and interest, pricing and health metrics. Estimates are clearly labelled.',
    icon: 'calculator',
    accent: categoryAccents.amber,
  },
  {
    id: 'qr',
    name: 'QR Code Tools',
    shortName: 'QR Code',
    tagline: 'Generate QR codes and barcodes.',
    description:
      'Create scannable QR codes and barcodes for links, contact details and short text, ready to download and print.',
    icon: 'qr',
    accent: categoryAccents.fuchsia,
  },
  {
    id: 'color',
    name: 'Color & Design Tools',
    shortName: 'Color',
    tagline: 'Pick, convert and preview colours.',
    description:
      'Design helpers for picking colours from images, converting between colour models and keeping palettes consistent.',
    icon: 'palette',
    accent: categoryAccents.indigo,
  },
  {
    id: 'productivity',
    name: 'Productivity Tools',
    shortName: 'Productivity',
    tagline: 'Small utilities that save time.',
    description:
      'Quick helpers that remove friction from daily work: counting, timing, generating identifiers and sharing information.',
    icon: 'check-square',
    accent: categoryAccents.lime,
  },
]

const categoryById = new Map<ToolCategoryId, Category>(categories.map((c) => [c.id, c]))

/** Look up a category by its identifier. */
export function getCategory(id: ToolCategoryId): Category | undefined {
  return categoryById.get(id)
}

/** Name for a category id, falling back to the raw id. */
export function categoryName(id: ToolCategoryId): string {
  return categoryById.get(id)?.name ?? id
}

/** In-app path for a category page. */
export function categoryRoute(id: ToolCategoryId): string {
  return `/category/${id}`
}
