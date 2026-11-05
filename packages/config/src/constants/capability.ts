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

export const READER_ACCOUNT_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
] as const satisfies readonly TCapability[];

export const COMING_SOON_CAPABILITIES = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.NEWSLETTER,
] as const satisfies readonly TCapability[];

export const LIVE_READER_ACCOUNT_CAPABILITIES: readonly TCapability[] =
  READER_ACCOUNT_CAPABILITIES.filter(
    (capability) =>
      !COMING_SOON_CAPABILITIES.some((comingSoon) => comingSoon === capability),
  );
