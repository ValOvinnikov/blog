import type { TValueOf } from '@blog/config/utils';

export const CAPABILITY = {
  COMMENTS: 'COMMENTS',
  RATINGS: 'RATINGS',
  BOOKMARKS: 'BOOKMARKS',
  NEWSLETTER: 'NEWSLETTER',
  ANALYTICS: 'ANALYTICS',
} as const;

export type TCapability = TValueOf<typeof CAPABILITY>;
