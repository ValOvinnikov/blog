/**
 * `page_tag`'s own `_type` name, kept in its own file so `blog_tag` can
 * reference it without an import cycle back through `tag.ts` — import this
 * module directly rather than through a barrel.
 */
export const PAGE_TAG_TYPE = 'page_tag';
