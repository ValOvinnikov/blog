const DRAFTS_PREFIX = 'drafts.';
const POST_LATEST_PREFIX = 'postLatest-';

/**
 * Sanity treats `drafts.` as a structural id prefix, so it has to stay
 * outermost rather than being swallowed into the new id.
 */
export const toPostLatestId = (postListId: string): string => {
  const isDraft = postListId.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? postListId.slice(DRAFTS_PREFIX.length) : postListId;
  const prefixed = bare.startsWith(POST_LATEST_PREFIX)
    ? bare
    : `${POST_LATEST_PREFIX}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};
