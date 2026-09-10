/**
 * `page_post`'s own `_type` name, in its own file so schema code that needs
 * to reference `page_post` — `objects/link.ts` and several module schemas —
 * can do so without an import cycle back through `page-post.ts`.
 */
export const PAGE_POST_TYPE = 'page_post';
