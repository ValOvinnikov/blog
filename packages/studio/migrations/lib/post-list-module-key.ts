import { createHash } from 'node:crypto';

const KEY_PREFIX = 'postList-';

// Hashed rather than random so a re-run of the migration computes the exact same _key instead of duplicating the array item.
export const toPostListModuleKey = (postListRef: string): string =>
  `${KEY_PREFIX}${createHash('sha1').update(postListRef).digest('hex').slice(0, 12)}`;
