/**
 * Markdown rendering for the Markdown Previewer and Markdown Editor.
 *
 * Rendered HTML is always passed through DOMPurify before it reaches the DOM.
 * Markdown can contain raw HTML, so sanitising is mandatory — a preview tool
 * must never become an XSS vector.
 */
import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

let hookInstalled = false

/** Make every rendered link safe to click. Installed once per page load. */
function installLinkHook(): void {
  if (hookInstalled) return
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })
  hookInstalled = true
}

/**
 * Convert Markdown to sanitised HTML.
 * The result is safe to pass to `dangerouslySetInnerHTML`.
 */
export function renderMarkdown(source: string): string {
  installLinkHook()
  const raw = marked.parse(source, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  })
}

/** Escape text for safe insertion into HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Strip Markdown syntax down to readable plain text. */
export function markdownToPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
