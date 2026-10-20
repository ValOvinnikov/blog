import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_RESULT = {
  CONFIRMED: 'CONFIRMED',
  CONFIRM_INVALID: 'CONFIRM_INVALID',
  CONFIRM_UNAVAILABLE: 'CONFIRM_UNAVAILABLE',
  CONFIRM_FAILED: 'CONFIRM_FAILED',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  UNSUBSCRIBE_INVALID: 'UNSUBSCRIBE_INVALID',
  UNSUBSCRIBE_FAILED: 'UNSUBSCRIBE_FAILED',
} as const;

export type TNewsletterResult = TValueOf<typeof NEWSLETTER_RESULT>;

export const NEWSLETTER_RESULT_SLUGS = {
  CONFIRMED: 'confirmed',
  CONFIRM_INVALID: 'confirm-invalid',
  CONFIRM_UNAVAILABLE: 'confirm-unavailable',
  CONFIRM_FAILED: 'confirm-failed',
  UNSUBSCRIBED: 'unsubscribed',
  UNSUBSCRIBE_INVALID: 'unsubscribe-invalid',
  UNSUBSCRIBE_FAILED: 'unsubscribe-failed',
} as const satisfies Record<TNewsletterResult, string>;
