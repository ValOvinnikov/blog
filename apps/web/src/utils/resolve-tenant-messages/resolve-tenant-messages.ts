import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { applyVoiceOverrides } from '@web/utils/apply-voice-overrides';
import { logger } from '@web/utils/logger/logger';

/**
 * Applies the tenant's per-key voice overrides on top of the base locale
 * messages returned by `getMessages()`. Called from every route that builds
 * its own `NextIntlClientProvider` tree (`[tenant]/[locale]/layout.tsx`, and
 * the root `not-found.tsx`, which renders outside it) — `i18n/request.ts`'s
 * `getRequestConfig` only resolves the base, un-voiced messages since it has
 * no tenant to read. Accepts the `[tenant]` route param and forwards it to
 * `getSiteConfig`; the root `not-found.tsx` has no param to supply and falls
 * through to the header.
 */
export const resolveTenantMessages = async (
  base: Record<string, unknown>,
  tenant?: string,
): Promise<Record<string, unknown>> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('site_config.fetch_failed', { error: result.error });
    return base;
  }

  const voiceOverrides = result.data?.voiceOverrides ?? {};

  return applyVoiceOverrides(base, voiceOverrides);
};
