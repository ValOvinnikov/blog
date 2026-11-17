import type { TValueOf } from '@shinefold/config/utils';

export const EMAIL_TYPE = {
  SIGN_IN: 'SIGN_IN',
  INVITE: 'INVITE',
  NEWSLETTER_CONFIRMATION: 'NEWSLETTER_CONFIRMATION',
  NEWSLETTER_ISSUE: 'NEWSLETTER_ISSUE',
} as const;

export type TEmailType = TValueOf<typeof EMAIL_TYPE>;
