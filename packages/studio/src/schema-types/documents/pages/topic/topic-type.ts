/**
 * `page_topic`'s own `_type` name, kept in its own file so `blog_topic` can
 * reference it without an import cycle back through `topic.ts` — import
 * this module directly rather than through a barrel.
 */
export const PAGE_TOPIC_TYPE = 'page_topic';
