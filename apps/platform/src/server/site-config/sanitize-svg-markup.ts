import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const purify = createDOMPurify(new JSDOM('').window);

const URI_BEARING_ATTRIBUTES = ['href', 'xlink:href', 'src'];

const CSS_URL_REFERENCE_PATTERN = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

const isSameDocumentOrInlineReference = (uri: string): boolean => {
  return uri.startsWith('#') || uri.startsWith('data:');
};

const stripUnsafeCssUrlReferences = (value: string): string => {
  return value.replace(CSS_URL_REFERENCE_PATTERN, (match, _quote, uri) =>
    isSameDocumentOrInlineReference(uri) ? match : '',
  );
};

// Narrows every URI attribute and CSS `url(...)` to a fragment or `data:` URI; a global `ALLOWED_URI_REGEXP` would also strip numeric attributes.
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

// DOMPurify's scheme check never reaches a `<style>` element's `url(...)` rules.
purify.addHook('afterSanitizeElements', (node) => {
  if (node.nodeName?.toLowerCase() === 'style' && node.textContent) {
    node.textContent = stripUnsafeCssUrlReferences(node.textContent);
  }
});

export const sanitizeSvgMarkup = (markup: string): TMaybeUndefined<string> => {
  const clean = purify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    KEEP_CONTENT: false,
  });

  return /<svg[\s>]/i.test(clean) ? clean : undefined;
};
