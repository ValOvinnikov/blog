const DRAFTS_PREFIX = 'drafts.';
const TOPIC_PREFIX = 'topic-';

/**
 * Sanity treats `drafts.` as a structural id prefix, so it has to stay
 * outermost rather than being swallowed into the new id.
 */
export const toTopicId = (categoryId: string): string => {
  const isDraft = categoryId.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? categoryId.slice(DRAFTS_PREFIX.length) : categoryId;
  const prefixed = bare.startsWith(TOPIC_PREFIX)
    ? bare
    : `${TOPIC_PREFIX}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};
