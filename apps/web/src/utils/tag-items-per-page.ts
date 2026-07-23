/**
 * Fixed page size for tag archive listings. Tags have no CMS-authored
 * page-size field like `page_blog.itemsPerPage` (#589) — this is the web
 * layer's own fixed choice, matching `CATEGORY_ITEMS_PER_PAGE`. Shared by
 * `TagPage`, `buildTagMetadata`, and the `/tag/[slug]/page/[page]` route's
 * `generateStaticParams` so all three call sites agree on how many pages
 * exist.
 */
export const TAG_ITEMS_PER_PAGE = 9;
