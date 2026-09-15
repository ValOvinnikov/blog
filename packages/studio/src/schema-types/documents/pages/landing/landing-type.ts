/**
 * `page_landing`'s own `_type` name, kept in its own file so `inlineLink`,
 * `blog_author` and `link` can reference it without an import cycle back
 * through `landing.ts` — import this module directly rather than through a
 * barrel.
 */
export const PAGE_LANDING_TYPE = 'page_landing';
