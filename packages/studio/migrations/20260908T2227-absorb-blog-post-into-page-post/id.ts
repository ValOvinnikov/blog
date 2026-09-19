import { withPrefix } from '../lib/with-prefix';

const PAGE_POST_PREFIX = 'page_post-';

/** Fixed `page_post` id derived from the `blog_post` it represents. */
export const toPagePostId = (postId: string): string =>
  withPrefix(postId, PAGE_POST_PREFIX);
