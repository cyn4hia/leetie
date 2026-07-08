import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Curated problem statements: markdown → sanitized HTML. */
export function renderMarkdown(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }))
}

/** Remote problem statements arrive as HTML — sanitize only. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}
