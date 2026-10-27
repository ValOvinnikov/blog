import type { TMaybeUndefined } from '@blog/config';

// Resend's shared testing sender, the fallback until a verified sending domain is configured.
export const DEFAULT_NEWSLETTER_FROM_ADDRESS =
  'Newsletter <onboarding@resend.dev>';

export const resolveNewsletterFromAddress = (
  configuredFromAddress: TMaybeUndefined<string>,
): string => {
  return configuredFromAddress ?? DEFAULT_NEWSLETTER_FROM_ADDRESS;
};
