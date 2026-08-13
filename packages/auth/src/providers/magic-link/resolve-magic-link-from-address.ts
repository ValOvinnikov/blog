// Resend's own shared testing sender — the fallback used until
// `MAGIC_LINK_FROM_ADDRESS` is configured with a verified sending domain.
const DEFAULT_MAGIC_LINK_FROM_ADDRESS = 'Sign in <onboarding@resend.dev>';

/**
 * resolveMagicLinkFromAddress — the Auth.js Email provider's `from` address:
 * the configured `MAGIC_LINK_FROM_ADDRESS` env var when set, falling back to
 * Resend's own shared testing sender otherwise. Pure so it's testable
 * without mocking `env`/Auth.js — `magic-link-provider.ts` is the only
 * caller.
 */
export function resolveMagicLinkFromAddress(
  configuredFromAddress: string | undefined,
): string {
  return configuredFromAddress ?? DEFAULT_MAGIC_LINK_FROM_ADDRESS;
}
