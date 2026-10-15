import type { TValueOf } from '@blog/config/utils';

export const CAPABILITY = {
  COMMENTS: 'COMMENTS',
  RATINGS: 'RATINGS',
  BOOKMARKS: 'BOOKMARKS',
  NEWSLETTER: 'NEWSLETTER',
  ANALYTICS: 'ANALYTICS',
  CONSENT_BANNER: 'CONSENT_BANNER',
  CONTACT_FORM: 'CONTACT_FORM',
} as const;

export type TCapability = TValueOf<typeof CAPABILITY>;
