import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_SEND_LOG = {
  START_FAILED: 'newsletter_send.start_failed',
  NOT_CONFIGURED: 'newsletter_send.not_configured',
  SUBSCRIBER_UNREADABLE: 'newsletter_send.subscriber_unreadable',
  SEND_FAILED: 'newsletter_send.send_failed',
  OWNER_EMAIL_FAILED: 'newsletter_send.owner_email_failed',
  OWNER_EMAIL_MISSING: 'newsletter_send.owner_email_missing',
  ALERT_NO_RECIPIENTS: 'newsletter_send.alert_no_recipients',
  ALERT_FAILED: 'newsletter_send.alert_failed',
} as const;

export const NEWSLETTER_POST_STATE = {
  READY: 'READY',
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;

export const NEWSLETTER_SEND_PACE = {
  NORMAL: 'NORMAL',
  SLOW: 'SLOW',
  STOPPED: 'STOPPED',
} as const;

export type TNewsletterSendPace = TValueOf<typeof NEWSLETTER_SEND_PACE>;

export const NEWSLETTER_SEND_PAGE_SIZE = 50;
export const NEWSLETTER_SLOW_SENDS_PER_HOUR = 50;
export const NEWSLETTER_SLOW_PAUSE_MS = 60 * 60_000;
// Resend's default rate limit is two requests a second per account.
export const NEWSLETTER_SEND_INTERVAL_MS = 500;
// A run re-reads a scheduled post at least daily, so a re-dated or unpublished post is noticed.
export const NEWSLETTER_SCHEDULE_RECHECK_MS = 24 * 60 * 60_000;
export const NEWSLETTER_LIMIT_NEAR_RATIO = 0.8;
export const NEWSLETTER_UNIT_MAX_RETRIES = 3;
// Resend's shared testing sender, the fallback until a verified sending domain is configured.
export const DEFAULT_NEWSLETTER_FROM_ADDRESS =
  'Newsletter <onboarding@resend.dev>';

export const NEWSLETTER_SEND_GATE = {
  SEND: 'SEND',
  SKIPPED: 'SKIPPED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
} as const;
