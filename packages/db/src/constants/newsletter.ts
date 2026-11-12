import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_POST_SEND_OUTCOME = {
  SENT: 'SENT',
  SKIPPED: 'SKIPPED',
} as const;

export type TNewsletterPostSendOutcome = TValueOf<
  typeof NEWSLETTER_POST_SEND_OUTCOME
>;

export const NEWSLETTER_SKIP_REASON = {
  OVER_SUBSCRIBER_BAND: 'OVER_SUBSCRIBER_BAND',
  OVER_MONTHLY_ALLOWANCE: 'OVER_MONTHLY_ALLOWANCE',
  REPUTATION_STOP: 'REPUTATION_STOP',
  SITE_PAUSED: 'SITE_PAUSED',
} as const;

export type TNewsletterSkipReason = TValueOf<typeof NEWSLETTER_SKIP_REASON>;

export const NEWSLETTER_LIMIT_NOTICE_KIND = {
  SUBSCRIBER_BAND_NEAR: 'SUBSCRIBER_BAND_NEAR',
  MONTHLY_ALLOWANCE_NEAR: 'MONTHLY_ALLOWANCE_NEAR',
  SENDING_PAUSED: 'SENDING_PAUSED',
} as const;

export type TNewsletterLimitNoticeKind = TValueOf<
  typeof NEWSLETTER_LIMIT_NOTICE_KIND
>;
