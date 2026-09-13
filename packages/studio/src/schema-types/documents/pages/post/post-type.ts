/**
 * `page_post`'s own `_type` name, kept in its own file so a schema outside
 * `post.ts` can reference `page_post` without an import cycle back through
 * it — import this module directly rather than through a barrel.
 */
export const PAGE_POST_TYPE = 'page_post';
