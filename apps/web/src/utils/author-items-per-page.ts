/**
 * Fixed page size for author archive listings. Authors have no CMS-authored
 * page-size field like `page_blog.itemsPerPage` (#589) — this is the web
 * layer's own fixed choice, matching `CATEGORY_ITEMS_PER_PAGE` and
 * `TAG_ITEMS_PER_PAGE`. Shared by `AuthorPage`, `buildAuthorMetadata`, and
 * the `/author/[slug]/page/[page]` route's `generateStaticParams` so all
 * three call sites agree on how many pages exist.
 */
export const AUTHOR_ITEMS_PER_PAGE = 9;
