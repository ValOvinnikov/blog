'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, VOICE_FIELDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import { logger } from '@platform/utils/logger/logger';
import type { TVoiceFieldErrorsByLocale } from '@platform/utils/voice-draft/voice-draft';
import { z } from 'zod';

const voiceFieldIdSchema = z.enum(VOICE_FIELDS.map(({ id }) => id));

const voiceOverridesByLocaleSchema = z.partialRecord(
  z.enum(LOCALE_ISO_CODES),
  z.partialRecord(voiceFieldIdSchema, z.unknown()),
);

export type TSaveVoiceOverridesResult =
  { ok: true } | { ok: false; fieldErrorsByLocale?: TVoiceFieldErrorsByLocale };

export const saveVoiceOverridesAction = async (
  tenantId: string,
  overridesByLocale: TVoiceOverridesByLocaleInput,
): Promise<TSaveVoiceOverridesResult> => {
  const parsed = voiceOverridesByLocaleSchema.safeParse(overridesByLocale);
  if (!parsed.success) return { ok: false };

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    const { preset, accentHue, headingFont, bodyFont, radiusScale, density } =
      await getSiteConfigOrDefaults(tenant.id);

    const result = await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset,
      accentHue,
      headingFont,
      bodyFont,
      radiusScale,
      density,
      voiceOverridesByLocale: parsed.data,
    });

    if (!result.ok) {
      return { ok: false, fieldErrorsByLocale: result.fieldErrorsByLocale };
    }

    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: 'site_config.voice_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { voiceOverridesByLocale: parsed.data },
    });

    return { ok: true };
  } catch (error) {
    logger.error('site_config.voice_save_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
