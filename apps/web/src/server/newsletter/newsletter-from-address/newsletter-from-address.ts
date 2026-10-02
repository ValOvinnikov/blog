// Resend's own shared testing sender — the fallback used until
// `NEWSLETTER_FROM_ADDRESS` is configured with a verified sending domain.
// Mirrors `@blog/auth`'s magic-link `from`-address default exactly (same
// Resend testing sender, different display name).
const DEFAULT_NEWSLETTER_FROM_ADDRESS = 'Newsletter <onboarding@resend.dev>';

export const resolveNewsletterFromAddress = (
  configuredFromAddress: string | undefined,
): string => {
  return configuredFromAddress ?? DEFAULT_NEWSLETTER_FROM_ADDRESS;
};
