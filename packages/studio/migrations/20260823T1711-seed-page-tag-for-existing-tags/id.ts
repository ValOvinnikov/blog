import { withPrefix } from '../lib/with-prefix';

const PAGE_TAG_PREFIX = 'page_tag-';
const POST_LIST_PREFIX = 'postList-tag-';

/** Fixed `page_tag` id derived from the `blog_tag` it represents. */
export const toPageTagId = (tagId: string): string =>
  withPrefix(tagId, PAGE_TAG_PREFIX);

/** Fixed `module_postList` id derived from the `blog_tag` it archives. */
export const toTagPostListId = (tagId: string): string =>
  withPrefix(tagId, POST_LIST_PREFIX);
