const DRAFTS_PREFIX = 'drafts.';
const PAGE_POST_PREFIX = 'page_post-';

const withPrefix = (id: string, prefix: string): string => {
  const isDraft = id.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? id.slice(DRAFTS_PREFIX.length) : id;
  const prefixed = bare.startsWith(prefix) ? bare : `${prefix}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};

/** Fixed `page_post` id derived from the `blog_post` it represents. */
export const toPagePostId = (postId: string): string =>
  withPrefix(postId, PAGE_POST_PREFIX);
