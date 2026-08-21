// Resend's own shared testing sender — the fallback used until
// `NEWSLETTER_FROM_ADDRESS` is configured with a verified sending domain.
// Mirrors `@blog/auth`'s magic-link `from`-address default exactly (same
// Resend testing sender, different display name).
const DEFAULT_NEWSLETTER_FROM_ADDRESS = 'Newsletter <onboarding@resend.dev>';

/**
 * resolveNewsletterFromAddress — the newsletter confirmation email's `from`
 * address: the configured `NEWSLETTER_FROM_ADDRESS` env var when set,
 * falling back to Resend's own shared testing sender otherwise. Pure so it's
 * testable without mocking `env`/Resend — `newsletter-actions.ts` is the only
 * caller.
 */
export const resolveNewsletterFromAddress = (
  configuredFromAddress: string | undefined,
): string => {
  return configuredFromAddress ?? DEFAULT_NEWSLETTER_FROM_ADDRESS;
};
