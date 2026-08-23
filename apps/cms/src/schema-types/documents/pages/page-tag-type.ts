/**
 * `page_tag`'s own `_type` name. Lives in its own file (rather than being
 * imported from `page-tag.ts`) so `blog_tag`'s missing-page warning
 * validation can reference it without an import cycle back through
 * `page-tag.ts`, which itself imports `tagSchema`.
 */
export const PAGE_TAG_TYPE = 'page_tag';
