import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Maps a registry tool id to its implementation.
 *
 * Adding a new tool means adding one entry here plus its component folder —
 * the tool page shell, routing, search and SEO all pick it up automatically.
 * A tool with no entry here is treated as "not yet implemented" and the tool
 * page renders a coming-soon notice instead of a fake control.
 *
 * Every entry is `lazy()`-loaded so a tool's dependencies (pdf-lib, pdf.js,
 * the QR encoder, …) are only downloaded when someone opens that tool. The
 * tool page renders a skeleton while the chunk arrives.
 */
const toolComponents: Record<string, LazyExoticComponent<ComponentType>> = {
  'word-counter': lazy(() => import('./word-counter')),
  'character-counter': lazy(() => import('./character-counter')),
  'case-converter': lazy(() => import('./case-converter')),
  'text-formatter': lazy(() => import('./text-formatter')),
  'text-comparison': lazy(() => import('./text-comparison')),
  'duplicate-line-remover': lazy(() => import('./duplicate-line-remover')),
  'line-sorter': lazy(() => import('./line-sorter')),
  'markdown-previewer': lazy(() => import('./markdown-previewer')),
  'diff-checker': lazy(() => import('./diff-checker')),
  'markdown-editor': lazy(() => import('./markdown-editor')),
  'color-converter': lazy(() => import('./color-converter')),
  'html-entity-encoder': lazy(() => import('./html-entity-encoder')),
  'lorem-ipsum-generator': lazy(() => import('./lorem-ipsum-generator')),
  'html-formatter': lazy(() => import('./html-formatter')),
  'css-formatter': lazy(() => import('./css-formatter')),
  'javascript-formatter': lazy(() => import('./javascript-formatter')),
  'sql-formatter': lazy(() => import('./sql-formatter')),
  'jwt-decoder': lazy(() => import('./jwt-decoder')),
  'regex-tester': lazy(() => import('./regex-tester')),
  'cron-expression-helper': lazy(() => import('./cron-expression-helper')),
  'hash-generator': lazy(() => import('./hash-generator')),
  'api-request-tester': lazy(() => import('./api-request-tester')),
  'password-strength-estimator': lazy(() => import('./password-strength-estimator')),
  'secure-password-generator': lazy(() => import('./secure-password-generator')),
  'sha256-file-hash': lazy(() => import('./sha256-file-hash')),
  'file-integrity-verification': lazy(() => import('./file-integrity-verification')),
  'security-headers-checker': lazy(() => import('./security-headers-checker')),
  'http-header-viewer': lazy(() => import('./http-header-viewer')),
  'dns-lookup': lazy(() => import('./dns-lookup')),
  'ssl-certificate-info': lazy(() => import('./ssl-certificate-info')),
  'cybersecurity-checklist-generator': lazy(() => import('./cybersecurity-checklist-generator')),
  'security-awareness-resources': lazy(() => import('./security-awareness-resources')),
  'csv-viewer': lazy(() => import('./csv-viewer')),
  'csv-to-json': lazy(() => import('./csv-to-json')),
  'json-to-csv': lazy(() => import('./json-to-csv')),
  'file-extension-checker': lazy(() => import('./file-extension-checker')),
  'file-size-converter': lazy(() => import('./file-size-converter')),
  'json-formatter': lazy(() => import('./json-formatter')),
  'xml-formatter': lazy(() => import('./xml-formatter')),
  'base64-encoder-decoder': lazy(() => import('./base64-encoder-decoder')),
  'url-encoder-decoder': lazy(() => import('./url-encoder-decoder')),
  'uuid-generator': lazy(() => import('./uuid-generator')),
  'timestamp-converter': lazy(() => import('./timestamp-converter')),
  // Calculators
  'percentage-calculator': lazy(() => import('./percentage-calculator')),
  'age-calculator': lazy(() => import('./age-calculator')),
  'date-difference-calculator': lazy(() => import('./date-difference-calculator')),
  'time-duration-calculator': lazy(() => import('./time-duration-calculator')),
  'bmi-calculator': lazy(() => import('./bmi-calculator')),
  'emi-calculator': lazy(() => import('./emi-calculator')),
  'gst-calculator': lazy(() => import('./gst-calculator')),
  'discount-calculator': lazy(() => import('./discount-calculator')),
  'profit-margin-calculator': lazy(() => import('./profit-margin-calculator')),
  'compound-interest-calculator': lazy(() => import('./compound-interest-calculator')),
  'reading-time-calculator': lazy(() => import('./reading-time-calculator')),

  // Image tools
  'image-compressor': lazy(() => import('./image-compressor')),
  'image-resizer': lazy(() => import('./image-resizer')),
  'image-cropper': lazy(() => import('./image-cropper')),
  'image-format-converter': lazy(() => import('./image-format-converter')),
  'jpg-to-png': lazy(() => import('./jpg-to-png')),
  'png-to-jpg': lazy(() => import('./png-to-jpg')),
  'webp-converter': lazy(() => import('./webp-converter')),
  'image-rotator': lazy(() => import('./image-rotator')),
  'image-flipper': lazy(() => import('./image-flipper')),
  'image-metadata-viewer': lazy(() => import('./image-metadata-viewer')),
  'image-dimensions-checker': lazy(() => import('./image-dimensions-checker')),
  'image-color-picker': lazy(() => import('./image-color-picker')),
  'image-to-pdf': lazy(() => import('./image-to-pdf')),
  'multiple-image-resizer': lazy(() => import('./multiple-image-resizer')),
  'image-background-utilities': lazy(() => import('./image-background-utilities')),
  'image-watermark': lazy(() => import('./image-watermark')),
  'base64-to-image': lazy(() => import('./base64-to-image')),
  'favicon-generator': lazy(() => import('./favicon-generator')),

  /* PDF */
  'merge-pdf': lazy(() => import('./merge-pdf')),
  'split-pdf': lazy(() => import('./split-pdf')),
  'rotate-pdf': lazy(() => import('./rotate-pdf')),
  'delete-pdf-pages': lazy(() => import('./delete-pdf-pages')),
  'extract-pdf-pages': lazy(() => import('./extract-pdf-pages')),
  'reorder-pdf-pages': lazy(() => import('./reorder-pdf-pages')),
  'organize-pdf': lazy(() => import('./organize-pdf')),
  'jpg-to-pdf': lazy(() => import('./jpg-to-pdf')),
  'png-to-pdf': lazy(() => import('./png-to-pdf')),
  'add-page-numbers': lazy(() => import('./add-page-numbers')),
  'add-watermark': lazy(() => import('./add-watermark')),
  'text-to-pdf': lazy(() => import('./text-to-pdf')),
  'pdf-to-jpg': lazy(() => import('./pdf-to-jpg')),
  'pdf-page-preview': lazy(() => import('./pdf-page-preview')),
  'pdf-to-text': lazy(() => import('./pdf-to-text')),
  'pdf-metadata-viewer': lazy(() => import('./pdf-metadata-viewer')),
  'pdf-size-analyzer': lazy(() => import('./pdf-size-analyzer')),
  'compress-pdf': lazy(() => import('./compress-pdf')),

  /* QR & barcode */
  'qr-code-generator': lazy(() => import('./qr-code-generator')),
  'barcode-generator': lazy(() => import('./barcode-generator')),
}

/** Resolve the component for a tool id, if it has been implemented. */
export function getToolComponent(id: string): LazyExoticComponent<ComponentType> | undefined {
  return toolComponents[id]
}

/** Whether a tool id has a working implementation. */
export function hasToolComponent(id: string): boolean {
  return id in toolComponents
}

/** Ids of every tool that currently has an implementation. */
export function implementedToolIds(): string[] {
  return Object.keys(toolComponents)
}
