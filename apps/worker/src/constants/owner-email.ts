import type { TValueOf } from '@shinefold/config/utils';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';

export const OWNER_INVITE_NUDGE_AFTER_MS = 24 * 60 * 60_000;
export const OWNER_DASHBOARD_PATH = '/dashboard';
export const OWNER_SUBSCRIBERS_PATH = '/dashboard/subscribers';
export const OWNER_STUDIO_PATH = '/dashboard/studio';
export const DEFAULT_OWNER_EMAIL_FROM_ADDRESS = `${PLATFORM_EMAIL_BRAND_NAME} <onboarding@resend.dev>`;
export const OWNER_EMAIL_SEND_FAILED_EVENT = 'owner_email.send_failed';
export const OWNER_EMAIL_RELEASE_FAILED_EVENT = 'owner_email.release_failed';

export const OWNER_NEWSLETTER_EMAIL = {
  BAND_NEAR: 'BAND_NEAR',
  EMAILS_NEAR: 'EMAILS_NEAR',
  BAND_PAUSED: 'BAND_PAUSED',
  EMAILS_PAUSED: 'EMAILS_PAUSED',
} as const;

export type TOwnerNewsletterEmail = TValueOf<typeof OWNER_NEWSLETTER_EMAIL>;
