'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  VOICE_FIELDS,
  type TLocalizedActionResult,
  type TVoiceFieldErrorReason,
  type TVoiceFieldId,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import { toOutcome } from '@blog/utils/to-outcome';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const voiceFieldIdSchema = z.enum(VOICE_FIELDS.map(({ id }) => id));

const voiceOverridesByLocaleSchema = z.partialRecord(
  z.enum(LOCALE_ISO_CODES),
  z.partialRecord(voiceFieldIdSchema, z.unknown()),
);

export type TSaveVoiceOverridesResult = TLocalizedActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  TVoiceFieldId,
  TVoiceFieldErrorReason
>;

export const saveVoiceOverridesAction = async (
  tenantId: string,
  overridesByLocale: TVoiceOverridesByLocaleInput,
): Promise<TSaveVoiceOverridesResult> => {
  const parsed = voiceOverridesByLocaleSchema.safeParse(overridesByLocale);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrorsByLocale: {} };
  }

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
      return {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: result.error,
      };
    }

    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: SITE_CONFIG_LOG.VOICE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { voiceOverridesByLocale: parsed.data },
    });

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SITE_CONFIG_LOG.VOICE_SAVE_FAILED, {
      tenantId: tenant.id,
      error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
