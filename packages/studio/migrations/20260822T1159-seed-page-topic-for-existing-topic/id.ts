const DRAFTS_PREFIX = 'drafts.';
const PAGE_TOPIC_PREFIX = 'page_topic-';
const POST_LIST_PREFIX = 'postList-topic-';

const withPrefix = (id: string, prefix: string): string => {
  const isDraft = id.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? id.slice(DRAFTS_PREFIX.length) : id;
  const prefixed = bare.startsWith(prefix) ? bare : `${prefix}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};

/** Fixed `page_topic` id derived from the `blog_topic` it represents. */
export const toPageTopicId = (topicId: string): string =>
  withPrefix(topicId, PAGE_TOPIC_PREFIX);

/** Fixed `module_postList` id derived from the `blog_topic` it archives. */
export const toTopicPostListId = (topicId: string): string =>
  withPrefix(topicId, POST_LIST_PREFIX);
