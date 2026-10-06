import type { TValueOf } from '@blog/config/utils';

export const CONSENT_CATEGORY = {
  NECESSARY: 'NECESSARY',
  EXTERNAL_MEDIA: 'EXTERNAL_MEDIA',
} as const;

export type TConsentCategory = TValueOf<typeof CONSENT_CATEGORY>;
