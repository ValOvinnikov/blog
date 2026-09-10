import { createHash } from 'node:crypto';

const KEY_PREFIX = 'postList-';

/**
 * Derives the `modules[]` array item `_key` from the referenced
 * `module_postList` id so re-running the migration computes the exact same
 * key instead of a fresh random one each time.
 */
export const toPostListModuleKey = (postListRef: string): string =>
  `${KEY_PREFIX}${createHash('sha1').update(postListRef).digest('hex').slice(0, 12)}`;
