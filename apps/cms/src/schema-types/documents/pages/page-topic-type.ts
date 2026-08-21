/**
 * `page_topic`'s own `_type` name. Lives in its own file (rather than being
 * imported from `page-topic.ts`) so `blog_topic`'s missing-page warning
 * validation can reference it without an import cycle back through
 * `page-topic.ts`, which itself imports `topicSchema`.
 */
export const PAGE_TOPIC_TYPE = 'page_topic';
