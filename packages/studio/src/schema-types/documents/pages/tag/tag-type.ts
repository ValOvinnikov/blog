/**
 * `page_tag`'s own `_type` name. Lives in its own file (rather than being
 * imported from `tag.ts`) so `blog_tag`'s missing-page warning validation
 * can reference it without an import cycle back through `tag.ts`, which
 * itself imports `tagSchema`. Import this module directly rather than
 * through the folder's `index.ts` barrel, which re-exports `pageTagSchema`
 * and would pull the same cycle back in.
 */
export const PAGE_TAG_TYPE = 'page_tag';
