import 'server-only';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// A brand asset is an uploaded *file*, never trusted markup rendered inline
// on a real page, so DOMPurify needs its own throwaway DOM rather than the
// app's — jsdom's recipe for server-side use (an empty window handed to the
// factory) is DOMPurify's own documented pattern for exactly this case.
const purify = createDOMPurify(new JSDOM('').window);

const URI_BEARING_ATTRIBUTES = ['href', 'xlink:href', 'src'];

// DOMPurify's default `ALLOWED_URI_REGEXP` already blocks `javascript:`, but
// it applies to every allowed attribute value (not just URI ones), so
// narrowing it globally would also strip plain numeric/text attributes like
// `cx="12"`. This hook instead runs after DOMPurify's own pass and further
// restricts the small set of attributes that are actually URIs to a
// same-document fragment or an inline `data:` URI — either has nothing to
// fetch, unlike an `http(s):`/`ftp:`/etc. reference reaching outside the
// file it shipped in.
purify.addHook('afterSanitizeAttributes', (node) => {
  for (const attrName of URI_BEARING_ATTRIBUTES) {
    const value = node.getAttribute(attrName);
    if (value && !value.startsWith('#') && !value.startsWith('data:')) {
      node.removeAttribute(attrName);
    }
  }
});

/**
 * Strips scripts, event-handler attributes, and external URI references from
 * untrusted SVG markup before it's ever written to storage. Returns
 * `undefined` when sanitization leaves nothing recognizable as an SVG (an
 * empty upload, or one that was nothing but the content this function
 * removes) — that's a rejection, not a best-effort empty file.
 */
export function sanitizeSvgMarkup(markup: string): string | undefined {
  const clean = purify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    KEEP_CONTENT: false,
  });

  return /<svg[\s>]/i.test(clean) ? clean : undefined;
}
