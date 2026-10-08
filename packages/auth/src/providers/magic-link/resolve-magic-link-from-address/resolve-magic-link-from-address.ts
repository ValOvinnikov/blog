// Resend's own shared testing sender — the fallback used until
// `MAGIC_LINK_FROM_ADDRESS` is configured with a verified sending domain.
const DEFAULT_MAGIC_LINK_FROM_ADDRESS = 'Sign in <onboarding@resend.dev>';

export function resolveMagicLinkFromAddress(
  configuredFromAddress: string | undefined,
): string {
  return configuredFromAddress ?? DEFAULT_MAGIC_LINK_FROM_ADDRESS;
}
