/**
 * The single DOMPurify boundary. Engine output is raw legacy-shaped HTML;
 * everything rendered into the document goes through one of these two
 * configs, mirroring the legacy call sites exactly:
 * - live preview: DOMPurify.sanitize(html) (ui.js:467)
 * - print pages:  DOMPurify.sanitize(html, { ADD_TAGS: ['page'] }) (output.js:28)
 */
import DOMPurify from 'dompurify';

export function sanitizeCards(html: string): string {
  return DOMPurify.sanitize(html);
}

export function sanitizePages(html: string): string {
  return DOMPurify.sanitize(html, { ADD_TAGS: ['page'] });
}
