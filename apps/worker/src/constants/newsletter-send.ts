import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_SEND_LOG = {
  START_FAILED: 'newsletter_send.start_failed',
  NO_TENANT_MAIL_KEY: 'newsletter_send.no_tenant_mail_key',
  NO_UNSUBSCRIBE_KEY: 'newsletter_send.no_unsubscribe_key',
  NO_PLATFORM_URL: 'newsletter_send.no_platform_url',
  SUBSCRIBERS_UNREADABLE: 'newsletter_send.subscribers_unreadable',
  PAGE_UNREADABLE: 'newsletter_send.page_unreadable',
  SEND_FAILED: 'newsletter_send.send_failed',
  OWNER_EMAIL_FAILED: 'newsletter_send.owner_email_failed',
  OWNER_EMAIL_MISSING: 'newsletter_send.owner_email_missing',
  ALERT_NO_RECIPIENTS: 'newsletter_send.alert_no_recipients',
  ALERT_FAILED: 'newsletter_send.alert_failed',
  RUN_FAILED: 'newsletter_send.run_failed',
} as const;

export const NEWSLETTER_POST_STATE = {
  READY: 'READY',
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  UNCLAIMED: 'UNCLAIMED',
} as const;

export const NEWSLETTER_SEND_PACE = {
  NORMAL: 'NORMAL',
  SLOW: 'SLOW',
  STOPPED: 'STOPPED',
} as const;

export type TNewsletterSendPace = TValueOf<typeof NEWSLETTER_SEND_PACE>;

export const NEWSLETTER_SEND_PAGE_SIZE = 50;
export const NEWSLETTER_SLOW_PAUSE_MS = 60 * 60_000;
// Resend's default rate limit is two requests a second per account.
export const NEWSLETTER_SEND_INTERVAL_MS = 500;
export const NEWSLETTER_LIMIT_NEAR_RATIO = 0.8;
export const NEWSLETTER_UNIT_MAX_RETRIES = 3;
// Resend ignores an empty idempotency key and refuses one of 256 characters or more.
export const RESEND_IDEMPOTENCY_KEY_MAX_LENGTH = 255;
const SUBSCRIBER_ID_LENGTH = 36;
export const NEWSLETTER_POST_ID_MAX_LENGTH =
  RESEND_IDEMPOTENCY_KEY_MAX_LENGTH - SUBSCRIBER_ID_LENGTH - 1;
// Resend's shared testing sender, the fallback until a verified sending domain is configured.
export const DEFAULT_NEWSLETTER_FROM_ADDRESS =
  'Newsletter <onboarding@resend.dev>';

export const NEWSLETTER_SUBSCRIBER_SEND = {
  SENT: 'SENT',
  UNREADABLE: 'UNREADABLE',
  REJECTED: 'REJECTED',
} as const;

export type TNewsletterSubscriberSend = TValueOf<
  typeof NEWSLETTER_SUBSCRIBER_SEND
>;

export const NEWSLETTER_SEND_GATE = {
  SEND: 'SEND',
  SKIPPED: 'SKIPPED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
} as const;

export const NEWSLETTER_SEND_HOOK_PREFIX = 'newsletter-post-send:';
