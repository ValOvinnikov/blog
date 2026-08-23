const DRAFTS_PREFIX = 'drafts.';
const PAGE_TAG_PREFIX = 'page_tag-';
const POST_LIST_PREFIX = 'postList-tag-';

const withPrefix = (id: string, prefix: string): string => {
  const isDraft = id.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? id.slice(DRAFTS_PREFIX.length) : id;
  const prefixed = bare.startsWith(prefix) ? bare : `${prefix}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};

/** Fixed `page_tag` id derived from the `blog_tag` it represents. */
export const toPageTagId = (tagId: string): string =>
  withPrefix(tagId, PAGE_TAG_PREFIX);

/** Fixed `module_postList` id derived from the `blog_tag` it archives. */
export const toTagPostListId = (tagId: string): string =>
  withPrefix(tagId, POST_LIST_PREFIX);
