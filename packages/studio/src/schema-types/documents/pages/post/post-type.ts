/**
 * `page_post`'s own `_type` name, in its own file so schema code that needs
 * to reference `page_post` — `objects/link.ts` and several module schemas —
 * can do so without an import cycle back through `post.ts`. Import this
 * module directly rather than through the folder's `index.ts` barrel, which
 * re-exports `pagePostSchema` and would pull the same cycle back in.
 */
export const PAGE_POST_TYPE = 'page_post';
