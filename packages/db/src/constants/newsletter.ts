import type { TValueOf } from '@shinefold/config/utils';

export const NEWSLETTER_POST_SEND_OUTCOME = {
  SENT: 'SENT',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const;

export type TNewsletterPostSendOutcome = TValueOf<
  typeof NEWSLETTER_POST_SEND_OUTCOME
>;

export const NEWSLETTER_LIMIT_NOTICE_KIND = {
  SUBSCRIBER_BAND_NEAR: 'SUBSCRIBER_BAND_NEAR',
  MONTHLY_ALLOWANCE_NEAR: 'MONTHLY_ALLOWANCE_NEAR',
  SENDING_PAUSED: 'SENDING_PAUSED',
  REPUTATION_PAUSED: 'REPUTATION_PAUSED',
} as const;

export type TNewsletterLimitNoticeKind = TValueOf<
  typeof NEWSLETTER_LIMIT_NOTICE_KIND
>;
