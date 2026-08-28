'use server';

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const HUE_MIN = 0;
const HUE_MAX = 360;
const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

// `chromeOn` is deliberately absent — `site_config` has no column for it, so
// nothing here can persist it (the Look form says so to the user directly).
const updateLookInputSchema = z.object({
  preset: z.enum(Object.values(PRESET_ID) as [TPresetId, ...TPresetId[]]),
  accentHue: hueSchema,
  logoHue: hueSchema.nullable(),
  headingFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  bodyFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  radiusScale: z.enum(
    Object.values(RADIUS_SCALE) as [TRadiusScale, ...TRadiusScale[]],
  ),
  density: z.enum(Object.values(DENSITY) as [TDensity, ...TDensity[]]),
});

export type TUpdateLookInput = z.input<typeof updateLookInputSchema>;
export type TUpdateLookResult = { ok: true } | { ok: false };

/**
 * The Look tab's save action, called directly from `LookForm` (not a native
 * form submission, since it gathers several controls' state at once).
 * `requireTenantMembership` re-checks the session against `tenantSlug` here
 * too — the page's own gate proves nothing about who actually invoked this
 * endpoint.
 */
export const updateLookAction = async (
  tenantSlug: string,
  input: TUpdateLookInput,
): Promise<TUpdateLookResult> => {
  const parsed = updateLookInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const { tenant } = await requireTenantMembership(tenantSlug);

  try {
    await queries.siteConfig.upsertSiteConfig(tenant.id, parsed.data);
    await revalidateSiteConfig();
    await recordAuditEvent({
      logEvent: 'site_config.look_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: parsed.data,
    });
    return { ok: true };
  } catch (error) {
    logger.error('site_config.look_save_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
