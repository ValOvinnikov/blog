import type { TValueOf } from '@blog/config/utils';

export const CAPABILITY = {
  READER_ACCOUNTS: 'READER_ACCOUNTS',
  COMMENTS: 'COMMENTS',
  RATINGS: 'RATINGS',
  BOOKMARKS: 'BOOKMARKS',
  NEWSLETTER: 'NEWSLETTER',
  ANALYTICS: 'ANALYTICS',
  CONSENT_BANNER: 'CONSENT_BANNER',
  CONTACT_FORM: 'CONTACT_FORM',
} as const;

export type TCapability = TValueOf<typeof CAPABILITY>;

export const COMING_SOON_CAPABILITIES = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.NEWSLETTER,
] as const satisfies readonly TCapability[];
