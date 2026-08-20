/**
 * Fixed page size for topic listings. Topics have no CMS-authored
 * page-size field like `page_blog.itemsPerPage` — this is the web layer's
 * own fixed choice, matching `page_blog`'s own CMS default of 9. Shared by
 * `TopicPage`, `buildTopicMetadata`, and the
 * `/topics/[slug]/page/[page]` route's `generateStaticParams` so all
 * three call sites agree on how many pages exist.
 */
export const TOPIC_ITEMS_PER_PAGE = 9;
