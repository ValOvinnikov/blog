import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { DOMPurify, ElementHook, NodeHook } from 'dompurify';

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
const narrowAttributeReferences: ElementHook = (node) => {
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
};

// DOMPurify's scheme check never reaches a `<style>` element's `url(...)` rules.
const narrowStyleElementReferences: NodeHook = (node) => {
  if (node.nodeName?.toLowerCase() === 'style' && node.textContent) {
    node.textContent = stripUnsafeCssUrlReferences(node.textContent);
  }
};

// Imported on first use: jsdom must stay off the load path of the page's other server actions.
const createPurify = async (): Promise<DOMPurify> => {
  const [{ default: createDOMPurify }, { JSDOM }] = await Promise.all([
    import('dompurify'),
    import('jsdom-commonjs'),
  ]);
  const purify = createDOMPurify(new JSDOM('').window);
  purify.addHook('afterSanitizeAttributes', narrowAttributeReferences);
  purify.addHook('afterSanitizeElements', narrowStyleElementReferences);
  return purify;
};

let purifyPromise: TMaybeUndefined<Promise<DOMPurify>>;

export const sanitizeSvgMarkup = async (
  markup: string,
): Promise<TMaybeUndefined<string>> => {
  purifyPromise ??= createPurify().catch((error: unknown) => {
    purifyPromise = undefined;
    throw error;
  });
  const purify = await purifyPromise;
  const clean = purify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    KEEP_CONTENT: false,
  });

  return /<svg[\s>]/i.test(clean) ? clean : undefined;
};
