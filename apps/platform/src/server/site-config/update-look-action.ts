'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  HUE_MIN,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

const updateLookInputSchema = z.object({
  preset: z.enum(PRESET_ID),
  accentHue: hueSchema.refine(isAccentHueAccessible),
  logoHue: hueSchema.nullable(),
  headingFont: z.enum(FONT_CHOICE),
  bodyFont: z.enum(FONT_CHOICE),
  radiusScale: z.enum(RADIUS_SCALE),
  density: z.enum(DENSITY),
  languageSwitcherStyle: z.enum(LANGUAGE_SWITCHER_STYLE),
  cardStyle: z.enum(CARD_STYLE),
  headerControlStyle: z.enum(HEADER_CONTROL_STYLE),
});

export type TUpdateLookInput = z.input<typeof updateLookInputSchema>;
export type TUpdateLookResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TUpdateLookInput
>;

export const updateLookAction = async (
  tenantId: string,
  input: TUpdateLookInput,
): Promise<TUpdateLookResult> => {
  const parsed = updateLookInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    await queries.siteConfig.upsertSiteConfig(tenant.id, parsed.data);
    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: 'site_config.look_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: parsed.data,
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error('site_config.look_save_failed', {
      tenantId: tenant.id,
      error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
