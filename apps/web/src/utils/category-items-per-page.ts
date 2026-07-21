/**
 * Fixed page size for category listings. Categories have no CMS-authored
 * page-size field like `page_blog.itemsPerPage` (#589) — this is the web
 * layer's own fixed choice, matching `page_blog`'s own CMS default of 9.
 * Shared by `CategoryPage`, `buildCategoryMetadata`, and the
 * `/category/[slug]/page/[page]` route's `generateStaticParams` so all
 * three call sites agree on how many pages exist.
 */
export const CATEGORY_ITEMS_PER_PAGE = 9;
