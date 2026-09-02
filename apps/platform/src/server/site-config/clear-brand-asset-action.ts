'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { del } from '@vercel/blob';

export type TClearBrandAssetResult =
  { ok: true } | { ok: false; error: string };

/**
 * Returns `logoAssetUrl`/`faviconAssetUrl` to `NULL` — the site falls back
 * to its default asset the same way it did before anything was ever
 * uploaded. Idempotent: clearing an already-empty field is a no-op success,
 * not an error, so a stale "Remove" click can't fail.
 */
export const clearBrandAssetAction = async (
  tenantId: string,
  kind: TBrandAssetKind,
): Promise<TClearBrandAssetResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) {
    return { ok: false, error: 'Unrecognized upload target.' };
  }
  const targetKind = parsedKind.data;

  try {
    const current = await getSiteConfigOrDefaults(tenant.id);
    const previousUrl =
      targetKind === 'logo' ? current.logoAssetUrl : current.faviconAssetUrl;

    if (!previousUrl) return { ok: true };

    const assetUpdate =
      targetKind === 'logo'
        ? { logoAssetUrl: null }
        : { faviconAssetUrl: null };

    await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: current.preset,
      accentHue: current.accentHue,
      headingFont: current.headingFont,
      bodyFont: current.bodyFont,
      radiusScale: current.radiusScale,
      density: current.density,
      ...assetUpdate,
    });

    if (env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(previousUrl, { token: env.BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        logger.error('site_config.brand_asset_delete_failed', {
          tenantId: tenant.id,
          kind: targetKind,
          error,
        });
      }
    }

    await recordAuditEvent({
      logEvent: 'site_config.brand_asset_clear_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { asset: targetKind, operation: 'clear' },
    });

    return { ok: true };
  } catch (error) {
    logger.error('site_config.brand_asset_clear_failed', {
      tenantId: tenant.id,
      kind: targetKind,
      error,
    });
    return {
      ok: false,
      error: `Couldn't remove the ${targetKind} — try again.`,
    };
  }
};
