'use server';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';
import { queries } from '@blog/db';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import type { TVoiceOverrides } from '@platform/utils/voice-fields/voice-fields';

export type TSaveVoiceOverridesResult = { ok: true } | { ok: false };

/**
 * Persists the Voice tab's 19 curated overrides for the routed tenant.
 * Re-derives the tenant and re-checks membership from the session itself
 * via `requireTenantMembership` — the id only selects which tenant is in
 * scope, never an authorization decision on its own. Shared by both
 * `/tenants/[tenantId]/voice` and the membership-scoped `/dashboard/voice`
 * (via `VoicePageContent`): both resolve the same tenant id and hand it to
 * this action, so re-checking membership here is a no-op re-verification
 * rather than a second code path.
 *
 * `upsertSiteConfig` writes its typed theme columns on every call (they're
 * required, not optional), so a Voice-only save must round-trip the
 * tenant's existing theme values unchanged rather than omit them, or it
 * would silently reset whatever the Look tab last saved. A tenant with no
 * `site_config` row yet (Look never saved) falls back to the CONSOLE
 * preset's own registry defaults.
 */
export const saveVoiceOverridesAction = async (
  tenantId: string,
  overrides: TVoiceOverrides,
): Promise<TSaveVoiceOverridesResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const existing = await queries.siteConfig.getSiteConfig(tenant.id);
  const theme = existing ?? PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

  try {
    await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: existing?.preset ?? PRESET_ID.CONSOLE,
      accentHue: theme.accentHue,
      logoHue: existing?.logoHue,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      radiusScale: theme.radiusScale,
      density: theme.density,
      logoAssetUrl: existing?.logoAssetUrl,
      faviconAssetUrl: existing?.faviconAssetUrl,
      voiceOverrides: overrides,
    });
    await revalidateSiteConfig(tenant.id);

    return { ok: true };
  } catch (error) {
    logger.error('site_config.voice_save_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
