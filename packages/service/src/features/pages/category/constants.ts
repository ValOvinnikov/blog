/**
 * Category post pages have no CMS-authored page-size field (unlike
 * `page_blog.itemsPerPage`), so this is a fixed constant matching the blog
 * singleton's `itemsPerPage` initial value
 * (`apps/cms/src/schema-types/documents/pages/blog-page.ts`).
 */
export const CATEGORY_POSTS_PER_PAGE = 9;
