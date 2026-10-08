'use server';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';
import { queries } from '@blog/db';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import type { TVoiceOverridesByLocale } from '@platform/utils/voice-fields/voice-fields';

export type TSaveVoiceOverridesResult = { ok: true } | { ok: false };

// A Voice-only save round-trips the theme columns, which upsertSiteConfig writes on every call.
export const saveVoiceOverridesAction = async (
  tenantId: string,
  overridesByLocale: TVoiceOverridesByLocale,
): Promise<TSaveVoiceOverridesResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const existing = await queries.siteConfig.getSiteConfig(tenant.id);
  const theme = existing ?? PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

  try {
    const result = await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: existing?.preset ?? PRESET_ID.CONSOLE,
      accentHue: theme.accentHue,
      logoHue: existing?.logoHue,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      radiusScale: theme.radiusScale,
      density: theme.density,
      logoAssetUrl: existing?.logoAssetUrl,
      faviconAssetUrl: existing?.faviconAssetUrl,
      voiceOverridesByLocale: overridesByLocale,
    });

    if (!result.ok) {
      logger.warn('site_config.voice_save_rejected', {
        tenantId: tenant.id,
        fieldErrorsByLocale: result.fieldErrorsByLocale,
      });
      return { ok: false };
    }

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
