import { withPrefix } from '../lib/with-prefix';

const PAGE_TOPIC_PREFIX = 'page_topic-';
const POST_LIST_PREFIX = 'postList-topic-';

/** Fixed `page_topic` id derived from the `blog_topic` it represents. */
export const toPageTopicId = (topicId: string): string =>
  withPrefix(topicId, PAGE_TOPIC_PREFIX);

/** Fixed `module_postList` id derived from the `blog_topic` it archives. */
export const toTopicPostListId = (topicId: string): string =>
  withPrefix(topicId, POST_LIST_PREFIX);
