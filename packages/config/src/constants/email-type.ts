import type { TValueOf } from '@blog/config/utils';

export const EMAIL_TYPE = {
  SIGN_IN: 'SIGN_IN',
  NEWSLETTER_CONFIRMATION: 'NEWSLETTER_CONFIRMATION',
  NEWSLETTER_ISSUE: 'NEWSLETTER_ISSUE',
} as const;

export type TEmailType = TValueOf<typeof EMAIL_TYPE>;
