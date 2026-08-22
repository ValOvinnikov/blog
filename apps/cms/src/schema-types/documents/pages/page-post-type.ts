/**
 * `page_post`'s own `_type` name. Lives in its own file (rather than being
 * imported from `page-post.ts`) so `blog_post`'s missing-page warning
 * validation can reference it without an import cycle back through
 * `page-post.ts`, which itself imports `postSchema`.
 */
export const PAGE_POST_TYPE = 'page_post';
