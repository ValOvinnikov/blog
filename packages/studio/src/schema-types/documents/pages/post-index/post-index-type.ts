/**
 * `page_postIndex`'s own `_type` name, kept in its own file so `link`'s and
 * `inlineLink`'s internal reference options can name it without an import
 * cycle back through `post-index.ts` — import this module directly rather
 * than through a barrel.
 */
export const PAGE_POST_INDEX_TYPE = 'page_postIndex';
