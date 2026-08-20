import 'server-only';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// A brand asset is an uploaded *file*, never trusted markup rendered inline
// on a real page, so DOMPurify needs its own throwaway DOM rather than the
// app's — jsdom's recipe for server-side use (an empty window handed to the
// factory) is DOMPurify's own documented pattern for exactly this case.
const purify = createDOMPurify(new JSDOM('').window);

const URI_BEARING_ATTRIBUTES = ['href', 'xlink:href', 'src'];

// Matches a CSS `url(...)` reference with optional quoting, capturing just
// the URL so it can be checked against the same fragment/`data:` allow-list
// as the URI-bearing attributes above. Presentation attributes such as
// `fill`/`stroke`/`filter`/`mask`/`clip-path`/`marker-start`/`cursor`, and a
// `<style>` element's rule text, all carry this syntax — DOMPurify's own
// scheme check doesn't reach it (`style` is in its `URI_SAFE_ATTRIBUTES`
// exempt list, and a bare `url(https://…)` never matches its href-oriented
// `ALLOWED_URI_REGEXP`).
const CSS_URL_REFERENCE_PATTERN = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

const isSameDocumentOrInlineReference = (uri: string): boolean => {
  return uri.startsWith('#') || uri.startsWith('data:');
};

const stripUnsafeCssUrlReferences = (value: string): string => {
  return value.replace(CSS_URL_REFERENCE_PATTERN, (match, _quote, uri) =>
    isSameDocumentOrInlineReference(uri) ? match : '',
  );
};

// DOMPurify's default `ALLOWED_URI_REGEXP` already blocks `javascript:`, but
// it applies to every allowed attribute value (not just URI ones), so
// narrowing it globally would also strip plain numeric/text attributes like
// `cx="12"`. These hooks instead run after DOMPurify's own pass and further
// restrict every URI reference this markup can carry — a direct attribute
// value, or a CSS `url(...)` target inside any attribute or a `<style>`
// element's text — to a same-document fragment or an inline `data:` URI:
// either has nothing to fetch, unlike an `http(s):`/`ftp:`/etc. reference
// reaching outside the file it shipped in.
purify.addHook('afterSanitizeAttributes', (node) => {
  for (const attrName of URI_BEARING_ATTRIBUTES) {
    const value = node.getAttribute(attrName);
    if (value && !isSameDocumentOrInlineReference(value)) {
      node.removeAttribute(attrName);
    }
  }

  if (!node.attributes) {
    return;
  }
  for (const attr of Array.from(node.attributes)) {
    if (
      URI_BEARING_ATTRIBUTES.includes(attr.name) ||
      !attr.value.includes('url(')
    ) {
      continue;
    }
    const sanitized = stripUnsafeCssUrlReferences(attr.value).trim();
    if (sanitized) {
      node.setAttribute(attr.name, sanitized);
    } else {
      node.removeAttribute(attr.name);
    }
  }
});

purify.addHook('afterSanitizeElements', (node) => {
  if (node.nodeName?.toLowerCase() === 'style' && node.textContent) {
    node.textContent = stripUnsafeCssUrlReferences(node.textContent);
  }
});

/**
 * Strips scripts, event-handler attributes, and external URI references from
 * untrusted SVG markup before it's ever written to storage. Returns
 * `undefined` when sanitization leaves nothing recognizable as an SVG (an
 * empty upload, or one that was nothing but the content this function
 * removes) — that's a rejection, not a best-effort empty file.
 */
export const sanitizeSvgMarkup = (markup: string): string | undefined => {
  const clean = purify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    KEEP_CONTENT: false,
  });

  return /<svg[\s>]/i.test(clean) ? clean : undefined;
};
